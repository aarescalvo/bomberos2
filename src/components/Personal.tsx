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
import { Search, Plus, Edit, Trash2, Eye, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Personnel {
  id: string
  firstName: string
  lastName: string
  dni: string
  rank: string
  status: string
  fitness: string
  bloodGroup: string | null
  phone: string | null
  email: string | null
  address: string | null
  joinDate: string | null
  birthDate: string | null
  notes: string | null
  specialties: { id: string; name: string; level: string; certificationDate: string | null; expiryDate: string | null }[]
  licenses: { id: string; type: string; number: string | null; status: string; expiryDate: string | null }[]
}

const emptyForm = {
  firstName: '',
  lastName: '',
  dni: '',
  rank: 'Bombero',
  status: 'ACTIVO',
  fitness: 'APTO',
  bloodGroup: '',
  phone: '',
  email: '',
  address: '',
  joinDate: new Date().toISOString().split('T')[0],
  birthDate: '',
  notes: '',
}

export default function Personal() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selected, setSelected] = useState<Personnel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    fetchPersonnel()
  }, [])

  const fetchPersonnel = async () => {
    try {
      const res = await fetch('/api/personnel')
      if (res.ok) {
        const data = await res.json()
        setPersonnel(data)
      }
    } catch {
      toast.error('Error al cargar personal')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.dni) {
      toast.error('Nombre, apellido y DNI son requeridos')
      return
    }
    setSaving(true)
    try {
      const url = isEdit && selected ? `/api/personnel/${selected.id}` : '/api/personnel'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(isEdit ? 'Personal actualizado' : 'Personal creado')
        setShowCreate(false)
        fetchPersonnel()
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
      const res = await fetch(`/api/personnel/${selected.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Personal eliminado')
        setShowDelete(false)
        setSelected(null)
        fetchPersonnel()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const openEdit = (p: Personnel) => {
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      dni: p.dni,
      rank: p.rank,
      status: p.status,
      fitness: p.fitness,
      bloodGroup: p.bloodGroup || '',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      joinDate: p.joinDate ? new Date(p.joinDate).toISOString().split('T')[0] : '',
      birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '',
      notes: p.notes || '',
    })
    setSelected(p)
    setIsEdit(true)
    setShowCreate(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVO: 'bg-green-100 text-green-800',
      LICENCIA: 'bg-yellow-100 text-yellow-800',
      BAJA: 'bg-red-100 text-red-800',
      SUSPENDIDO: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getFitnessColor = (fitness: string) => {
    const colors: Record<string, string> = {
      APTO: 'bg-green-100 text-green-800',
      NO_APTO: 'bg-red-100 text-red-800',
      CONDICIONAL: 'bg-yellow-100 text-yellow-800',
    }
    return colors[fitness] || 'bg-gray-100 text-gray-800'
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      BASICO: 'bg-blue-100 text-blue-800',
      INTERMEDIO: 'bg-cyan-100 text-cyan-800',
      AVANZADO: 'bg-orange-100 text-orange-800',
      INSTRUCTOR: 'bg-red-100 text-red-800',
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getLicenseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      VIGENTE: 'bg-green-100 text-green-800',
      VENCIDA: 'bg-red-100 text-red-800',
      SUSPENDIDA: 'bg-orange-100 text-orange-800',
      EN_TRAMITE: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const filtered = personnel.filter(
    (p) =>
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.dni.includes(search)
  )

  const calculateSeniority = (joinDate: string | null) => {
    if (!joinDate) return '—'
    const join = new Date(joinDate)
    const now = new Date()
    const years = now.getFullYear() - join.getFullYear()
    const months = now.getMonth() - join.getMonth()
    const totalMonths = years * 12 + months
    const y = Math.floor(totalMonths / 12)
    const m = totalMonths % 12
    if (y > 0) return `${y} año${y > 1 ? 's' : ''} ${m > 0 ? `${m} mes${m > 1 ? 'es' : ''}` : ''}`
    return `${m} mes${m > 1 ? 'es' : ''}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personal</h2>
          <p className="text-gray-500 mt-1">{personnel.length} registros</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm)
            setIsEdit(false)
            setSelected(null)
            setShowCreate(true)
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo Personal
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, apellido o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No se encontró personal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {p.lastName}, {p.firstName}
                    </h3>
                    <p className="text-sm text-gray-500">DNI: {p.dni}</p>
                    <p className="text-sm text-gray-600 mt-1">{p.rank}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Antigüedad: {calculateSeniority(p.joinDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`text-[10px] ${getStatusColor(p.status)}`}>{p.status}</Badge>
                    <Badge className={`text-[10px] ${getFitnessColor(p.fitness)}`}>{p.fitness}</Badge>
                  </div>
                </div>

                {p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.specialties.slice(0, 3).map((s) => (
                      <Badge key={s.id} className={`text-[9px] ${getLevelColor(s.level)}`}>
                        {s.name}
                      </Badge>
                    ))}
                    {p.specialties.length > 3 && (
                      <Badge variant="outline" className="text-[9px]">+{p.specialties.length - 3}</Badge>
                    )}
                  </div>
                )}

                {p.bloodGroup && (
                  <p className="text-xs text-gray-400 mt-2">Grupo sanguíneo: {p.bloodGroup}</p>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(p); setShowDetail(true) }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => { setSelected(p); setShowDelete(true) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>DNI *</Label>
                <Input
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                />
              </div>
              <div>
                <Label>Grupo Sanguíneo</Label>
                <Select
                  value={form.bloodGroup || '_none'}
                  onValueChange={(v) => setForm({ ...form, bloodGroup: v === '_none' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin especificar</SelectItem>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grado</Label>
                <Select value={form.rank} onValueChange={(v) => setForm({ ...form, rank: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Bombero', 'Cabo', 'Sargento', 'Suboficial', 'Oficial'].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['ACTIVO', 'LICENCIA', 'BAJA', 'SUSPENDIDO'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aptitud Física</Label>
                <Select value={form.fitness} onValueChange={(v) => setForm({ ...form, fitness: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['APTO', 'NO_APTO', 'CONDICIONAL'].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                <Label>Fecha de Ingreso</Label>
                <Input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Personal</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Nombre completo</p>
                  <p className="font-medium">{selected.lastName}, {selected.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">DNI</p>
                  <p className="font-medium">{selected.dni}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Grado</p>
                  <p className="font-medium">{selected.rank}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Grupo Sanguíneo</p>
                  <p className="font-medium">{selected.bloodGroup || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Estado</p>
                  <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Aptitud</p>
                  <Badge className={getFitnessColor(selected.fitness)}>{selected.fitness}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Teléfono</p>
                  <p className="font-medium">{selected.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium">{selected.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fecha de Ingreso</p>
                  <p className="font-medium">{selected.joinDate ? new Date(selected.joinDate).toLocaleDateString('es-AR') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Antigüedad</p>
                  <p className="font-medium">{calculateSeniority(selected.joinDate)}</p>
                </div>
              </div>
              {selected.address && (
                <div>
                  <p className="text-xs text-gray-400">Dirección</p>
                  <p className="font-medium">{selected.address}</p>
                </div>
              )}
              {selected.notes && (
                <div>
                  <p className="text-xs text-gray-400">Notas</p>
                  <p className="font-medium">{selected.notes}</p>
                </div>
              )}
              {/* Specialties */}
              {selected.specialties.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.specialties.map((s) => (
                      <Badge key={s.id} className={getLevelColor(s.level)}>
                        {s.name} ({s.level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Licenses */}
              {selected.licenses.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Licencias</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.licenses.map((l) => (
                      <Badge key={l.id} className={getLicenseStatusColor(l.status)}>
                        {l.type} {l.number ? `(${l.number})` : ''} - {l.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro de{' '}
              {selected?.firstName} {selected?.lastName}.
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
