import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const incidents = await db.incident.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(incidents)
  } catch (error) {
    console.error('Get incidents error:', error)
    return NextResponse.json({ error: 'Error al obtener incidentes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, description, address, date, time, severity, status, personnelInvolved, vehiclesUsed, notes } = body

    if (!type || !description || !date) {
      return NextResponse.json({ error: 'Tipo, descripción y fecha son requeridos' }, { status: 400 })
    }

    const incident = await db.incident.create({
      data: {
        type,
        description,
        address,
        date: new Date(date),
        time,
        severity: severity || 'MEDIA',
        status: status || 'ABIERTO',
        personnelInvolved,
        vehiclesUsed,
        notes,
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error('Create incident error:', error)
    return NextResponse.json({ error: 'Error al crear incidente' }, { status: 500 })
  }
}
