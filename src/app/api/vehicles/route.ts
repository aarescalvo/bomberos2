import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      include: { damages: true, fuelRecords: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { plate: 'asc' },
    })
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Get vehicles error:', error)
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, brand, model, year, plate, status, km, fuelType, notes } = body

    if (!type || !brand || !plate) {
      return NextResponse.json({ error: 'Tipo, marca y patente son requeridos' }, { status: 400 })
    }

    const vehicle = await db.vehicle.create({
      data: { type, brand, model, year, plate, status: status || 'OPERATIVO', km: km || 0, fuelType, notes },
      include: { damages: true, fuelRecords: true },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Create vehicle error:', error)
    return NextResponse.json({ error: 'Error al crear vehículo' }, { status: 500 })
  }
}
