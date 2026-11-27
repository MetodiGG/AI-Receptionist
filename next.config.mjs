const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  experimental: { agentUpgrade: 'security' },
  async headers() {
    return [
      // Also prevents same-origin analytics requests carrying raw query strings.
      { source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'strict-origin' }] },
      // Only versioned, repository-owned artwork can be reused without a
      // network check. Revocable gallery uploads and all dynamic data are exempt.
      ...['category-photos', 'service-photos', 'business-cover-photos'].map(directory => ({
        source: `/${directory}/:asset([a-z0-9_-]+-v[0-9]+).webp`,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      })),
      { source: '/booking/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/search', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'Referrer-Policy', value: 'strict-origin' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      ...['/forgot-password', '/reset-password', '/account', '/login', '/admin/:path*', '/review/:path*', '/dashboard/:path*', '/dev/:path*'].map((source) => ({ source, headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
    ]
  },
}

export default nextConfig
