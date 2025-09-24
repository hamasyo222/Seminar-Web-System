const FALLBACKS = [
  process.env.BASE_URL,
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
  'http://localhost:3000',
] as const

function getFallbackBaseUrl(): string {
  for (const candidate of FALLBACKS) {
    if (candidate && candidate.trim().length > 0) {
      try {
        return new URL(candidate).origin
      } catch {
        // ignore invalid candidate
      }
    }
  }
  return 'http://localhost:3000'
}

const DEFAULT_BASE_URL = getFallbackBaseUrl()

type BaseSource =
  | URL
  | string
  | { nextUrl?: { origin: string } }
  | { url?: string }
  | undefined

export function getBaseUrl(source?: BaseSource): string {
  if (!source) {
    return DEFAULT_BASE_URL
  }

  if (source instanceof URL) {
    return source.origin
  }

  if (typeof source === 'string') {
    try {
      return new URL(source).origin
    } catch {
      return DEFAULT_BASE_URL
    }
  }

  const nextUrl = (source as { nextUrl?: { origin: string } }).nextUrl
  if (nextUrl && typeof nextUrl.origin === 'string' && nextUrl.origin.length > 0) {
    return nextUrl.origin
  }

  const url = (source as { url?: string }).url
  if (url && typeof url === 'string') {
    try {
      return new URL(url).origin
    } catch {
      // ignore
    }
  }

  return DEFAULT_BASE_URL
}

export function buildAbsoluteUrl(path: string, source?: BaseSource): string {
  if (!path) {
    return getBaseUrl(source)
  }

  try {
    const candidate = new URL(path)
    return candidate.toString()
  } catch {
    const base = getBaseUrl(source)
    return new URL(path, base.endsWith('/') ? base : `${base}/`).toString()
  }
}
