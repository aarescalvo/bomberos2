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
import { Plus, Truck, Wrench, Fuel } from 'lucide-react'
import { toast } from 'sonner'

interface Vehicle {
  id: string
  type: string
  brand: string
  model: string
  year: number | null
  plate: string
  status: string
  km: number
  fuelType: string | null
  notes: string | null
  damages: { id: string; description: string; severity: string; status: string }[]
  fuelRecords: { id: string; date: string; liters: number; cost: number }[]
}

const emptyForm = {
  type: 'AUTOBOMBA',
  brand: '',
  model: '',
  year: '',
  plate: '',
  status: 'OPERATIVO',
  km: '0',
  fuelType: 'DIESEL',
  notes: '',
}

export default function Flota() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles')
      if (res.ok) setVehicles(await res.json())
    } catch {
      toast.error('Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.type || !form.brand || !form.plate) {
      toast.error('Tipo, marca y patente son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : null,
          km: parseInt(form.km) || 0,
        }),
      })
      if (res.ok) {
        toast.success('Vehículo creado')
        setShowCreate(false)
        setForm(emptyForm)
        fetchVehicles()
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
      OPERATIVO: 'bg-green-100 text-green-800',
      EN_REPARACION: 'bg-yellow-100 text-yellow-800',
      FUERA_DE_SERVICIO: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getDamageColor = (severity: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-red-100 text-red-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
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
          <h2 className="text-2xl font-bold text-gray-900">Flota</h2>
          <p className="text-gray-500 mt-1">{vehicles.length} vehículos</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setShowCreate(true) }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo Vehículo
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay vehículos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{v.brand} {v.model}</h3>
                      <p className="text-xs text-gray-400">{v.type} • {v.plate}</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${getStatusColor(v.status)}`}>{v.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <span>Año: {v.year || '—'}</span>
                  <span>KM: {v.km.toLocaleString()}</span>
                  <span>Combustible: {v.fuelType || '—'}</span>
                </div>

                {v.damages.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Wrench className="h-3 w-3" /> Daños ({v.damages.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {v.damages.slice(0, 2).map((d) => (
                        <Badge key={d.id} className={`text-[9px] ${getDamageColor(d.severity)}`}>
                          {d.description.slice(0, 20)}
                        </Badge>
                      ))}
                      {v.damages.length > 2 && (
                        <Badge variant="outline" className="text-[9px]">+{v.damages.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {v.fuelRecords.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Fuel className="h-3 w-3" />
                    Última carga: {v.fuelRecords[0]?.liters}L - ${v.fuelRecords[0]?.cost}
                  </div>
                )}

                {v.notes && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-1">{v.notes}</p>
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
            <DialogTitle>Nuevo Vehículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['AUTOBOMBA', 'ESCALERA', 'RESCATE', 'UTILITARIO', 'OTRO'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['OPERATIVO', 'EN_REPARACION', 'FUERA_DE_SERVICIO'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marca *</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patente *</Label>
                <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <Label>Año</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kilometraje</Label>
                <Input
                  type="number"
                  value={form.km}
                  onChange={(e) => setForm({ ...form, km: e.target.value })}
                />
              </div>
              <div>
                <Label>Combustible</Label>
                <Select value={form.fuelType || '_none'} onValueChange={(v) => setForm({ ...form, fuelType: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin especificar</SelectItem>
                    {['DIESEL', 'NAFTA', 'GNC'].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              {saving ? 'Guardando...' : 'Crear Vehículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
