const FALLBACK_PATH = '/'
const AUTH_PAGE_PREFIXES = ['/login', '/register']

function isSameSiteRelativePath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  // Backslashes and control characters are normalised by browsers into other hosts or paths.
  return ![...value].some((character) => {
    const code = character.charCodeAt(0)
    return character === '\\' || code <= 0x1f || code === 0x7f
  })
}

function isAuthPage(path: string): boolean {
  return AUTH_PAGE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}?`))
}

/** Returns a safe in-app path, or "/" when the value could cause an open redirect or a login loop. */
export function sanitizeRedirectPath(value: unknown): string {
  if (typeof value !== 'string') return FALLBACK_PATH
  if (!isSameSiteRelativePath(value) || isAuthPage(value)) return FALLBACK_PATH
  return value
}
