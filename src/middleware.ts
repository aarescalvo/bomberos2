import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Role permissions map
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Full access
  oficial: [
    'dashboard', 'personal', 'incidentes', 'guardias', 'asistencias',
    'flota', 'inventario', 'puntajes', 'alertas', 'pagos', 'novedades',
    'documents', 'settings',
    // Can read most things but cannot manage users or delete
  ],
  bombero: [
    'dashboard', 'asistencias', 'inventario', 'puntajes', 'alertas', 'novedades',
    // Read-only access to limited modules
  ],
}

// Admin-only API routes (POST/PUT/DELETE for users, settings)
const ADMIN_ONLY_MUTATIONS = [
  '/api/users',
  '/api/settings',
]

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

    // Check admin-only routes for non-admin users
    if (payload.role !== 'admin') {
      const method = request.method
      const isAdminOnly = ADMIN_ONLY_MUTATIONS.some(route => pathname.startsWith(route))
      if (isAdminOnly && method !== 'GET') {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
      }
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
