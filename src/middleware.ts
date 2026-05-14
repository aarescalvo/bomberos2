import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't need auth
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/seed')) {
    return NextResponse.next()
  }

  // Check auth for API routes
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    // Add user info to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-role', payload.role)
    response.headers.set('x-user-name', payload.name)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
