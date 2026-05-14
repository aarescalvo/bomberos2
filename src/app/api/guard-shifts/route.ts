import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const shifts = await db.guardShift.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Get guard shifts error:', error)
    return NextResponse.json({ error: 'Error al obtener guardias' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, shiftType, personnelIds, notes } = body

    if (!date || !shiftType) {
      return NextResponse.json({ error: 'Fecha y turno son requeridos' }, { status: 400 })
    }

    const shift = await db.guardShift.create({
      data: {
        date: new Date(date),
        shiftType,
        personnelIds: JSON.stringify(personnelIds || []),
        notes,
      },
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Create guard shift error:', error)
    return NextResponse.json({ error: 'Error al crear guardia' }, { status: 500 })
  }
}
