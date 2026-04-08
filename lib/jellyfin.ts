import { logAudit } from '@/lib/audit'

// ─── Types ────────────────────────────────────────────────────────────────────

export class JellyfinError extends Error {
  constructor(
    message: string,
    public readonly context: string,
  ) {
    super(message)
    this.name = 'JellyfinError'
  }
}

export interface JellyfinUser {
  Id: string
  Name: string
  Policy: {
    IsDisabled: boolean
  }
}

interface JellyfinNewUserResponse {
  Id: string
  Name: string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = process.env.JELLYFIN_URL
  if (!url) throw new Error('JELLYFIN_URL environment variable is not set')
  return url.replace(/\/$/, '')
}

function authHeader(): Record<string, string> {
  const key = process.env.JELLYFIN_API_KEY
  if (!key) throw new Error('JELLYFIN_API_KEY environment variable is not set')
  return {
    Authorization: `MediaBrowser Token="${key}"`,
    'Content-Type': 'application/json',
  }
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  )
}

function libraryFolderIds(): string[] {
  const films = process.env.JELLYFIN_FOLDER_FILMS ?? ''
  const series = process.env.JELLYFIN_FOLDER_SERIES ?? ''
  const animes = process.env.JELLYFIN_FOLDER_ANIMES ?? ''
  return [films, series, animes].filter(Boolean)
}

// Retourne tous les dossiers Jellyfin sauf JELLYFIN_FOLDER_EXPIRED.
// Fallback sur les variables d'env si Jellyfin est injoignable.
export async function resolveSubscribedFolderIds(): Promise<string[]> {
  const expiredId = (process.env.JELLYFIN_FOLDER_EXPIRED ?? '').trim()
  try {
    const libraries = await getJellyfinLibraries()
    const ids = libraries.map((l) => l.id)
    return expiredId ? ids.filter((id) => id !== expiredId) : ids
  } catch {
    return libraryFolderIds()
  }
}

async function handleJellyfinError(
  error: unknown,
  context: string,
): Promise<never> {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[jellyfin] ${context}:`, message)

  await logAudit({
    action: 'JELLYFIN_ERROR',
    details: { context, error: message },
  })

  throw new JellyfinError(`Erreur Jellyfin: ${context}`, context)
}

// ─── createJellyfinUser ───────────────────────────────────────────────────────

export async function createJellyfinUser(
  username: string,
  password: string,
): Promise<{ id: string; username: string }> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users/New`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        Name: username,
        Password: password,
        Policy: {
          IsAdministrator: false,
          IsDisabled: false,
          EnableMediaPlayback: true,
          EnableAllFolders: true,
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const data = (await response.json()) as JellyfinNewUserResponse
    return { id: data.Id, username: data.Name }
  } catch (error) {
    return handleJellyfinError(error, 'createJellyfinUser')
  }
}

// ─── deleteJellyfinUser ───────────────────────────────────────────────────────

export async function deleteJellyfinUser(jellyfinUserId: string): Promise<void> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'DELETE',
      headers: authHeader(),
    })

    if (!response.ok && response.status !== 404) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'deleteJellyfinUser')
  }
}

// ─── changeJellyfinPassword ───────────────────────────────────────────────────

export async function changeJellyfinPassword(
  jellyfinUserId: string,
  newPassword: string,
): Promise<void> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl()}/Users/${jellyfinUserId}/Password`,
      {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          CurrentPw: '',
          NewPw: newPassword,
          ResetPassword: true,
        }),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'changeJellyfinPassword')
  }
}

// ─── applySubscribedProfile ───────────────────────────────────────────────────

export async function applySubscribedProfile(
  jellyfinUserId: string,
  preResolvedFolderIds?: string[],
): Promise<void> {
  try {
    const folderIds = preResolvedFolderIds ?? await resolveSubscribedFolderIds()

    // GET policy complète pour merger sans écraser les autres champs
    const userRes = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })
    if (!userRes.ok) {
      const text = await userRes.text()
      throw new Error(`HTTP ${userRes.status}: ${text}`)
    }
    const userData = (await userRes.json()) as { Policy?: Record<string, unknown> }
    const currentPolicy: Record<string, unknown> = userData.Policy ?? {}

    const response = await fetchWithTimeout(
      `${baseUrl()}/Users/${jellyfinUserId}/Policy`,
      {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          ...currentPolicy,
          IsDisabled: false,
          EnableAllFolders: false,
          EnabledFolders: folderIds,
          EnableMediaPlayback: true,
          EnableAudioPlaybackTranscoding: true,
          EnableVideoPlaybackTranscoding: true,
          EnablePlaybackRemuxing: true,
          EnableContentDeletion: false,
          EnableContentDownloading: false,
        }),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'applySubscribedProfile')
  }
}

// ─── applyUnsubscribedProfile ─────────────────────────────────────────────────

export async function applyUnsubscribedProfile(
  jellyfinUserId: string,
): Promise<void> {
  try {
    const expiredFolderId = (process.env.JELLYFIN_FOLDER_EXPIRED ?? '').trim()
    const enabledFolders = expiredFolderId ? [expiredFolderId] : []

    // GET policy complète pour merger sans écraser les autres champs
    const userRes = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })
    if (!userRes.ok) {
      const text = await userRes.text()
      throw new Error(`HTTP ${userRes.status}: ${text}`)
    }
    const userData = (await userRes.json()) as { Policy?: Record<string, unknown> }
    const currentPolicy: Record<string, unknown> = userData.Policy ?? {}

    const response = await fetchWithTimeout(
      `${baseUrl()}/Users/${jellyfinUserId}/Policy`,
      {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          ...currentPolicy,
          IsDisabled: false,
          EnableAllFolders: false,
          EnabledFolders: enabledFolders,
          EnableMediaPlayback: enabledFolders.length > 0,
          EnableAudioPlaybackTranscoding: false,
          EnableVideoPlaybackTranscoding: false,
          EnablePlaybackRemuxing: false,
          EnableContentDeletion: false,
          EnableContentDownloading: false,
        }),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'applyUnsubscribedProfile')
  }
}

// ─── jellyfinUserExists ───────────────────────────────────────────────────────

export async function jellyfinUserExists(username: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const users = (await response.json()) as Array<{ Name: string }>
    return users.some(
      (u) => u.Name.toLowerCase() === username.toLowerCase(),
    )
  } catch (error) {
    return handleJellyfinError(error, 'jellyfinUserExists')
  }
}

// ─── setJellyfinAccountDisabled ───────────────────────────────────────────────

export async function setJellyfinAccountDisabled(
  jellyfinUserId: string,
  disabled: boolean,
): Promise<void> {
  try {
    // Lire la policy complète pour ne pas écraser les autres champs
    const userRes = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })
    if (!userRes.ok) {
      const text = await userRes.text()
      throw new Error(`HTTP ${userRes.status}: ${text}`)
    }
    const userData = (await userRes.json()) as { Policy?: Record<string, unknown> }
    const currentPolicy: Record<string, unknown> = userData.Policy ?? {}

    let folderPatch: Record<string, unknown> = {}
    if (!disabled) {
      // Lors de la réactivation, appliquer les dossiers abonnés (sans le dossier expiré)
      const folderIds = await resolveSubscribedFolderIds()
      folderPatch = {
        EnableAllFolders: false,
        EnabledFolders: folderIds,
        EnableMediaPlayback: true,
        EnableAudioPlaybackTranscoding: true,
        EnableVideoPlaybackTranscoding: true,
        EnablePlaybackRemuxing: true,
      }
    }

    const updatedPolicy = {
      ...currentPolicy,
      IsDisabled: disabled,
      ...(disabled
        ? { EnableMediaPlayback: false }
        : folderPatch),
    }

    const policyRes = await fetchWithTimeout(
      `${baseUrl()}/Users/${jellyfinUserId}/Policy`,
      {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(updatedPolicy),
      },
    )
    if (!policyRes.ok) {
      const text = await policyRes.text()
      throw new Error(`HTTP ${policyRes.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'setJellyfinAccountDisabled')
  }
}

// ─── getAllJellyfinUsers ───────────────────────────────────────────────────────

export interface JellyfinUserFull {
  Id: string
  Name: string
  LastLoginDate?: string
  LastActivityDate?: string
  HasPassword: boolean
  Policy: {
    IsAdministrator: boolean
    IsDisabled: boolean
    EnableMediaPlayback: boolean
  }
}

export async function getAllJellyfinUsers(): Promise<JellyfinUserFull[]> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    return (await response.json()) as JellyfinUserFull[]
  } catch (error) {
    return handleJellyfinError(error, 'getAllJellyfinUsers')
  }
}

// ─── authenticateJellyfinUser ─────────────────────────────────────────────────

export interface JellyfinAuthResult {
  id: string
  username: string
  isAdmin: boolean
}

export async function authenticateJellyfinUser(
  username: string,
  password: string,
): Promise<JellyfinAuthResult | null> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl()}/Users/AuthenticateByName`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization':
            'MediaBrowser Client="ZFlix", Device="Web", DeviceId="zflix-web", Version="1.0.0"',
        },
        body: JSON.stringify({ Username: username, Pw: password }),
      },
    )

    if (response.status === 401) return null
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const data = (await response.json()) as {
      User: { Id: string; Name: string; Policy?: { IsAdministrator?: boolean } }
    }

    return {
      id: data.User.Id,
      username: data.User.Name,
      isAdmin: data.User.Policy?.IsAdministrator ?? false,
    }
  } catch (error) {
    if (error instanceof JellyfinError) throw error
    return handleJellyfinError(error, 'authenticateJellyfinUser')
  }
}

// ─── getJellyfinLibraries ─────────────────────────────────────────────────────

export interface JellyfinLibrary {
  id: string
  name: string
  collectionType: string
}

export async function getJellyfinLibraries(): Promise<JellyfinLibrary[]> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Library/VirtualFolders`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const data = (await response.json()) as Array<{ ItemId: string; Name: string; CollectionType?: string }>
    return data.map((f) => ({
      id: f.ItemId,
      name: f.Name,
      collectionType: f.CollectionType ?? 'unknown',
    }))
  } catch (error) {
    return handleJellyfinError(error, 'getJellyfinLibraries')
  }
}

// ─── getJellyfinUserPolicy ────────────────────────────────────────────────────

export interface JellyfinUserPolicy {
  IsDisabled: boolean
  EnableAllFolders: boolean
  EnabledFolders: string[]
  EnableMediaPlayback: boolean
}

export async function getJellyfinUserPolicy(
  jellyfinUserId: string,
): Promise<JellyfinUserPolicy | null> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (response.status === 404) return null

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const data = (await response.json()) as { Policy?: Partial<JellyfinUserPolicy> }
    return {
      IsDisabled: data.Policy?.IsDisabled ?? false,
      EnableAllFolders: data.Policy?.EnableAllFolders ?? false,
      EnabledFolders: data.Policy?.EnabledFolders ?? [],
      EnableMediaPlayback: data.Policy?.EnableMediaPlayback ?? false,
    }
  } catch (error) {
    return handleJellyfinError(error, 'getJellyfinUserPolicy')
  }
}

// ─── setJellyfinUserFolders ───────────────────────────────────────────────────

export async function setJellyfinUserFolders(
  jellyfinUserId: string,
  folderIds: string[],
): Promise<void> {
  try {
    // Lire la policy complète actuelle pour ne pas écraser les autres champs
    const userRes = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (!userRes.ok) {
      const text = await userRes.text()
      throw new Error(`HTTP ${userRes.status}: ${text}`)
    }

    const userData = (await userRes.json()) as { Policy?: Record<string, unknown> }
    const currentPolicy: Record<string, unknown> = userData.Policy ?? {}

    // Merger uniquement les champs liés aux dossiers
    const updatedPolicy = {
      ...currentPolicy,
      EnableAllFolders: false,
      EnabledFolders: folderIds,
      EnableMediaPlayback: folderIds.length > 0,
    }

    const policyRes = await fetchWithTimeout(
      `${baseUrl()}/Users/${jellyfinUserId}/Policy`,
      {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(updatedPolicy),
      },
    )

    if (!policyRes.ok) {
      const text = await policyRes.text()
      throw new Error(`HTTP ${policyRes.status}: ${text}`)
    }
  } catch (error) {
    return handleJellyfinError(error, 'setJellyfinUserFolders')
  }
}

// ─── getJellyfinUser ──────────────────────────────────────────────────────────

export async function getJellyfinUser(
  jellyfinUserId: string,
): Promise<JellyfinUser | null> {
  try {
    const response = await fetchWithTimeout(`${baseUrl()}/Users/${jellyfinUserId}`, {
      method: 'GET',
      headers: authHeader(),
    })

    if (response.status === 404) return null

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    return (await response.json()) as JellyfinUser
  } catch (error) {
    return handleJellyfinError(error, 'getJellyfinUser')
  }
}
