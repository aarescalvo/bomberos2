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
import { Plus, Calendar, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'

interface GuardShift {
  id: string
  date: string
  shiftType: string
  personnelIds: string
  notes: string | null
}

interface Personnel {
  id: string
  firstName: string
  lastName: string
  rank: string
}

export default function Guardias() {
  const [shifts, setShifts] = useState<GuardShift[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftType: 'DIA',
    personnelIds: [] as string[],
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [shiftsRes, personnelRes] = await Promise.all([
        fetch('/api/guard-shifts'),
        fetch('/api/personnel'),
      ])
      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (personnelRes.ok) setPersonnel(await personnelRes.json())
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.date || !form.shiftType) {
      toast.error('Fecha y turno son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/guard-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Guardia creada')
        setShowCreate(false)
        setForm({ date: new Date().toISOString().split('T')[0], shiftType: 'DIA', personnelIds: [], notes: '' })
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

  const togglePersonnel = (id: string) => {
    setForm((prev) => ({
      ...prev,
      personnelIds: prev.personnelIds.includes(id)
        ? prev.personnelIds.filter((p) => p !== id)
        : [...prev.personnelIds, id],
    }))
  }

  const getShiftIcon = (type: string) => {
    return type === 'DIA' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />
  }

  const getShiftColor = (type: string) => {
    const colors: Record<string, string> = {
      DIA: 'bg-amber-100 text-amber-800',
      NOCHE: 'bg-slate-100 text-slate-800',
      COMPLETA: 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getPersonnelNames = (idsStr: string) => {
    try {
      const ids: string[] = JSON.parse(idsStr)
      return ids
        .map((id) => {
          const p = personnel.find((per) => per.id === id)
          return p ? `${p.lastName}, ${p.firstName}` : null
        })
        .filter(Boolean) as string[]
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Guardias</h2>
          <p className="text-gray-500 mt-1">{shifts.length} registros</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nueva Guardia
        </Button>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay guardias registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => {
            const names = getPersonnelNames(shift.personnelIds)
            return (
              <Card key={shift.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getShiftIcon(shift.shiftType)}
                      <h3 className="font-semibold text-gray-900">
                        {new Date(shift.date).toLocaleDateString('es-AR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </h3>
                    </div>
                    <Badge className={getShiftColor(shift.shiftType)}>{shift.shiftType}</Badge>
                  </div>
                  {names.length > 0 ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-400">Personal asignado:</p>
                      <div className="flex flex-wrap gap-1">
                        {names.map((name, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-3">Sin personal asignado</p>
                  )}
                  {shift.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{shift.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Guardia</DialogTitle>
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
                    <SelectItem value="COMPLETA">Completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Personal Asignado</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {personnel
                  .filter((p) => true)
                  .map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        form.personnelIds.includes(p.id)
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.personnelIds.includes(p.id)}
                        onChange={() => togglePersonnel(p.id)}
                        className="accent-red-600"
                      />
                      <span className="text-sm">
                        {p.lastName}, {p.firstName} ({p.rank})
                      </span>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{form.personnelIds.length} seleccionados</p>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Guardando...' : 'Crear Guardia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
