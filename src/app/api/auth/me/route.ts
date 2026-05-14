import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        userId: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
