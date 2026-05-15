'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Trophy, RefreshCw, Settings2, ChevronUp, ChevronDown,
  Medal, Star, TrendingUp, Users
} from 'lucide-react'

interface ScoreConfig {
  id: string
  category: string
  label: string
  points: number
  maxPerMonth: number | null
  isActive: boolean
}

interface LeaderboardEntry {
  rank: number
  personnel: { id: string; firstName: string; lastName: string; rank: string; status: string }
  totalPoints: number
  breakdown: { category: string; points: number; description: string | null }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  ASISTENCIA: 'Asistencia',
  GUARDIA: 'Guardia',
  INCIDENTE: 'Incidente',
  SERVICIO: 'Servicio',
  PERMANENCIA: 'Permanencia',
  ESPECIALIDAD: 'Especialidad',
}

const CATEGORY_COLORS: Record<string, string> = {
  ASISTENCIA: 'bg-green-100 text-green-800',
  GUARDIA: 'bg-amber-100 text-amber-800',
  INCIDENTE: 'bg-red-100 text-red-800',
  SERVICIO: 'bg-emerald-100 text-emerald-800',
  PERMANENCIA: 'bg-teal-100 text-teal-800',
  ESPECIALIDAD: 'bg-orange-100 text-orange-800',
}

export default function Puntajes() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [configs, setConfigs] = useState<ScoreConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)

  // Config form
  const [editConfigs, setEditConfigs] = useState<ScoreConfig[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [lbRes, cfgRes] = await Promise.all([
        fetch(`/api/scores/leaderboard?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/scores/config'),
      ])
      if (lbRes.ok) {
        const lbData = await lbRes.json()
        setLeaderboard(lbData.leaderboard || [])
      }
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json()
        setConfigs(cfgData)
      }
    } catch (err) {
      console.error('Error fetching scores:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const calculateScores = async () => {
    setCalculating(true)
    try {
      const res = await fetch('/api/scores/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Puntajes calculados: ${data.results?.length || 0} bomberos procesados`)
        fetchData()
      } else {
        toast.error(data.error || 'Error al calcular')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCalculating(false)
    }
  }

  const openConfigDialog = () => {
    setEditConfigs([...configs])
    setConfigDialogOpen(true)
  }

  const saveConfigs = async () => {
    try {
      for (const cfg of editConfigs) {
        await fetch('/api/scores/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cfg.id, points: cfg.points, maxPerMonth: cfg.maxPerMonth, isActive: cfg.isActive }),
        })
      }
      toast.success('Configuración guardada')
      setConfigDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Error al guardar configuración')
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
    return <span className="text-sm font-bold text-gray-400">#{rank}</span>
  }

  const totalScored = leaderboard.length
  const avgScore = totalScored > 0 ? (leaderboard.reduce((s, e) => s + e.totalPoints, 0) / totalScored).toFixed(1) : '0'
  const topScore = totalScored > 0 ? leaderboard[0]?.totalPoints : 0

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Puntajes</h2>
          <p className="text-gray-500 mt-1">Ranking de desempeño del personal</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={calculateScores} disabled={calculating} className="bg-red-600 hover:bg-red-700">
            {calculating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Calcular
          </Button>
          <Button variant="outline" onClick={openConfigDialog}>
            <Settings2 className="h-4 w-4 mr-2" /> Config
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-yellow-50 p-3 rounded-xl"><Trophy className="h-6 w-6 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Mejor Puntaje</p>
              <p className="text-2xl font-bold text-yellow-600">{topScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{avgScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl"><Users className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Evaluados</p>
              <p className="text-2xl font-bold text-green-600">{totalScored}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay puntajes calculados para este período</p>
            <p className="text-gray-400 text-sm mt-1">Hacé clic en &quot;Calcular&quot; para generar los puntajes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <Card
              key={entry.personnel.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                entry.rank <= 3 ? 'border-2 border-yellow-200' : ''
              }`}
              onClick={() => { setSelectedEntry(entry); setDetailDialogOpen(true) }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Person info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {entry.personnel.lastName}, {entry.personnel.firstName}
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{entry.personnel.rank}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.breakdown.map((b, i) => (
                        <Badge key={i} className={`text-[10px] ${CATEGORY_COLORS[b.category] || 'bg-gray-100 text-gray-800'}`}>
                          {CATEGORY_LABELS[b.category] || b.category}: {b.points}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Total points */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-red-600">{entry.totalPoints}</p>
                    <p className="text-[10px] text-gray-400">puntos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de Puntajes</DialogTitle>
            <p className="text-sm text-gray-500">Ajustá los puntos por categoría</p>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {editConfigs.map((cfg, i) => (
              <div key={cfg.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cfg.label}</p>
                  <p className="text-[10px] text-gray-400">{cfg.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Pts:</Label>
                  <Input
                    type="number" min={0} step={0.5}
                    className="w-16 h-8 text-sm"
                    value={cfg.points}
                    onChange={e => {
                      const updated = [...editConfigs]
                      updated[i] = { ...updated[i], points: parseFloat(e.target.value) || 0 }
                      setEditConfigs(updated)
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Max:</Label>
                  <Input
                    type="number" min={0}
                    className="w-16 h-8 text-sm"
                    value={cfg.maxPerMonth || ''}
                    placeholder="∞"
                    onChange={e => {
                      const updated = [...editConfigs]
                      updated[i] = { ...updated[i], maxPerMonth: e.target.value ? parseFloat(e.target.value) : null }
                      setEditConfigs(updated)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveConfigs} className="bg-red-600 hover:bg-red-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detalle de Puntajes</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-lg font-bold">{selectedEntry.personnel.lastName}, {selectedEntry.personnel.firstName}</p>
                <Badge variant="outline">{selectedEntry.personnel.rank}</Badge>
                <p className="text-3xl font-bold text-red-600 mt-2">{selectedEntry.totalPoints} pts</p>
              </div>
              <div className="space-y-2">
                {selectedEntry.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${CATEGORY_COLORS[b.category] || ''}`}>
                        {CATEGORY_LABELS[b.category] || b.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{b.points} pts</p>
                      {b.description && <p className="text-[10px] text-gray-400">{b.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
