'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings, Save, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Setting {
  id: string
  key: string
  value: string
}

export default function Configuracion() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        const vals: Record<string, string> = {}
        data.forEach((s: Setting) => { vals[s.key] = s.value })
        setEditValues(vals)
      }
    } catch {
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    const value = editValues[key]
    if (!key || value === undefined) {
      toast.error('Key y value son requeridos')
      return
    }
    setSaving((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (res.ok) {
        toast.success('Configuración actualizada')
        fetchSettings()
      } else {
        toast.error('Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleAdd = async () => {
    if (!newKey || !newValue) {
      toast.error('Clave y valor son requeridos')
      return
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      })
      if (res.ok) {
        toast.success('Configuración creada')
        setNewKey('')
        setNewValue('')
        fetchSettings()
      } else {
        toast.error('Error al crear')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-500 mt-1">Administrar configuración del sistema</p>
      </div>

      {/* Add New Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nueva Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Clave (key)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="sm:w-48"
            />
            <Input
              placeholder="Valor"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              <Save className="h-4 w-4 mr-2" /> Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" /> Configuraciones Actuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-3">No hay configuraciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-mono font-medium text-gray-700">{setting.key}</p>
                  </div>
                  <Input
                    value={editValues[setting.key] ?? setting.value}
                    onChange={(e) =>
                      setEditValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.key)}
                    disabled={saving[setting.key]}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
