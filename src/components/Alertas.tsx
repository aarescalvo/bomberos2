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
import { Plus, Bell, BellOff, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  priority: string
  read: boolean
  relatedId: string | null
  dueDate: string | null
  createdAt: string
}

const emptyForm = {
  type: 'VENCIMIENTO',
  title: '',
  message: '',
  priority: 'MEDIA',
  relatedId: '',
  dueDate: '',
}

export default function Alertas() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterRead, setFilterRead] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) setAlerts(await res.json())
    } catch {
      toast.error('Error al cargar alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.message) {
      toast.error('Título y mensaje son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Alerta creada')
        setShowCreate(false)
        setForm(emptyForm)
        fetchAlerts()
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

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      if (res.ok) {
        toast.success('Alerta marcada como leída')
        fetchAlerts()
      }
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      URGENTE: 'bg-red-100 text-red-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      VENCIMIENTO: 'bg-orange-100 text-orange-800',
      MANTENIMIENTO: 'bg-blue-100 text-blue-800',
      MEDICO: 'bg-red-100 text-red-800',
      DOCUMENTO: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filtered = alerts.filter((a) => {
    if (filterRead === 'READ') return a.read
    if (filterRead === 'UNREAD') return !a.read
    return true
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

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
          <p className="text-gray-500 mt-1">
            {alerts.length} alertas • {unreadCount} sin leer
          </p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setShowCreate(true) }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nueva Alerta
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterRead} onValueChange={(v) => setFilterRead(v as 'ALL' | 'READ' | 'UNREAD')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="UNREAD">Sin leer</SelectItem>
            <SelectItem value="READ">Leídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay alertas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((alert) => (
            <Card
              key={alert.id}
              className={`hover:shadow-md transition-shadow ${!alert.read ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {alert.read ? (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-red-500" />
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm">{alert.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`text-[9px] ${getPriorityColor(alert.priority)}`}>
                      {alert.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{alert.message}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex gap-1">
                    <Badge className={`text-[9px] ${getTypeColor(alert.type)}`}>{alert.type}</Badge>
                    {alert.dueDate && (
                      <Badge variant="outline" className="text-[9px]">
                        Vence: {new Date(alert.dueDate).toLocaleDateString('es-AR')}
                      </Badge>
                    )}
                  </div>
                  {!alert.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Marcar leída
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Alerta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Mensaje *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['VENCIMIENTO', 'MANTENIMIENTO', 'MEDICO', 'DOCUMENTO'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Guardando...' : 'Crear Alerta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
