import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { month, year } = body

    const m = month || new Date().getMonth() + 1
    const y = year || new Date().getFullYear()

    // Get all active personnel
    const personnel = await db.personnel.findMany({
      where: { status: 'ACTIVO' },
      include: {
        attendance: {
          where: {
            date: {
              gte: new Date(y, m - 1, 1),
              lt: new Date(y, m, 1),
            },
          },
        },
        specialties: true,
      },
    })

    // Get score configs
    const configs = await db.scoreConfig.findMany({ where: { isActive: true } })
    const configMap = new Map(configs.map(c => [c.category, c]))

    // Get incidents this month (for incident participation)
    const incidents = await db.incident.findMany({
      where: {
        date: {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1),
        },
      },
    })

    // Get guard shifts this month
    const guardShifts = await db.guardShift.findMany({
      where: {
        date: {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1),
        },
      },
    })

    const results = []

    for (const person of personnel) {
      const scores: { category: string; points: number; description: string }[] = []

      // 1. ASISTENCIA - count present days
      const attendanceConfig = configMap.get('ASISTENCIA')
      if (attendanceConfig) {
        const presentDays = person.attendance.filter(a => a.status === 'PRESENTE').length
        const maxPts = attendanceConfig.maxPerMonth ? Math.min(presentDays, attendanceConfig.maxPerMonth) : presentDays
        scores.push({
          category: 'ASISTENCIA',
          points: maxPts * attendanceConfig.points,
          description: `${presentDays} días presentes × ${attendanceConfig.points} pts`,
        })
      }

      // 2. GUARDIA - count guard shifts
      const guardiaConfig = configMap.get('GUARDIA')
      if (guardiaConfig) {
        let guardCount = 0
        for (const shift of guardShifts) {
          try {
            const ids: string[] = JSON.parse(shift.personnelIds)
            if (ids.includes(person.id)) guardCount++
          } catch { /* skip */ }
        }
        const maxPts = guardiaConfig.maxPerMonth ? Math.min(guardCount, guardiaConfig.maxPerMonth) : guardCount
        scores.push({
          category: 'GUARDIA',
          points: maxPts * guardiaConfig.points,
          description: `${guardCount} guardias × ${guardiaConfig.points} pts`,
        })
      }

      // 3. INCIDENTE - count incidents they were involved in
      const incidentConfig = configMap.get('INCIDENTE')
      if (incidentConfig) {
        let incidentCount = 0
        for (const inc of incidents) {
          if (inc.personnelInvolved && inc.personnelInvolved.includes(person.id)) {
            incidentCount++
          }
        }
        // If no specific involvement tracked, give points to all if there were incidents
        // (simple approach: count based on incident count)
        scores.push({
          category: 'INCIDENTE',
          points: incidentCount * incidentConfig.points,
          description: `${incidentCount} incidentes × ${incidentConfig.points} pts`,
        })
      }

      // 4. PERMANENCIA - years of service
      const permConfig = configMap.get('PERMANENCIA')
      if (permConfig && person.joinDate) {
        const years = Math.floor((Date.now() - new Date(person.joinDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        scores.push({
          category: 'PERMANENCIA',
          points: years * permConfig.points,
          description: `${years} años de servicio × ${permConfig.points} pts`,
        })
      }

      // 5. ESPECIALIDAD - count specialties
      const specConfig = configMap.get('ESPECIALIDAD')
      if (specConfig) {
        const specCount = person.specialties.length
        scores.push({
          category: 'ESPECIALIDAD',
          points: specCount * specConfig.points,
          description: `${specCount} especialidades × ${specConfig.points} pts`,
        })
      }

      // 6. SERVICIO - base monthly service points
      const serviceConfig = configMap.get('SERVICIO')
      if (serviceConfig) {
        const attendanceRate = person.attendance.length > 0
          ? person.attendance.filter(a => a.status === 'PRESENTE').length / person.attendance.length
          : 0
        const servicePoints = Math.round(attendanceRate * serviceConfig.points * 10) / 10
        const maxPts = serviceConfig.maxPerMonth ? Math.min(servicePoints, serviceConfig.maxPerMonth) : servicePoints
        scores.push({
          category: 'SERVICIO',
          points: maxPts,
          description: `Tasa asistencia ${(attendanceRate * 100).toFixed(0)}%`,
        })
      }

      // Upsert scores
      for (const s of scores) {
        await db.personnelScore.upsert({
          where: {
            personnelId_category_month_year: {
              personnelId: person.id,
              category: s.category,
              month: m,
              year: y,
            },
          },
          update: { points: s.points, description: s.description, auto: true },
          create: {
            personnelId: person.id,
            category: s.category,
            points: s.points,
            month: m,
            year: y,
            description: s.description,
            auto: true,
          },
        })
      }

      results.push({
        personnelId: person.id,
        name: `${person.firstName} ${person.lastName}`,
        rank: person.rank,
        totalPoints: scores.reduce((sum, s) => sum + s.points, 0),
        breakdown: scores,
      })
    }

    // Sort by total points desc
    results.sort((a, b) => b.totalPoints - a.totalPoints)

    return NextResponse.json({ month: m, year: y, results, calculatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Calculate scores error:', error)
    return NextResponse.json({ error: 'Error al calcular puntajes' }, { status: 500 })
  }
}
