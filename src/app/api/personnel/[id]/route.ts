import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const person = await db.personnel.findUnique({
      where: { id },
      include: { specialties: true, licenses: true },
    })
    if (!person) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 })
    }
    return NextResponse.json(person)
  } catch (error) {
    console.error('Get person error:', error)
    return NextResponse.json({ error: 'Error al obtener personal' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, dni, rank, status, fitness, bloodGroup, phone, email, address, joinDate, birthDate, notes } = body

    const person = await db.personnel.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dni,
        rank,
        status,
        fitness,
        bloodGroup,
        phone,
        email,
        address,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes,
      },
      include: { specialties: true, licenses: true },
    })

    return NextResponse.json(person)
  } catch (error) {
    console.error('Update person error:', error)
    return NextResponse.json({ error: 'Error al actualizar personal' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.personnel.delete({ where: { id } })
    return NextResponse.json({ message: 'Personal eliminado' })
  } catch (error) {
    console.error('Delete person error:', error)
    return NextResponse.json({ error: 'Error al eliminar personal' }, { status: 500 })
  }
}
