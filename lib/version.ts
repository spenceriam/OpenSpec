// OpenSpec Version Information
// This file should be updated with each release

export const VERSION = {
  major: 0,
  minor: 5,
  patch: 0,
  // Pre-release identifiers: alpha, beta, rc, or null for stable
  prerelease: 'beta',
  // Build metadata (optional)
  build: null,
} as const

export const VERSION_STRING = (() => {
  const base = `${VERSION.major}.${VERSION.minor}.${VERSION.patch}`
  const prerelease = VERSION.prerelease ? `-${VERSION.prerelease}` : ''
  const build = VERSION.build ? `+${VERSION.build}` : ''
  return `${base}${prerelease}${build}`
})()

export const VERSION_DISPLAY = (() => {
  const version = VERSION_STRING
  const env = process.env.NODE_ENV === 'production' ? '' : ` (${process.env.NODE_ENV})`
  return `v${version}${env}`
})()

// Git commit hash (if available in build environment)
export const GIT_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown'

// Build date
export const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().split('T')[0]

// Full version info for debugging
export const VERSION_INFO = {
  version: VERSION_STRING,
  display: VERSION_DISPLAY,
  commit: GIT_COMMIT,
  buildDate: BUILD_DATE,
  env: process.env.NODE_ENV || 'development'
}