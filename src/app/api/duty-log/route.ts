import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.dutyLog.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Get duty logs error:', error)
    return NextResponse.json({ error: 'Error al obtener novedades' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, shiftType, personnelId, activities, observations } = body

    if (!date || !shiftType || !activities) {
      return NextResponse.json({ error: 'Fecha, turno y actividades son requeridos' }, { status: 400 })
    }

    const log = await db.dutyLog.create({
      data: { date: new Date(date), shiftType, personnelId, activities, observations },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Create duty log error:', error)
    return NextResponse.json({ error: 'Error al crear novedad' }, { status: 500 })
  }
}
