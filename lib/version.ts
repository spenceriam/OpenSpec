// OpenSpec Version Information
// Version is automatically imported from package.json to ensure synchronization

import packageJson from '../package.json'

// Parse version from package.json (e.g., "0.5.4-beta" -> {major: 0, minor: 5, patch: 4, prerelease: 'beta'})
const parseVersion = (versionString: string) => {
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+))?(?:\+(\w+))?$/
  const match = versionString.match(versionRegex)
  
  if (!match) {
    throw new Error(`Invalid version format: ${versionString}`)
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
  }
}

// Automatically sync version from package.json
export const VERSION = parseVersion(packageJson.version) as const

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