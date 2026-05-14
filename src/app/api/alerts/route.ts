import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const alerts = await db.alert.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, message, priority, relatedId, dueDate } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 })
    }

    const alert = await db.alert.create({
      data: { type: type || 'VENCIMIENTO', title, message, priority: priority || 'MEDIA', relatedId, dueDate: dueDate ? new Date(dueDate) : null },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json({ error: 'Error al crear alerta' }, { status: 500 })
  }
}
