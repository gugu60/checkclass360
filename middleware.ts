import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Se stiamo già sulla pagina di login, non fare nulla
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  // Se non c'è il token nel localStorage, reindirizza al login
  const token = request.cookies.get('auth_token')
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configurazione delle route da proteggere
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
} 