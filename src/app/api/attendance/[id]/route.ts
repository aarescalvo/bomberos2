import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { checkOut, status, notes } = body

    const data: Record<string, unknown> = {}
    if (checkOut) data.checkOut = new Date(checkOut)
    if (status) data.status = status
    if (notes) data.notes = notes

    const record = await db.attendance.update({
      where: { id },
      data,
      include: { personnel: true },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Update attendance error:', error)
    return NextResponse.json({ error: 'Error al actualizar asistencia' }, { status: 500 })
  }
}
