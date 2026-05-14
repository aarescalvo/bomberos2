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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Trash2, Flame, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Incident {
  id: string
  type: string
  description: string
  address: string | null
  date: string
  time: string | null
  severity: string
  status: string
  personnelInvolved: string | null
  vehiclesUsed: string | null
  notes: string | null
}

const emptyForm = {
  type: 'INCENDIO',
  description: '',
  address: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  severity: 'MEDIA',
  status: 'ABIERTO',
  personnelInvolved: '',
  vehiclesUsed: '',
  notes: '',
}

export default function Incidentes() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState<Incident | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents')
      if (res.ok) {
        const data = await res.json()
        setIncidents(data)
      }
    } catch {
      toast.error('Error al cargar incidentes')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.type || !form.description || !form.date) {
      toast.error('Tipo, descripción y fecha son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Incidente creado')
        setShowCreate(false)
        setForm(emptyForm)
        fetchIncidents()
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

  const handleDelete = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/incidents/${selected.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Incidente eliminado')
        setShowDelete(false)
        setSelected(null)
        fetchIncidents()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ABIERTO: 'bg-red-100 text-red-800',
      EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
      CERRADO: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    if (type === 'INCENDIO') return '🔥'
    if (type === 'RESCATE') return '🚑'
    if (type === 'ACCIDENTE') return '⚠️'
    if (type === 'FUGA') return '💨'
    return '📋'
  }

  const filtered = incidents.filter((inc) => {
    const matchSearch =
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      inc.type.toLowerCase().includes(search.toLowerCase()) ||
      (inc.address || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || inc.status === filterStatus
    return matchSearch && matchStatus
  })

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
          <h2 className="text-2xl font-bold text-gray-900">Incidentes</h2>
          <p className="text-gray-500 mt-1">{incidents.length} registros</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setShowCreate(true) }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo Incidente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar incidentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ABIERTO">Abierto</SelectItem>
            <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
            <SelectItem value="CERRADO">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Flame className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No se encontraron incidentes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inc) => (
            <Card key={inc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getTypeIcon(inc.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{inc.type}</h3>
                      <p className="text-xs text-gray-400">
                        {new Date(inc.date).toLocaleDateString('es-AR')}
                        {inc.time ? ` ${inc.time}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className={`text-[10px] ${getSeverityColor(inc.severity)}`}>
                      {inc.severity}
                    </Badge>
                    <Badge className={`text-[10px] ${getStatusColor(inc.status)}`}>
                      {inc.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{inc.description}</p>
                {inc.address && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" /> {inc.address}
                  </div>
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => { setSelected(inc); setShowDelete(true) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Incidente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['INCENDIO', 'RESCATE', 'ACCIDENTE', 'FUGA', 'OTRO'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severidad</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
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
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Personal Involucrado</Label>
              <Input
                value={form.personnelInvolved}
                onChange={(e) => setForm({ ...form, personnelInvolved: e.target.value })}
                placeholder="Nombres del personal"
              />
            </div>
            <div>
              <Label>Vehículos Utilizados</Label>
              <Input
                value={form.vehiclesUsed}
                onChange={(e) => setForm({ ...form, vehiclesUsed: e.target.value })}
                placeholder="Patentes o tipos"
              />
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
              {saving ? 'Guardando...' : 'Crear Incidente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este incidente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
