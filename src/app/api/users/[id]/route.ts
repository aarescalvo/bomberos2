import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, active, password } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (role !== undefined) data.role = role
    if (active !== undefined) data.active = active
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, email: true, role: true, active: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Usuario eliminado' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
