import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next()
  }

  // Public paths that don't require authentication
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Check session using cookies
  const response = NextResponse.next()

  // Get session from cookie
  const sessionCookie = request.cookies.get('heijunka-session')
  const isLoggedIn = !!sessionCookie?.value

  if (!isLoggedIn && !isPublicPath) {
    // No session, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && pathname === '/login') {
    // User is logged in, redirect to heijunka
    const url = request.nextUrl.clone()
    url.pathname = '/heijunka'
    return NextResponse.redirect(url)
  }

  // Redirect root to heijunka or login
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = isLoggedIn ? '/heijunka' : '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
