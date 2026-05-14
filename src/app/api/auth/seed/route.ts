import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if admin already exists
    const existing = await db.user.findUnique({ where: { username: 'admin' } })
    if (existing) {
      return NextResponse.json({ message: 'Admin ya existe', seeded: false })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        email: 'admin@sgpb.gov',
        role: 'admin',
        active: true,
      },
    })

    // Create some sample personnel
    const samplePersonnel = [
      { firstName: 'Juan', lastName: 'Pérez', dni: '30123456', rank: 'Oficial', status: 'ACTIVO', fitness: 'APTO', bloodGroup: 'O+', phone: '351-5551234', joinDate: new Date('2015-03-15') },
      { firstName: 'María', lastName: 'García', dni: '32654321', rank: 'Sargento', status: 'ACTIVO', fitness: 'APTO', bloodGroup: 'A+', phone: '351-5555678', joinDate: new Date('2018-06-20') },
      { firstName: 'Carlos', lastName: 'López', dni: '33876543', rank: 'Cabo', status: 'ACTIVO', fitness: 'APTO', bloodGroup: 'B-', phone: '351-5559012', joinDate: new Date('2020-01-10') },
      { firstName: 'Ana', lastName: 'Martínez', dni: '34567890', rank: 'Bombero', status: 'LICENCIA', fitness: 'NO_APTO', bloodGroup: 'AB+', phone: '351-5553456', joinDate: new Date('2022-09-05') },
      { firstName: 'Roberto', lastName: 'Fernández', dni: '29987654', rank: 'Suboficial', status: 'ACTIVO', fitness: 'APTO', bloodGroup: 'O-', phone: '351-5557890', joinDate: new Date('2012-11-30') },
    ]

    for (const p of samplePersonnel) {
      await db.personnel.create({ data: p })
    }

    // Create sample vehicles
    const sampleVehicles = [
      { type: 'AUTOBOMBA', brand: 'Iveco', model: 'Magirus', year: 2018, plate: 'AB-123-CD', status: 'OPERATIVO', km: 45000, fuelType: 'DIESEL' },
      { type: 'RESCATE', brand: 'Ford', model: 'Cargo 1722', year: 2020, plate: 'AB-456-EF', status: 'OPERATIVO', km: 28000, fuelType: 'DIESEL' },
      { type: 'UTILITARIO', brand: 'Toyota', model: 'Hilux', year: 2022, plate: 'AB-789-GH', status: 'OPERATIVO', km: 15000, fuelType: 'NAFTA' },
    ]

    for (const v of sampleVehicles) {
      await db.vehicle.create({ data: v })
    }

    return NextResponse.json({
      message: 'Base de datos inicializada correctamente',
      seeded: true,
      admin: { username: 'admin', password: 'admin123' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error al inicializar' }, { status: 500 })
  }
}
