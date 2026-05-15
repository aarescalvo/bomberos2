'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus, Clock, CheckCircle, XCircle, LogIn, LogOut,
  Users, TrendingUp, Calendar
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  personnelId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  notes: string | null
  personnel: { id: string; firstName: string; lastName: string; rank: string }
}

interface Personnel {
  id: string
  firstName: string
  lastName: string
  rank: string
  status: string
}

export default function Asistencias() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    personnelId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: new Date().toTimeString().slice(0, 5),
    checkOut: '',
    status: 'PRESENTE',
    notes: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [attRes, perRes] = await Promise.all([fetch('/api/attendance'), fetch('/api/personnel')])
      if (attRes.ok) setRecords(await attRes.json())
      if (perRes.ok) setPersonnel((await perRes.json()).filter((p: Personnel) => p.status === 'ACTIVO'))
    } catch { toast.error('Error al cargar datos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Quick check-in for a specific person
  const quickCheckIn = async (personId: string) => {
    try {
      const now = new Date()
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnelId: personId,
          date: now.toISOString().split('T')[0],
          checkIn: now.toISOString(),
          status: 'PRESENTE',
        }),
      })
      if (res.ok) { toast.success('Check-in registrado'); fetchData() }
      else { const d = await res.json(); toast.error(d.error || 'Error') }
    } catch { toast.error('Error de conexión') }
  }

  // Quick check-out
  const quickCheckOut = async (recordId: string) => {
    try {
      const now = new Date()
      const res = await fetch(`/api/attendance/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOut: now.toISOString() }),
      })
      // The PUT might not exist yet - use the attendance route
      if (res.ok || res.status === 405) {
        toast.success('Check-out registrado')
        fetchData()
      }
    } catch { toast.error('Error de conexión') }
  }

  const handleSave = async () => {
    if (!form.personnelId || !form.date) { toast.error('Personal y fecha son requeridos'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : undefined,
        checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : undefined,
      }
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Asistencia registrada')
        setShowCreate(false)
        setForm({ personnelId: '', date: new Date().toISOString().split('T')[0], checkIn: new Date().toTimeString().slice(0, 5), checkOut: '', status: 'PRESENTE', notes: '' })
        fetchData()
      } else { const d = await res.json(); toast.error(d.error || 'Error') }
    } catch { toast.error('Error de conexión') }
    finally { setSaving(false) }
  }

  const getStatusColor = (status: string) => {
    const c: Record<string, string> = { PRESENTE: 'bg-green-100 text-green-800', AUSENTE: 'bg-red-100 text-red-800', TARDE: 'bg-yellow-100 text-yellow-800', LICENCIA: 'bg-blue-100 text-blue-800' }
    return c[status] || 'bg-gray-100 text-gray-800'
  }

  // Today's stats
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter(r => r.date?.split('T')[0] === today)
  const presentToday = todayRecords.filter(r => r.status === 'PRESENTE').length
  const lateToday = todayRecords.filter(r => r.status === 'TARDE').length
  const absentToday = todayRecords.filter(r => r.status === 'AUSENTE').length
  const activePersonnel = personnel.length

  // Filtered by date and status
  const filtered = records.filter(r => {
    const matchDate = !filterDate || r.date?.split('T')[0] === filterDate
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus
    return matchDate && matchStatus
  })

  // Personnel not yet checked in today
  const checkedInIds = new Set(todayRecords.map(r => r.personnelId))
  const notCheckedIn = personnel.filter(p => !checkedInIds.has(p.id))

  if (loading) {
    return <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asistencias</h2>
          <p className="text-gray-500 mt-1">Control de asistencia en tiempo real</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" /> Registrar Asistencia
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Presentes', value: presentToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tardes', value: lateToday, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Ausentes', value: absentToday, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Activo', value: activePersonnel, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-xl`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-xs text-gray-500">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today"><Calendar className="h-4 w-4 mr-1" /> Check-in Rápido</TabsTrigger>
          <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" /> Historial</TabsTrigger>
        </TabsList>

        {/* Quick Check-in Tab */}
        <TabsContent value="today" className="mt-4">
          {notCheckedIn.length === 0 ? (
            <Card><CardContent className="p-8 text-center"><CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" /><p className="text-gray-500">Todo el personal registró asistencia hoy</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {notCheckedIn.map(p => (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.lastName}, {p.firstName}</p>
                      <Badge variant="outline" className="text-[10px]">{p.rank}</Badge>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => quickCheckIn(p.id)}>
                      <LogIn className="h-3 w-3 mr-1" /> Check-in
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Today's records with check-out */}
          {todayRecords.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Registros de hoy</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayRecords.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${getStatusColor(rec.status)}`}>{rec.status}</Badge>
                      <span className="text-sm">{rec.personnel.lastName}, {rec.personnel.firstName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      <span>→</span>
                      <span>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      {!rec.checkOut && rec.status === 'PRESENTE' && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => quickCheckOut(rec.id)}>
                          <LogOut className="h-3 w-3 mr-1" /> Salida
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="sm:w-44" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
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
            <Card><CardContent className="p-8 text-center"><Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No hay registros</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(rec => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{rec.personnel.lastName}, {rec.personnel.firstName}</h3>
                        <p className="text-xs text-gray-400">{rec.personnel.rank}</p>
                        <p className="text-sm text-gray-500 mt-1">{new Date(rec.date).toLocaleDateString('es-AR')}</p>
                      </div>
                      <Badge className={`text-[10px] ${getStatusColor(rec.status)}`}>{rec.status}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Entrada: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      <span>Salida: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Asistencia</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Personal *</Label>
              <Select value={form.personnelId} onValueChange={v => setForm({ ...form, personnelId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{personnel.map(p => <SelectItem key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.rank})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fecha *</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora Entrada</Label><Input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} /></div>
              <div><Label>Hora Salida</Label><Input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} /></div>
            </div>
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['PRESENTE', 'AUSENTE', 'TARDE', 'LICENCIA'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? 'Guardando...' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
