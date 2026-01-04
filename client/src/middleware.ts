import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: [
    '/',
    '/api/scan',
    '/api/profile',
    '/api/history',
    '/((?!_next/static|_next/image|favicon.ico|auth/login|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session-token')?.value

  // 1. IF NO TOKEN: 
  if (!sessionToken) {
    // If it's the home page, just show it (Guest Mode)
    if (pathname === '/') return NextResponse.next();
    
    // Otherwise, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. IF TOKEN EXISTS: Try to verify and inject headers
  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_SECRET)
    const { payload } = await jwtVerify(sessionToken, secret)

    const userName = payload.user_name as string
    const emailAddress = payload.user_email as string
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-name', userName)
    requestHeaders.set('x-user-email', emailAddress)

    // Proceed with headers (works for / and /api/scan)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('JWT verification failed:', error)
    
    // If token is bad but they are on '/', let them see the page as a guest
    if (pathname === '/') return NextResponse.next();

    // Otherwise, clear the bad cookie and go to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('session-token')
    return response
  }
}
