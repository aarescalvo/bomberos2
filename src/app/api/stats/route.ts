import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [personnelCount, activePersonnel, incidentCount, vehicleCount, openIncidents, unreadAlerts, todayAttendance] = await Promise.all([
      db.personnel.count(),
      db.personnel.count({ where: { status: 'ACTIVO' } }),
      db.incident.count({ where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      db.vehicle.count({ where: { status: 'OPERATIVO' } }),
      db.incident.count({ where: { status: { in: ['ABIERTO', 'EN_PROGRESO'] } } }),
      db.alert.count({ where: { read: false } }),
      db.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ])

    // Financial summary
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const payments = await db.payment.findMany({ where: { date: { gte: startOfMonth } } })
    const totalIncome = payments.filter(p => p.type === 'CUOTA' || p.type === 'DONACION' || p.type === 'SUBSIDIO').reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = payments.filter(p => p.type === 'OTRO').reduce((sum, p) => sum + p.amount, 0)

    // Personnel by rank
    const personnelByRank = await db.personnel.groupBy({ by: ['rank'], _count: { rank: true } })

    // Recent incidents
    const recentIncidents = await db.incident.findMany({ take: 5, orderBy: { date: 'desc' } })

    // Upcoming alerts
    const upcomingAlerts = await db.alert.findMany({ where: { read: false }, take: 5, orderBy: { priority: 'desc' } })

    return NextResponse.json({
      personnelCount,
      activePersonnel,
      incidentCount,
      vehicleCount,
      openIncidents,
      unreadAlerts,
      todayAttendance,
      totalIncome,
      totalExpenses,
      personnelByRank: personnelByRank.map(r => ({ rank: r.rank, count: r._count.rank })),
      recentIncidents,
      upcomingAlerts,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
