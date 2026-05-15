'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  FileText, Download, BarChart3, Users, Truck, DollarSign,
  Calendar, TrendingUp, FileSpreadsheet, AlertTriangle
} from 'lucide-react'

interface Stats {
  personnelCount: number
  activePersonnel: number
  incidentCount: number
  vehicleCount: number
  openIncidents: number
  unreadAlerts: number
  todayAttendance: number
  totalIncome: number
  totalExpenses: number
  personnelByRank: { rank: string; count: number }[]
  recentIncidents: { id: string; type: string; description: string; severity: string; status: string; date: string }[]
}

export default function Reportes() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [personnel, setPersonnel] = useState<unknown[]>([])
  const [incidents, setIncidents] = useState<unknown[]>([])
  const [vehicles, setVehicles] = useState<unknown[]>([])
  const [payments, setPayments] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchData = useCallback(async () => {
    try {
      const [sRes, pRes, iRes, vRes, payRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/personnel'),
        fetch('/api/incidents'),
        fetch('/api/vehicles'),
        fetch('/api/payments'),
      ])
      if (sRes.ok) setStats(await sRes.json())
      if (pRes.ok) setPersonnel(await pRes.json())
      if (iRes.ok) setIncidents(await iRes.json())
      if (vRes.ok) setVehicles(await vRes.json())
      if (payRes.ok) setPayments(await payRes.json())
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) { toast.error('No hay datos para exportar'); return }

    const headers = Object.keys(data[0] as Record<string, unknown>)
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = (row as Record<string, unknown>)[h]
          const str = val === null || val === undefined ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        }).join(',')
      ),
    ]
    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success(`${filename} exportado`)
  }

  const exportPersonnelReport = () => {
    const data = (personnel as Record<string, unknown>[]).map(p => ({
      Nombre: p.firstName, Apellido: p.lastName, DNI: p.dni, Grado: p.rank,
      Estado: p.status, Aptitud: p.fitness, 'Grupo Sanguíneo': p.bloodGroup || '',
      Teléfono: p.phone || '', Email: p.email || '',
      'Fecha Ingreso': p.joinDate ? new Date(p.joinDate as string).toLocaleDateString('es-AR') : '',
    }))
    exportCSV(data, 'Personal')
  }

  const exportIncidentsReport = () => {
    const data = (incidents as Record<string, unknown>[]).map(i => ({
      Tipo: i.type, Descripción: i.description, Dirección: i.address || '',
      Fecha: i.date ? new Date(i.date as string).toLocaleDateString('es-AR') : '',
      Hora: i.time || '', Severidad: i.severity, Estado: i.status,
    }))
    exportCSV(data, 'Incidentes')
  }

  const exportVehiclesReport = () => {
    const data = (vehicles as Record<string, unknown>[]).map(v => ({
      Tipo: v.type, Marca: v.brand, Modelo: v.model, Año: v.year || '',
      Patente: v.plate, Estado: v.status, Kilometraje: v.km, Combustible: v.fuelType || '',
    }))
    exportCSV(data, 'Vehiculos')
  }

  const exportPaymentsReport = () => {
    const data = (payments as Record<string, unknown>[]).map(p => ({
      Tipo: p.type, Concepto: p.concept, Monto: p.amount,
      Fecha: p.date ? new Date(p.date as string).toLocaleDateString('es-AR') : '',
      Pagador: p.payer || '', Método: p.method || '',
    }))
    exportCSV(data, 'Pagos')
  }

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  if (loading) {
    return <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div></div>
  }

  const balance = (stats?.totalIncome || 0) - (stats?.totalExpenses || 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <p className="text-gray-500 mt-1">Exportación y visualización de datos</p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Personal Activo', value: stats?.activePersonnel || 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Incidentes', value: stats?.incidentCount || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Vehículos', value: stats?.vehicleCount || 0, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Balance', value: `$${balance.toLocaleString()}`, icon: DollarSign, color: balance >= 0 ? 'text-emerald-600' : 'text-red-600', bg: balance >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-xl`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Cards */}
      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export"><Download className="h-4 w-4 mr-2" /> Exportar</TabsTrigger>
          <TabsTrigger value="charts"><BarChart3 className="h-4 w-4 mr-2" /> Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportPersonnelReport}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-green-50 p-4 rounded-2xl"><Users className="h-8 w-8 text-green-600" /></div>
                <div className="flex-1">
                  <p className="font-semibold">Reporte de Personal</p>
                  <p className="text-sm text-gray-500">{personnel.length} registros</p>
                  <Badge variant="outline" className="text-[10px] mt-1">CSV</Badge>
                </div>
                <FileSpreadsheet className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportIncidentsReport}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-red-50 p-4 rounded-2xl"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
                <div className="flex-1">
                  <p className="font-semibold">Reporte de Incidentes</p>
                  <p className="text-sm text-gray-500">{incidents.length} registros</p>
                  <Badge variant="outline" className="text-[10px] mt-1">CSV</Badge>
                </div>
                <FileSpreadsheet className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportVehiclesReport}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-amber-50 p-4 rounded-2xl"><Truck className="h-8 w-8 text-amber-600" /></div>
                <div className="flex-1">
                  <p className="font-semibold">Reporte de Flota</p>
                  <p className="text-sm text-gray-500">{vehicles.length} registros</p>
                  <Badge variant="outline" className="text-[10px] mt-1">CSV</Badge>
                </div>
                <FileSpreadsheet className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={exportPaymentsReport}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl"><DollarSign className="h-8 w-8 text-emerald-600" /></div>
                <div className="flex-1">
                  <p className="font-semibold">Reporte de Pagos</p>
                  <p className="text-sm text-gray-500">{payments.length} registros</p>
                  <Badge variant="outline" className="text-[10px] mt-1">CSV</Badge>
                </div>
                <FileSpreadsheet className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-4 space-y-4">
          {/* Personnel by Rank */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Personal por Grado</CardTitle></CardHeader>
            <CardContent>
              {stats?.personnelByRank && stats.personnelByRank.length > 0 ? (
                <div className="space-y-3">
                  {stats.personnelByRank.map((item, i) => {
                    const maxCount = Math.max(...stats.personnelByRank.map(r => r.count))
                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-green-500']
                    return (
                      <div key={item.rank} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-28 text-right">{item.rank}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                          <div
                            className={`h-full rounded-full flex items-center justify-end pr-2 ${colors[i % colors.length]}`}
                            style={{ width: `${(item.count / maxCount) * 100}%`, minWidth: '2rem' }}
                          >
                            <span className="text-white text-xs font-bold">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Sin datos</p>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Resumen Financiero</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-gray-500">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">${(stats?.totalIncome || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-xs text-gray-500">Egresos</p>
                  <p className="text-2xl font-bold text-red-600">${(stats?.totalExpenses || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${balance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
