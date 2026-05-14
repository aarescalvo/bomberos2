import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const personnel = await db.personnel.findMany({
      include: {
        specialties: true,
        licenses: true,
      },
      orderBy: { lastName: 'asc' },
    })
    return NextResponse.json(personnel)
  } catch (error) {
    console.error('Get personnel error:', error)
    return NextResponse.json({ error: 'Error al obtener personal' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, dni, rank, status, fitness, bloodGroup, phone, email, address, joinDate, birthDate, notes } = body

    if (!firstName || !lastName || !dni) {
      return NextResponse.json({ error: 'Nombre, apellido y DNI son requeridos' }, { status: 400 })
    }

    // Check DNI uniqueness
    const existing = await db.personnel.findUnique({ where: { dni } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe personal con ese DNI' }, { status: 409 })
    }

    const person = await db.personnel.create({
      data: {
        firstName,
        lastName,
        dni,
        rank: rank || 'Bombero',
        status: status || 'ACTIVO',
        fitness: fitness || 'APTO',
        bloodGroup,
        phone,
        email,
        address,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        birthDate: birthDate ? new Date(birthDate) : null,
        notes,
      },
      include: { specialties: true, licenses: true },
    })

    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    console.error('Create personnel error:', error)
    return NextResponse.json({ error: 'Error al crear personal' }, { status: 500 })
  }
}
