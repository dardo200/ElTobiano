"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import type { Venta } from "@/types"

export default function CompletarVentaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Estado para el número de seguimiento
  const [numeroSeguimiento, setNumeroSeguimiento] = useState<string>("")

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const response = await fetch(`/api/ventas/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setVenta(data)

          // Prellenar campo si ya existe
          if (data.numero_seguimiento) setNumeroSeguimiento(data.numero_seguimiento)

          // Si la venta no está en estado "Despachado", redirigir
          if (data.estado !== "Despachado") {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Esta venta no está en estado Despachado",
            })
            router.push(`/ventas/${params.id}`)
          }
        } else {
          console.error("Error al obtener la venta")
          router.push("/ventas")
        }
      } catch (error) {
        console.error("Error al obtener la venta:", error)
        router.push("/ventas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenta()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!venta) return

    setIsSaving(true)

    try {
      // Primero actualizamos el número de seguimiento
      const updateResponse = await fetch(`/api/ventas/${venta.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_seguimiento: numeroSeguimiento,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || "Error al actualizar el número de seguimiento")
      }

      // Luego cambiamos el estado a "Completado"
      const estadoResponse = await fetch(`/api/ventas/${venta.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "Completado" }),
      })

      if (!estadoResponse.ok) {
        const errorData = await estadoResponse.json()
        throw new Error(errorData.error || "Error al cambiar el estado de la venta")
      }

      toast({
        title: "Éxito",
        description: "Venta completada correctamente",
      })

      // Añadimos un pequeño retraso antes de redirigir para asegurar que el toast se muestre
      setTimeout(() => {
        router.push(`/ventas/${venta.id}`)
      }, 1000)
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al completar la venta",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!venta) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Venta no encontrada</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Completar venta #${venta.id}`}
          description="Ingresa el número de seguimiento para completar la venta"
        />
        <Button variant="outline" onClick={() => router.push(`/ventas/${params.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <Separator />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroSeguimiento">Número de seguimiento</Label>
              <Input
                id="numeroSeguimiento"
                value={numeroSeguimiento}
                onChange={(e) => setNumeroSeguimiento(e.target.value)}
                placeholder="Ingresa el número de seguimiento"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
            <CheckCircle className="mr-2 h-4 w-4" />
            {isSaving ? "Procesando..." : "Confirmar y completar venta"}
          </Button>
        </div>
      </form>
    </>
  )
}

