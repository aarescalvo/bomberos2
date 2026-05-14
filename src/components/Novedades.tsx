'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ClipboardList, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

interface DutyLog {
  id: string
  date: string
  shiftType: string
  personnelId: string | null
  activities: string
  observations: string | null
}

interface Personnel {
  id: string
  firstName: string
  lastName: string
  rank: string
}

export default function Novedades() {
  const [logs, setLogs] = useState<DutyLog[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftType: 'DIA',
    personnelId: '',
    activities: '',
    observations: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [logsRes, personnelRes] = await Promise.all([
        fetch('/api/duty-log'),
        fetch('/api/personnel'),
      ])
      if (logsRes.ok) setLogs(await logsRes.json())
      if (personnelRes.ok) setPersonnel(await personnelRes.json())
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.date || !form.shiftType || !form.activities) {
      toast.error('Fecha, turno y actividades son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/duty-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Novedad registrada')
        setShowCreate(false)
        setForm({
          date: new Date().toISOString().split('T')[0],
          shiftType: 'DIA',
          personnelId: '',
          activities: '',
          observations: '',
        })
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const getShiftColor = (type: string) => {
    const colors: Record<string, string> = {
      DIA: 'bg-amber-100 text-amber-800',
      NOCHE: 'bg-slate-100 text-slate-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getPersonnelName = (id: string | null) => {
    if (!id) return '—'
    const p = personnel.find((per) => per.id === id)
    return p ? `${p.lastName}, ${p.firstName}` : '—'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Novedades</h2>
          <p className="text-gray-500 mt-1">{logs.length} registros</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nueva Novedad
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay novedades registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {log.shiftType === 'DIA' ? (
                      <Sun className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Moon className="h-5 w-5 text-slate-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {new Date(log.date).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Encargado: {getPersonnelName(log.personnelId)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getShiftColor(log.shiftType)}>{log.shiftType}</Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 font-medium">Actividades:</p>
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{log.activities}</p>
                </div>
                {log.observations && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-gray-600 font-medium">Observaciones:</p>
                    <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{log.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Novedad</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Turno *</Label>
                <Select value={form.shiftType} onValueChange={(v) => setForm({ ...form, shiftType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIA">Día</SelectItem>
                    <SelectItem value="NOCHE">Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Personal Encargado</Label>
              <Select value={form.personnelId || '_none'} onValueChange={(v) => setForm({ ...form, personnelId: v === '_none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin asignar</SelectItem>
                  {personnel.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} ({p.rank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Actividades *</Label>
              <Textarea
                value={form.activities}
                onChange={(e) => setForm({ ...form, activities: e.target.value })}
                rows={4}
                placeholder="Describir las actividades realizadas..."
              />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Guardando...' : 'Registrar Novedad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
