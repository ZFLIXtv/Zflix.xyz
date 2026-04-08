import { NextResponse } from 'next/server'

export interface TrendingMovie {
  id: number
  title: string
  mediaType: 'movie' | 'tv'
  posterPath: string | null
  rating: number
  year: string
}

// Cache en mémoire — revalidé toutes les 24h
let cache: { data: TrendingMovie[]; fetchedAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000

function getOneMonthAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'TMDB_API_KEY non configurée.' }, { status: 503 })
  }

  // Retourne le cache si encore valide
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cache.data })
  }

  const oneMonthAgo = getOneMonthAgo()
  const providers = '8|119' // Netflix | Amazon Prime Video
  const base = `https://api.themoviedb.org/3/discover`
  const common = `api_key=${apiKey}&language=fr-FR&watch_region=FR&with_watch_providers=${providers}&sort_by=popularity.desc`

  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetch(`${base}/movie?${common}&release_date.lte=${oneMonthAgo}&with_original_language=fr|en`, {
        next: { revalidate: 86400 },
      }),
      fetch(`${base}/tv?${common}&first_air_date.lte=${oneMonthAgo}&with_original_language=fr|en`, {
        next: { revalidate: 86400 },
      }),
    ])

    if (!moviesRes.ok || !tvRes.ok) {
      throw new Error(`TMDB HTTP ${moviesRes.status} / ${tvRes.status}`)
    }

    const [moviesJson, tvJson] = await Promise.all([
      moviesRes.json() as Promise<{
        results: Array<{
          id: number
          title?: string
          poster_path: string | null
          vote_average: number
          release_date?: string
        }>
      }>,
      tvRes.json() as Promise<{
        results: Array<{
          id: number
          name?: string
          poster_path: string | null
          vote_average: number
          first_air_date?: string
        }>
      }>,
    ])

    const movies: TrendingMovie[] = moviesJson.results
      .filter((m) => m.poster_path)
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        title: (m.title ?? '').toUpperCase(),
        mediaType: 'movie' as const,
        posterPath: m.poster_path,
        rating: Math.round(m.vote_average * 10) / 10,
        year: (m.release_date ?? '').slice(0, 4),
      }))

    const shows: TrendingMovie[] = tvJson.results
      .filter((s) => s.poster_path)
      .slice(0, 10)
      .map((s) => ({
        id: s.id,
        title: (s.name ?? '').toUpperCase(),
        mediaType: 'tv' as const,
        posterPath: s.poster_path,
        rating: Math.round(s.vote_average * 10) / 10,
        year: (s.first_air_date ?? '').slice(0, 4),
      }))

    const combined = shuffle([...movies, ...shows]).slice(0, 6)

    cache = { data: combined, fetchedAt: Date.now() }

    return NextResponse.json({ success: true, data: combined })
  } catch (error) {
    console.error('[movies/trending]', error)
    return NextResponse.json({ success: false, error: 'Impossible de contacter TMDB.' }, { status: 502 })
  }
}
