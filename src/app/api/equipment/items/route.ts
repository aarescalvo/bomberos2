import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (category) where.categoryId = category
    if (status) where.status = status

    const items = await db.equipmentItem.findMany({
      where,
      include: {
        category: true,
        assignments: {
          where: { status: 'ACTIVO' },
          include: { personnel: { select: { id: true, firstName: true, lastName: true, rank: true } } },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Get items error:', error)
    return NextResponse.json({ error: 'Error al obtener items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, code, brand, model, size, serialNumber, status, condition, purchaseDate, expiryDate, notes } = body

    if (!categoryId || !code) {
      return NextResponse.json({ error: 'Categoría y código son requeridos' }, { status: 400 })
    }

    const existing = await db.equipmentItem.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un item con ese código' }, { status: 409 })
    }

    const item = await db.equipmentItem.create({
      data: {
        categoryId,
        code,
        brand,
        model,
        size,
        serialNumber,
        status: status || 'DISPONIBLE',
        condition: condition || 'NUEVO',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      },
      include: { category: true, assignments: { where: { status: 'ACTIVO' }, include: { personnel: true } } },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 })
  }
}
