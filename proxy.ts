import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function setSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set('Content-Security-Policy', csp)

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer info (don't leak task URLs to external sites)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Block unused browser features
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), interest-cohort=()'
  )

  // Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDevelopment = process.env.NODE_ENV === 'development'
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const canonicalDomain = process.env.CANONICAL_DOMAIN
  if (canonicalDomain) {
    const host = request.headers.get('host')
    if (host && host !== canonicalDomain) {
      const url = request.nextUrl.clone()
      url.protocol = 'https:'
      url.host = canonicalDomain
      return setSecurityHeaders(
        NextResponse.redirect(url, { status: 301 }),
        csp
      )
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  return setSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp
  )
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
