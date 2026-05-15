import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const item = await db.equipmentItem.findUnique({
      where: { id },
      include: {
        category: true,
        assignments: { include: { personnel: true }, orderBy: { assignedDate: 'desc' } },
      },
    })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    console.error('Get item error:', error)
    return NextResponse.json({ error: 'Error al obtener item' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { categoryId, code, brand, model, size, serialNumber, status, condition, purchaseDate, expiryDate, notes } = body

    const item = await db.equipmentItem.update({
      where: { id },
      data: {
        categoryId,
        code,
        brand,
        model,
        size,
        serialNumber,
        status,
        condition,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      },
      include: { category: true, assignments: { where: { status: 'ACTIVO' }, include: { personnel: true } } },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.equipmentItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Item eliminado' })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500 })
  }
}
