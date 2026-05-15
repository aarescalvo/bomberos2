import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.equipmentCategory.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body
    if (!name) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
    }
    const category = await db.equipmentCategory.create({ data: { name, description } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}
