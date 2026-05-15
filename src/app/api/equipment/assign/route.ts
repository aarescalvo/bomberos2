import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const assignments = await db.equipmentAssignment.findMany({
      where: { status: 'ACTIVO' },
      include: {
        item: { include: { category: true } },
        personnel: { select: { id: true, firstName: true, lastName: true, rank: true } },
      },
      orderBy: { assignedDate: 'desc' },
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemId, personnelId, notes } = body

    if (!itemId || !personnelId) {
      return NextResponse.json({ error: 'Item y personal son requeridos' }, { status: 400 })
    }

    // Check item is available
    const item = await db.equipmentItem.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
    }
    if (item.status === 'ASIGNADO') {
      return NextResponse.json({ error: 'El item ya está asignado' }, { status: 409 })
    }

    // Create assignment and update item status in transaction
    const assignment = await db.$transaction(async (tx) => {
      const a = await tx.equipmentAssignment.create({
        data: { itemId, personnelId, notes },
        include: {
          item: { include: { category: true } },
          personnel: { select: { id: true, firstName: true, lastName: true, rank: true } },
        },
      })
      await tx.equipmentItem.update({ where: { id: itemId }, data: { status: 'ASIGNADO' } })
      return a
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ error: 'Error al asignar equipo' }, { status: 500 })
  }
}
