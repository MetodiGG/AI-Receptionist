const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [
      { source: '/booking/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      ...['/forgot-password', '/reset-password', '/account', '/login', '/admin/:path*', '/review/:path*', '/dashboard/:path*', '/dev/:path*'].map((source) => ({ source, headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }, { key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
    ]
  },
}

export default nextConfig
