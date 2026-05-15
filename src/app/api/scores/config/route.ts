import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default score configs to seed
const DEFAULT_CONFIGS = [
  { category: 'ASISTENCIA', label: 'Asistencia Diaria', points: 1, maxPerMonth: 30 },
  { category: 'GUARDIA', label: 'Guardia Cumplida', points: 3, maxPerMonth: 15 },
  { category: 'INCIDENTE', label: 'Participación en Incidente', points: 5, maxPerMonth: null },
  { category: 'SERVICIO', label: 'Servicio Programado', points: 2, maxPerMonth: 20 },
  { category: 'PERMANENCIA', label: 'Año de Permanencia', points: 10, maxPerMonth: null },
  { category: 'ESPECIALIDAD', label: 'Especialidad Obtenida', points: 8, maxPerMonth: null },
]

export async function GET() {
  try {
    let configs = await db.scoreConfig.findMany({ orderBy: { category: 'asc' } })

    // Auto-seed if empty
    if (configs.length === 0) {
      await db.scoreConfig.createMany({ data: DEFAULT_CONFIGS })
      configs = await db.scoreConfig.findMany({ orderBy: { category: 'asc' } })
    }

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Get score configs error:', error)
    return NextResponse.json({ error: 'Error al obtener configuración de puntajes' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, points, maxPerMonth, isActive } = body

    const config = await db.scoreConfig.update({
      where: { id },
      data: { points, maxPerMonth, isActive },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Update score config error:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
