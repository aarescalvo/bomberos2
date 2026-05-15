import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, name, email, role } = body

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Usuario, contraseña y nombre son requeridos' }, { status: 400 })
    }

    const bcrypt = (await import('bcryptjs')).default
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: { username, password: hashedPassword, name, email, role: role || 'bombero', active: true },
      select: { id: true, username: true, name: true, email: true, role: true, active: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese nombre' }, { status: 409 })
    }
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
