'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Settings, Save, Plus, Users, Shield, Edit2, Trash2, Key } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string
}

interface UserItem {
  id: string
  username: string
  name: string
  email: string | null
  role: string
  active: boolean
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  oficial: 'Oficial',
  bombero: 'Bombero',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  oficial: 'bg-amber-100 text-amber-800',
  bombero: 'bg-green-100 text-green-800',
}

export default function Configuracion() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('settings')

  // Settings
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Users
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [uUsername, setUUsername] = useState('')
  const [uName, setUName] = useState('')
  const [uEmail, setUEmail] = useState('')
  const [uRole, setURole] = useState('bombero')
  const [uPassword, setUPassword] = useState('')
  const [uActive, setUActive] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [sRes, uRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users').catch(() => null),
      ])
      if (sRes?.ok) {
        const data = await sRes.json()
        setSettings(data)
        const vals: Record<string, string> = {}
        data.forEach((s: Setting) => { vals[s.key] = s.value })
        setEditValues(vals)
      }
      if (uRes?.ok) {
        setUsers(await uRes.json())
      }
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    const value = editValues[key]
    setSaving(p => ({ ...p, [key]: true }))
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (res.ok) { toast.success('Configuración actualizada'); fetchAll() }
      else toast.error('Error al guardar')
    } catch { toast.error('Error de conexión') }
    finally { setSaving(p => ({ ...p, [key]: false })) }
  }

  const handleAdd = async () => {
    if (!newKey || !newValue) { toast.error('Clave y valor son requeridos'); return }
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      })
      if (res.ok) { toast.success('Configuración creada'); setNewKey(''); setNewValue(''); fetchAll() }
      else toast.error('Error al crear')
    } catch { toast.error('Error de conexión') }
  }

  const openCreateUser = () => {
    setEditingUser(null)
    setUUsername(''); setUName(''); setUEmail(''); setURole('bombero'); setUPassword(''); setUActive(true)
    setUserDialogOpen(true)
  }

  const openEditUser = (user: UserItem) => {
    setEditingUser(user)
    setUUsername(user.username); setUName(user.name); setUEmail(user.email || ''); setURole(user.role); setUPassword(''); setUActive(user.active)
    setUserDialogOpen(true)
  }

  const saveUser = async () => {
    try {
      if (editingUser) {
        const body: Record<string, unknown> = { name: uName, email: uEmail || null, role: uRole, active: uActive }
        if (uPassword) body.password = uPassword
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (res.ok) { toast.success('Usuario actualizado'); setUserDialogOpen(false); fetchAll() }
        else { const d = await res.json(); toast.error(d.error || 'Error') }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uUsername, password: uPassword, name: uName, email: uEmail || null, role: uRole }),
        })
        const d = await res.json()
        if (res.ok) { toast.success('Usuario creado'); setUserDialogOpen(false); fetchAll() }
        else toast.error(d.error || 'Error')
      }
    } catch { toast.error('Error de conexión') }
  }

  const toggleUserActive = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      if (res.ok) { toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado'); fetchAll() }
    } catch { toast.error('Error') }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-500 mt-1">Administrar sistema y usuarios</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Nueva Configuración</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input placeholder="Clave (key)" value={newKey} onChange={e => setNewKey(e.target.value)} className="sm:w-48" />
                <Input placeholder="Valor" value={newValue} onChange={e => setNewValue(e.target.value)} className="flex-1" />
                <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700"><Save className="h-4 w-4 mr-2" /> Guardar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Configuraciones Actuales</CardTitle></CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <div className="text-center py-8"><Settings className="h-10 w-10 text-gray-300 mx-auto" /><p className="text-gray-500 mt-3">No hay configuraciones</p></div>
              ) : (
                <div className="space-y-3">
                  {settings.map(s => (
                    <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-40 shrink-0"><p className="text-sm font-mono font-medium text-gray-700">{s.key}</p></div>
                      <Input value={editValues[s.key] ?? s.value} onChange={e => setEditValues(p => ({ ...p, [s.key]: e.target.value }))} className="flex-1" />
                      <Button size="sm" onClick={() => handleSave(s.key)} disabled={saving[s.key]} className="bg-red-600 hover:bg-red-700"><Save className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateUser} className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" /> Nuevo Usuario</Button>
          </div>

          {users.length === 0 ? (
            <Card><CardContent className="p-8 text-center"><Users className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No hay usuarios</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <Card key={user.id} className={`hover:shadow-md transition-shadow ${!user.active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                      <Badge className={`text-[10px] ${ROLE_COLORS[user.role] || 'bg-gray-100'}`}>{ROLE_LABELS[user.role] || user.role}</Badge>
                    </div>
                    {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                    <Badge variant={user.active ? 'default' : 'secondary'} className="text-[10px] mt-1">{user.active ? 'Activo' : 'Inactivo'}</Badge>
                    <div className="flex gap-1 mt-3 pt-2 border-t">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditUser(user)}><Edit2 className="h-3 w-3 mr-1" /> Editar</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toggleUserActive(user)}>{user.active ? 'Desactivar' : 'Activar'}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Role Legend */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Permisos por Rol</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { role: 'admin', label: 'Administrador', access: 'Acceso completo a todos los módulos y gestión de usuarios' },
                  { role: 'oficial', label: 'Oficial', access: 'Dashboard, Personal, Incidentes, Guardias, Asistencias, Flota, Inventario, Puntajes, Alertas, Pagos, Novedades' },
                  { role: 'bombero', label: 'Bombero', access: 'Dashboard, Asistencias, Inventario, Puntajes, Alertas, Novedades' },
                ].map(r => (
                  <div key={r.role} className="p-3 bg-gray-50 rounded-lg">
                    <Badge className={`text-xs ${ROLE_COLORS[r.role]}`}>{r.label}</Badge>
                    <p className="text-xs text-gray-500 mt-2">{r.access}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editingUser && (
              <div><Label>Usuario *</Label><Input value={uUsername} onChange={e => setUUsername(e.target.value)} /></div>
            )}
            <div><Label>Nombre *</Label><Input value={uName} onChange={e => setUName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} /></div>
            <div>
              <Label>Rol *</Label>
              <Select value={uRole} onValueChange={setURole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="oficial">Oficial</SelectItem>
                  <SelectItem value="bombero">Bombero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label>
              <Input type="password" value={uPassword} onChange={e => setUPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveUser} className="bg-red-600 hover:bg-red-700" disabled={!editingUser && (!uUsername || !uPassword || !uName)}>
              {editingUser ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
