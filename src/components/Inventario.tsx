'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Package, Plus, Search, Edit2, Trash2, UserCheck, RotateCcw,
  Filter, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  _count?: { items: number }
}

interface EquipmentItem {
  id: string
  categoryId: string
  code: string
  brand?: string
  model?: string
  size?: string
  serialNumber?: string
  status: string
  condition: string
  purchaseDate?: string
  expiryDate?: string
  notes?: string
  category: Category
  assignments: Assignment[]
}

interface Assignment {
  id: string
  itemId: string
  personnelId: string
  assignedDate: string
  returnedDate?: string
  status: string
  notes?: string
  item?: EquipmentItem & { category: Category }
  personnel?: { id: string; firstName: string; lastName: string; rank: string }
}

interface Person {
  id: string
  firstName: string
  lastName: string
  rank: string
  dni: string
}

const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-800',
  ASIGNADO: 'bg-amber-100 text-amber-800',
  EN_REPARACION: 'bg-orange-100 text-orange-800',
  DADO_DE_BAJA: 'bg-red-100 text-red-800',
}

const CONDITION_COLORS: Record<string, string> = {
  NUEVO: 'bg-emerald-100 text-emerald-800',
  BUENO: 'bg-green-100 text-green-800',
  REGULAR: 'bg-yellow-100 text-yellow-800',
  MALO: 'bg-red-100 text-red-800',
}

export default function Inventario() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [personnel, setPersonnel] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('items')

  // Dialogs
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form states
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EquipmentItem | null>(null)

  // Item form
  const [formCode, setFormCode] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formModel, setFormModel] = useState('')
  const [formSize, setFormSize] = useState('')
  const [formSerial, setFormSerial] = useState('')
  const [formStatus, setFormStatus] = useState('DISPONIBLE')
  const [formCondition, setFormCondition] = useState('NUEVO')
  const [formPurchaseDate, setFormPurchaseDate] = useState('')
  const [formExpiryDate, setFormExpiryDate] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // Category form
  const [catName, setCatName] = useState('')
  const [catDesc, setCatDesc] = useState('')

  // Assign form
  const [assignPersonnelId, setAssignPersonnelId] = useState('')
  const [assignNotes, setAssignNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, catRes, persRes] = await Promise.all([
        fetch('/api/equipment/items'),
        fetch('/api/equipment/categories'),
        fetch('/api/personnel'),
      ])
      if (itemsRes.ok) setItems(await itemsRes.json())
      if (catRes.ok) setCategories(await catRes.json())
      if (persRes.ok) setPersonnel(await persRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const resetItemForm = () => {
    setFormCode(''); setFormCategory(''); setFormBrand(''); setFormModel('')
    setFormSize(''); setFormSerial(''); setFormStatus('DISPONIBLE'); setFormCondition('NUEVO')
    setFormPurchaseDate(''); setFormExpiryDate(''); setFormNotes('')
    setEditingItem(null)
  }

  const openCreateItem = () => {
    resetItemForm()
    setItemDialogOpen(true)
  }

  const openEditItem = (item: EquipmentItem) => {
    setEditingItem(item)
    setFormCode(item.code); setFormCategory(item.categoryId); setFormBrand(item.brand || '')
    setFormModel(item.model || ''); setFormSize(item.size || ''); setFormSerial(item.serialNumber || '')
    setFormStatus(item.status); setFormCondition(item.condition)
    setFormPurchaseDate(item.purchaseDate ? item.purchaseDate.split('T')[0] : '')
    setFormExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '')
    setFormNotes(item.notes || '')
    setItemDialogOpen(true)
  }

  const saveItem = async () => {
    try {
      const payload = {
        categoryId: formCategory, code: formCode, brand: formBrand || undefined,
        model: formModel || undefined, size: formSize || undefined,
        serialNumber: formSerial || undefined, status: formStatus, condition: formCondition,
        purchaseDate: formPurchaseDate || undefined, expiryDate: formExpiryDate || undefined,
        notes: formNotes || undefined,
      }

      const res = editingItem
        ? await fetch(`/api/equipment/items/${editingItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/equipment/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      const data = await res.json()
      if (res.ok) {
        toast.success(editingItem ? 'Item actualizado' : 'Item creado')
        setItemDialogOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const deleteItem = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/equipment/items/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Item eliminado')
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        fetchData()
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const saveCategory = async () => {
    try {
      const res = await fetch('/api/equipment/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: catDesc || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Categoría creada')
        setCategoryDialogOpen(false)
        setCatName(''); setCatDesc('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear categoría')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const assignItem = async () => {
    if (!selectedItem || !assignPersonnelId) return
    try {
      const res = await fetch('/api/equipment/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id, personnelId: assignPersonnelId, notes: assignNotes || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Equipo asignado')
        setAssignDialogOpen(false)
        setAssignPersonnelId(''); setAssignNotes('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al asignar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const returnItem = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/equipment/assign/${assignmentId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Devuelto' }),
      })
      if (res.ok) {
        toast.success('Equipo devuelto')
        fetchData()
      }
    } catch {
      toast.error('Error al devolver')
    }
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchSearch = search === '' ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || item.categoryId === filterCategory
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    return matchSearch && matchCategory && matchStatus
  })

  // Stats
  const totalItems = items.length
  const availableItems = items.filter(i => i.status === 'DISPONIBLE').length
  const assignedItems = items.filter(i => i.status === 'ASIGNADO').length
  const expiringItems = items.filter(i => {
    if (!i.expiryDate) return false
    const exp = new Date(i.expiryDate)
    const now = new Date()
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30 && diff > 0
  }).length
  const expiredItems = items.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date()).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventario / Ropería</h2>
          <p className="text-gray-500 mt-1">Control de equipamiento y ropería del cuartel</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateItem} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Item
          </Button>
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Categoría
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: totalItems, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Disponibles', value: availableItems, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Asignados', value: assignedItems, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Por Vencer', value: expiringItems, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Vencidos', value: expiredItems, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar por código, marca, categoría..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DISPONIBLE">Disponible</SelectItem>
            <SelectItem value="ASIGNADO">Asignado</SelectItem>
            <SelectItem value="EN_REPARACION">En Reparación</SelectItem>
            <SelectItem value="DADO_DE_BAJA">Dado de Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs: Items vs Categorías */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Items ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="categories">Categorías ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron items</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const currentAssignment = item.assignments?.[0]
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
                const isExpiring = item.expiryDate && !isExpired && ((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30

                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-50 p-2 rounded-lg">
                            <Package className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.code}</p>
                            <p className="text-xs text-gray-500">{item.category?.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={`text-[10px] ${STATUS_COLORS[item.status] || ''}`}>{item.status.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>

                      {item.brand && <p className="text-xs text-gray-600">{item.brand} {item.model}</p>}
                      {item.size && <p className="text-xs text-gray-500">Talle: {item.size}</p>}

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-[10px] ${CONDITION_COLORS[item.condition] || ''}`}>{item.condition}</Badge>
                        {isExpired && <Badge className="text-[10px] bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Vencido</Badge>}
                        {isExpiring && <Badge className="text-[10px] bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Por vencer</Badge>}
                      </div>

                      {currentAssignment && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-800">
                            👤 {currentAssignment.personnel?.firstName} {currentAssignment.personnel?.lastName}
                            <span className="text-amber-600 ml-1">({currentAssignment.personnel?.rank})</span>
                          </p>
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            Desde {new Date(currentAssignment.assignedDate).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t">
                        {item.status === 'DISPONIBLE' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                            setSelectedItem(item)
                            setAssignPersonnelId('')
                            setAssignDialogOpen(true)
                          }}>
                            <UserCheck className="h-3 w-3 mr-1" /> Asignar
                          </Button>
                        )}
                        {currentAssignment?.status === 'ACTIVO' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => returnItem(currentAssignment.id)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Devolver
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedItem(item); setDetailDialogOpen(true) }}>
                          Ver más
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditItem(item)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => { setDeleteTarget(item); setDeleteDialogOpen(true) }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Card key={cat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                    <Badge variant="secondary" className="text-[10px] mt-1">{cat._count?.items || 0} items</Badge>
                  </div>
                  <Package className="h-8 w-8 text-gray-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Nuevo Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="Ej: CAS-001" />
              </div>
              <div>
                <Label>Categoría *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input value={formBrand} onChange={e => setFormBrand(e.target.value)} /></div>
              <div><Label>Modelo</Label><Input value={formModel} onChange={e => setFormModel(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols 3 gap-3">
              <div><Label>Talle</Label><Input value={formSize} onChange={e => setFormSize(e.target.value)} placeholder="S, M, L, XL..." /></div>
              <div><Label>Nº Serie</Label><Input value={formSerial} onChange={e => setFormSerial(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estado</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="ASIGNADO">Asignado</SelectItem>
                    <SelectItem value="EN_REPARACION">En Reparación</SelectItem>
                    <SelectItem value="DADO_DE_BAJA">Dado de Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condición</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUEVO">Nuevo</SelectItem>
                    <SelectItem value="BUENO">Bueno</SelectItem>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="MALO">Malo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha Compra</Label><Input type="date" value={formPurchaseDate} onChange={e => setFormPurchaseDate(e.target.value)} /></div>
              <div><Label>Fecha Vencimiento</Label><Input type="date" value={formExpiryDate} onChange={e => setFormExpiryDate(e.target.value)} /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem} disabled={!formCode || !formCategory} className="bg-red-600 hover:bg-red-700">
              {editingItem ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nueva Categoría</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ej: Casco, Botas, Traje..." /></div>
            <div><Label>Descripción</Label><Input value={catDesc} onChange={e => setCatDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveCategory} disabled={!catName} className="bg-red-600 hover:bg-red-700">Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar Equipo</DialogTitle>
            <p className="text-sm text-gray-500">{selectedItem?.code} - {selectedItem?.category?.name}</p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Personal *</Label>
              <Select value={assignPersonnelId} onValueChange={setAssignPersonnelId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar bombero" /></SelectTrigger>
                <SelectContent>
                  {personnel.filter(p => p.status === 'ACTIVO' || !p.status).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.rank})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Input value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={assignItem} disabled={!assignPersonnelId} className="bg-red-600 hover:bg-red-700">Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalle del Item</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Código:</span> <span className="font-medium">{selectedItem.code}</span></div>
                <div><span className="text-gray-500">Categoría:</span> <span className="font-medium">{selectedItem.category?.name}</span></div>
                {selectedItem.brand && <div><span className="text-gray-500">Marca:</span> <span className="font-medium">{selectedItem.brand}</span></div>}
                {selectedItem.model && <div><span className="text-gray-500">Modelo:</span> <span className="font-medium">{selectedItem.model}</span></div>}
                {selectedItem.size && <div><span className="text-gray-500">Talle:</span> <span className="font-medium">{selectedItem.size}</span></div>}
                {selectedItem.serialNumber && <div><span className="text-gray-500">Nº Serie:</span> <span className="font-medium">{selectedItem.serialNumber}</span></div>}
                <div><span className="text-gray-500">Estado:</span> <Badge className={`text-[10px] ${STATUS_COLORS[selectedItem.status]}`}>{selectedItem.status.replace(/_/g, ' ')}</Badge></div>
                <div><span className="text-gray-500">Condición:</span> <Badge className={`text-[10px] ${CONDITION_COLORS[selectedItem.condition]}`}>{selectedItem.condition}</Badge></div>
                {selectedItem.purchaseDate && <div><span className="text-gray-500">Compra:</span> {new Date(selectedItem.purchaseDate).toLocaleDateString('es-AR')}</div>}
                {selectedItem.expiryDate && <div><span className="text-gray-500">Vencimiento:</span> {new Date(selectedItem.expiryDate).toLocaleDateString('es-AR')}</div>}
              </div>
              {selectedItem.notes && <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">{selectedItem.notes}</div>}

              {/* History */}
              {selectedItem.assignments && selectedItem.assignments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Historial de Asignaciones</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItem.assignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div>
                          <span className="font-medium">{a.personnel?.firstName} {a.personnel?.lastName}</span>
                          <span className="text-gray-400 ml-1">({a.personnel?.rank})</span>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">{new Date(a.assignedDate).toLocaleDateString('es-AR')}</p>
                          {a.returnedDate && <p className="text-green-600">Devuelto: {new Date(a.returnedDate).toLocaleDateString('es-AR')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el item <strong>{deleteTarget?.code}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
