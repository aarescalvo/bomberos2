'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  Flame,
  Calendar,
  Clock,
  Truck,
  Bell,
  DollarSign,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Flame as FireIcon,
  Package,
  Trophy,
  FileText,
} from 'lucide-react'

export type Section =
  | 'dashboard'
  | 'personal'
  | 'incidentes'
  | 'guardias'
  | 'asistencias'
  | 'flota'
  | 'inventario'
  | 'puntajes'
  | 'reportes'
  | 'alertas'
  | 'pagos'
  | 'novedades'
  | 'configuracion'

interface NavItem {
  id: Section
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ROLE_ACCESS: Record<string, Section[]> = {
  admin: ['dashboard', 'personal', 'incidentes', 'guardias', 'asistencias', 'flota', 'inventario', 'puntajes', 'reportes', 'alertas', 'pagos', 'novedades', 'configuracion'],
  oficial: ['dashboard', 'personal', 'incidentes', 'guardias', 'asistencias', 'flota', 'inventario', 'puntajes', 'reportes', 'alertas', 'pagos', 'novedades'],
  bombero: ['dashboard', 'asistencias', 'inventario', 'puntajes', 'reportes', 'alertas', 'novedades'],
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  oficial: 'Oficial',
  bombero: 'Bombero',
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'personal', label: 'Personal', icon: Users },
  { id: 'incidentes', label: 'Incidentes', icon: Flame },
  { id: 'guardias', label: 'Guardias', icon: Calendar },
  { id: 'asistencias', label: 'Asistencias', icon: Clock },
  { id: 'flota', label: 'Flota', icon: Truck },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'puntajes', label: 'Puntajes', icon: Trophy },
  { id: 'reportes', label: 'Reportes', icon: FileText },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'pagos', label: 'Pagos', icon: DollarSign },
  { id: 'novedades', label: 'Novedades', icon: ClipboardList },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
]

interface AppShellProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
  children: React.ReactNode
  userName: string
  userRole: string
  onLogout: () => void
}

export default function AppShell({
  activeSection,
  onSectionChange,
  children,
  userName,
  userRole,
  onLogout,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleNavClick = (section: Section) => {
    onSectionChange(section)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 lg:static lg:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          {/* Logo area */}
          <div className="flex items-center justify-between p-4 h-16">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <FireIcon className="h-5 w-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-sm font-bold leading-tight">SGP-B</h1>
                  <p className="text-[10px] text-slate-400 leading-tight">Bomberos</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 lg:flex hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="bg-slate-700" />

          {/* Navigation */}
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-1 px-2">
              {navItems
                .filter(item => {
                  const allowed = ROLE_ACCESS[userRole] || ROLE_ACCESS.bombero
                  return allowed.includes(item.id)
                })
                .map((item) => {
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>

          <Separator className="bg-slate-700" />

          {/* User info */}
          <div className={`p-3 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? '' : ''}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-red-600 text-white text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{ROLE_LABELS[userRole] || userRole}</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8"
                  onClick={onLogout}
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 mt-2"
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {navItems.find((item) => item.id === activeSection)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-red-600 text-white text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[userRole] || userRole}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout} title="Cerrar sesión">
                <LogOut className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t py-3 px-4 text-center">
            <p className="text-xs text-gray-400">
              SGP-B © {new Date().getFullYear()} — Sistema de Gestión de Personal - Bomberos
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
