import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const records = await db.attendance.findMany({
      include: { personnel: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: 'Error al obtener asistencias' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { personnelId, date, checkIn, checkOut, status, notes } = body

    if (!personnelId || !date) {
      return NextResponse.json({ error: 'Personal y fecha son requeridos' }, { status: 400 })
    }

    const record = await db.attendance.create({
      data: {
        personnelId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'PRESENTE',
        notes,
      },
      include: { personnel: true },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Create attendance error:', error)
    return NextResponse.json({ error: 'Error al registrar asistencia' }, { status: 500 })
  }
}
