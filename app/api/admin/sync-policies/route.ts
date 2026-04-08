import { getClientIp } from '@/lib/ip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getAllJellyfinUsers, applySubscribedProfile, applyUnsubscribedProfile, resolveSubscribedFolderIds } from '@/lib/jellyfin'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = getTokenFromCookies(request)
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Session invalide.' }, { status: 401 })

  if (!payload.isAdmin && !(payload.email && isAdminEmail(payload.email))) {
    return NextResponse.json({ success: false, error: 'Accès refusé.' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const now = new Date()

  try {
    // Résoudre les folder IDs une seule fois (évite 46 appels à /Library/VirtualFolders)
    const subscribedFolderIds = await resolveSubscribedFolderIds()

    // Récupérer tous les utilisateurs ZFlix avec leur jellyfinId et statut d'abonnement
    const [zflixUsers, jellyfinUsers] = await Promise.all([
      prisma.user.findMany({
        select: { jellyfinUserId: true, jellyfinUsername: true, isSubscribed: true, subscriptionExpiresAt: true },
      }),
      getAllJellyfinUsers(),
    ])

    // null = abonnement permanent → toujours actif (même logique que members/route.ts)
    const isUserActive = (u: { isSubscribed: boolean; subscriptionExpiresAt: Date | null }) =>
      u.isSubscribed || u.subscriptionExpiresAt === null

    const subscriptionMap = new Map<string, boolean>()
    const usernameMap = new Map<string, boolean>()
    for (const u of zflixUsers) {
      const active = isUserActive(u)
      if (u.jellyfinUserId) subscriptionMap.set(u.jellyfinUserId, active)
      if (u.jellyfinUsername) usernameMap.set(u.jellyfinUsername.toLowerCase(), active)
    }

    let applied = 0
    let skipped = 0
    const errors: string[] = []

    // Traiter chaque compte Jellyfin (sauf les admins Jellyfin)
    for (const jUser of jellyfinUsers) {
      if (jUser.Policy?.IsAdministrator) { skipped++; continue }

      // Déterminer si ce compte a un abonnement actif
      let isActive: boolean
      if (subscriptionMap.has(jUser.Id)) {
        isActive = subscriptionMap.get(jUser.Id)!
      } else if (usernameMap.has(jUser.Name.toLowerCase())) {
        isActive = usernameMap.get(jUser.Name.toLowerCase())!
      } else {
        // Compte Jellyfin-only (pas de ZFlix) → considéré actif
        isActive = true
      }

      try {
        if (isActive) {
          await applySubscribedProfile(jUser.Id, subscribedFolderIds)
        } else {
          await applyUnsubscribedProfile(jUser.Id)
        }
        applied++
      } catch (err) {
        errors.push(`${jUser.Name}: ${err instanceof Error ? err.message : 'erreur'}`)
      }
    }

    await logAudit({
      userId: payload.userId,
      action: 'ADMIN_SYNC_POLICIES',
      details: { applied, skipped, errors: errors.length },
      ipAddress: ip,
    })

    // Log les erreurs détaillées côté serveur
    if (errors.length > 0) console.error('[sync-policies] Errors:', errors)

    return NextResponse.json({ success: true, data: { applied, skipped, errors } })
  } catch (error) {
    console.error('[admin/sync-policies]', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur.' }, { status: 500 })
  }
}
