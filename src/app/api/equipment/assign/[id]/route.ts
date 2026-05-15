import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notes } = body

    const assignment = await db.$transaction(async (tx) => {
      const a = await tx.equipmentAssignment.update({
        where: { id },
        data: { status: 'DEVUELTO', returnedDate: new Date(), notes },
      })
      // Set item back to available
      await tx.equipmentItem.update({ where: { id: a.itemId }, data: { status: 'DISPONIBLE' } })
      return a
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Return assignment error:', error)
    return NextResponse.json({ error: 'Error al devolver equipo' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.equipmentAssignment.delete({ where: { id } })
    return NextResponse.json({ message: 'Asignación eliminada' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json({ error: 'Error al eliminar asignación' }, { status: 500 })
  }
}
