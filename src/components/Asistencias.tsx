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
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  personnelId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  notes: string | null
  personnel: {
    id: string
    firstName: string
    lastName: string
    rank: string
  }
}

interface Personnel {
  id: string
  firstName: string
  lastName: string
  rank: string
}

export default function Asistencias() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    personnelId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date().toTimeString().slice(0, 5),
    checkOut: '',
    status: 'PRESENTE',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [attRes, perRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/personnel'),
      ])
      if (attRes.ok) setRecords(await attRes.json())
      if (perRes.ok) setPersonnel(await perRes.json())
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.personnelId || !form.date) {
      toast.error('Personal y fecha son requeridos')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : undefined,
        checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : undefined,
      }
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Asistencia registrada')
        setShowCreate(false)
        setForm({
          personnelId: '',
          date: new Date().toISOString().split('T')[0],
          checkIn: new Date().toTimeString().slice(0, 5),
          checkOut: '',
          status: 'PRESENTE',
          notes: '',
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENTE: 'bg-green-100 text-green-800',
      AUSENTE: 'bg-red-100 text-red-800',
      TARDE: 'bg-yellow-100 text-yellow-800',
      LICENCIA: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'PRESENTE') return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === 'AUSENTE') return <XCircle className="h-4 w-4 text-red-600" />
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  const filtered = records.filter((r) => {
    return filterStatus === 'ALL' || r.status === filterStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asistencias</h2>
          <p className="text-gray-500 mt-1">{records.length} registros</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Registrar Asistencia
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="PRESENTE">Presente</SelectItem>
            <SelectItem value="AUSENTE">Ausente</SelectItem>
            <SelectItem value="TARDE">Tarde</SelectItem>
            <SelectItem value="LICENCIA">Licencia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay registros de asistencia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {rec.personnel.lastName}, {rec.personnel.firstName}
                    </h3>
                    <p className="text-xs text-gray-400">{rec.personnel.rank}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(rec.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(rec.status)}
                    <Badge className={`text-[10px] ${getStatusColor(rec.status)}`}>
                      {rec.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>Entrada: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  <span>Salida: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                {rec.notes && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{rec.notes}</p>
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
            <DialogTitle>Registrar Asistencia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Personal *</Label>
              <Select value={form.personnelId} onValueChange={(v) => setForm({ ...form, personnelId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar personal" /></SelectTrigger>
                <SelectContent>
                  {personnel.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} ({p.rank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Entrada</Label>
                <Input
                  type="time"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Salida</Label>
                <Input
                  type="time"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['PRESENTE', 'AUSENTE', 'TARDE', 'LICENCIA'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {saving ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
