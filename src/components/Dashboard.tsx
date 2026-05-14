'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Flame, Truck, AlertTriangle, DollarSign, Clock, TrendingUp, Shield } from 'lucide-react'

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
  recentIncidents: {
    id: string
    type: string
    description: string
    severity: string
    status: string
    date: string
  }[]
  upcomingAlerts: {
    id: string
    title: string
    message: string
    priority: string
    type: string
  }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Personal Total',
      value: stats?.personnelCount ?? 0,
      subtitle: `${stats?.activePersonnel ?? 0} activos`,
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Incidentes del Mes',
      value: stats?.incidentCount ?? 0,
      subtitle: `${stats?.openIncidents ?? 0} abiertos`,
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Vehículos Operativos',
      value: stats?.vehicleCount ?? 0,
      subtitle: 'en servicio',
      icon: Truck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Alertas sin Leer',
      value: stats?.unreadAlerts ?? 0,
      subtitle: 'pendientes',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Asistencia Hoy',
      value: stats?.todayAttendance ?? 0,
      subtitle: 'presentes',
      icon: Clock,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${(stats?.totalIncome ?? 0).toLocaleString()}`,
      subtitle: 'recaudado',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Egresos del Mes',
      value: `$${(stats?.totalExpenses ?? 0).toLocaleString()}`,
      subtitle: 'gastado',
      icon: TrendingUp,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: 'Balance',
      value: `$${((stats?.totalIncome ?? 0) - (stats?.totalExpenses ?? 0)).toLocaleString()}`,
      subtitle: 'neto',
      icon: Shield,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ]

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ABIERTO: 'bg-red-100 text-red-800',
      EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
      CERRADO: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      URGENTE: 'bg-red-100 text-red-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.bg} p-3 rounded-xl`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personnel by Rank */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal por Grado</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.personnelByRank && stats.personnelByRank.length > 0 ? (
              <div className="space-y-3">
                {stats.personnelByRank.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.rank}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              (item.count / Math.max(...stats.personnelByRank.map((r) => r.count))) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin datos de personal</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidentes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentIncidents && stats.recentIncidents.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {inc.type} - {inc.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inc.date).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="flex gap-1.5 ml-2">
                      <Badge className={`text-[10px] ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </Badge>
                      <Badge className={`text-[10px] ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin incidentes recientes</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alertas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingAlerts && stats.upcomingAlerts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.upcomingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${getPriorityBadge(alert.priority)}`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-2">
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin alertas pendientes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
