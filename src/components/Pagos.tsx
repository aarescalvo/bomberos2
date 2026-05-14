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
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  type: string
  concept: string
  amount: number
  date: string
  payer: string | null
  method: string | null
  receipt: string | null
  notes: string | null
}

const emptyForm = {
  type: 'CUOTA',
  concept: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  payer: '',
  method: 'EFECTIVO',
  receipt: '',
  notes: '',
}

export default function Pagos() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('ALL')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments')
      if (res.ok) setPayments(await res.json())
    } catch {
      toast.error('Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.concept || !form.amount || !form.date) {
      toast.error('Concepto, monto y fecha son requeridos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      if (res.ok) {
        toast.success('Pago registrado')
        setShowCreate(false)
        setForm(emptyForm)
        fetchPayments()
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CUOTA: 'bg-green-100 text-green-800',
      DONACION: 'bg-blue-100 text-blue-800',
      SUBSIDIO: 'bg-purple-100 text-purple-800',
      OTRO: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const isIncome = (type: string) => ['CUOTA', 'DONACION', 'SUBSIDIO'].includes(type)

  const filtered = payments.filter((p) => filterType === 'ALL' || p.type === filterType)

  const totalIncome = payments
    .filter((p) => isIncome(p.type))
    .reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = payments
    .filter((p) => !isIncome(p.type))
    .reduce((sum, p) => sum + p.amount, 0)

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
          <h2 className="text-2xl font-bold text-gray-900">Pagos</h2>
          <p className="text-gray-500 mt-1">{payments.length} registros</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setShowCreate(true) }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo Pago
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Ingresos</p>
              <p className="text-lg font-bold text-green-600">${totalIncome.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Egresos</p>
              <p className="text-lg font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Balance</p>
              <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                ${(totalIncome - totalExpenses).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="CUOTA">Cuota</SelectItem>
            <SelectItem value="DONACION">Donación</SelectItem>
            <SelectItem value="SUBSIDIO">Subsidio</SelectItem>
            <SelectItem value="OTRO">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{payment.concept}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(payment.date).toLocaleDateString('es-AR')}
                      {payment.payer && ` • ${payment.payer}`}
                    </p>
                  </div>
                  <Badge className={`text-[10px] ${getTypeColor(payment.type)}`}>{payment.type}</Badge>
                </div>
                <p className={`text-xl font-bold mt-2 ${isIncome(payment.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome(payment.type) ? '+' : '-'}${payment.amount.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-2 text-xs text-gray-400">
                  {payment.method && <span>Método: {payment.method}</span>}
                  {payment.receipt && <span>• Recibo: {payment.receipt}</span>}
                </div>
                {payment.notes && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{payment.notes}</p>
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
            <DialogTitle>Nuevo Pago</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['CUOTA', 'DONACION', 'SUBSIDIO', 'OTRO'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monto *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Concepto *</Label>
              <Input
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
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
                <Label>Pagador</Label>
                <Input
                  value={form.payer}
                  onChange={(e) => setForm({ ...form, payer: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Método</Label>
                <Select value={form.method || '_none'} onValueChange={(v) => setForm({ ...form, method: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin especificar</SelectItem>
                    {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>N° Recibo</Label>
                <Input
                  value={form.receipt}
                  onChange={(e) => setForm({ ...form, receipt: e.target.value })}
                />
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
              {saving ? 'Guardando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
