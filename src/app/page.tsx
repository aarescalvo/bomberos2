'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Loader2, Database, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import AppShell, { type Section } from '@/components/AppShell'
import Dashboard from '@/components/Dashboard'
import Personal from '@/components/Personal'
import Incidentes from '@/components/Incidentes'
import Guardias from '@/components/Guardias'
import Asistencias from '@/components/Asistencias'
import Flota from '@/components/Flota'
import Alertas from '@/components/Alertas'
import Pagos from '@/components/Pagos'
import Novedades from '@/components/Novedades'
import Configuracion from '@/components/Configuracion'

interface User {
  userId: string
  username: string
  name: string
  role: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [seeding, setSeeding] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Bienvenido, ' + (data.user?.name || username))
        // Verify auth after login
        try {
          const meRes = await fetch('/api/auth/me')
          if (meRes.ok) {
            const meData = await meRes.json()
            setUser(meData.user)
          } else {
            // If /me fails after login, still try to set user from login response
            setUser(data.user || { userId: '', username, name: data.user?.name || username, role: data.user?.role || 'user' })
          }
        } catch {
          // If /me fails, use login response data
          setUser(data.user || { userId: '', username, name: data.user?.name || username, role: data.user?.role || 'user' })
        }
        setUsername('')
        setPassword('')
      } else {
        setLoginError(data.error || 'Error al iniciar sesión')
      }
    } catch {
      setLoginError('Error de conexión. Intente nuevamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/auth/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Base de datos inicializada')
        if (data.seeded) {
          toast.info('Credenciales: admin / admin123')
        }
      } else {
        toast.error('Error al inicializar base de datos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSeeding(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
    }
    setUser(null)
    setActiveSection('dashboard')
    toast.success('Sesión cerrada')
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'personal':
        return <Personal />
      case 'incidentes':
        return <Incidentes />
      case 'guardias':
        return <Guardias />
      case 'asistencias':
        return <Asistencias />
      case 'flota':
        return <Flota />
      case 'alertas':
        return <Alertas />
      case 'pagos':
        return <Pagos />
      case 'novedades':
        return <Novedades />
      case 'configuracion':
        return <Configuracion />
      default:
        return <Dashboard />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-red-600 p-3 rounded-2xl animate-pulse">
            <Flame className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  // Login page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="bg-red-600 p-3 rounded-2xl">
                <Flame className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">SGP-B</CardTitle>
            <p className="text-gray-500 text-sm mt-1">
              Sistema de Gestión - Bomberos
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loginLoading}
                  autoComplete="username"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginLoading}
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-gray-400 mb-3">
                Si es la primera vez, inicialice la base de datos
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="w-full"
              >
                {seeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Inicializar Base de Datos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main app
  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName={user.name || user.username}
      userRole={user.role}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppShell>
  )
}
