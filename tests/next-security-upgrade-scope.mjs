// Separate authorization for the owner's explicit Next security update.
// Do not widen any historical UI/data allowlist or refresh its baseline.
// tests/next-security-upgrade.test.mjs proves the exact permitted contents.
export const NEXT_SECURITY_UPGRADE_BASE = '042333fd81256623847b3149222a2971fec569b3'
export const NEXT_SECURITY_SOURCE_VERSION = '16.4.1'
export const NEXT_SECURITY_TARGET_VERSION = '16.4.6'
export const NEXT_SECURITY_UPGRADE_FILES = Object.freeze([
  'package.json',
  'pnpm-lock.yaml',
  'next.config.mjs',
])
export const nextSecurityUpgradeAllowsFileChange = path => NEXT_SECURITY_UPGRADE_FILES.includes(path)
