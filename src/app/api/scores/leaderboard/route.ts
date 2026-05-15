import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Get all scores for this month, grouped by personnel
    const scores = await db.personnelScore.findMany({
      where: { month, year },
      include: {
        personnel: { select: { id: true, firstName: true, lastName: true, rank: true, status: true } },
      },
    })

    // Group by personnel
    const personnelMap = new Map<string, {
      personnel: { id: string; firstName: string; lastName: string; rank: string; status: string }
      totalPoints: number
      breakdown: { category: string; points: number; description: string | null }[]
    }>()

    for (const score of scores) {
      const pid = score.personnelId
      if (!personnelMap.has(pid)) {
        personnelMap.set(pid, {
          personnel: score.personnel,
          totalPoints: 0,
          breakdown: [],
        })
      }
      const entry = personnelMap.get(pid)!
      entry.totalPoints += score.points
      entry.breakdown.push({ category: score.category, points: score.points, description: score.description })
    }

    // Convert to sorted array
    const leaderboard = Array.from(personnelMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }))

    return NextResponse.json({ month, year, leaderboard })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json({ error: 'Error al obtener ranking' }, { status: 500 })
  }
}
