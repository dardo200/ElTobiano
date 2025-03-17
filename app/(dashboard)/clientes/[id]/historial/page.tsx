"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Cliente } from "@/types"

export default function HistorialClientePage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener cliente
        const clienteResponse = await fetch(`/api/clientes/${params.id}`)
        if (!clienteResponse.ok) {
          router.push("/clientes")
          return
        }
        const clienteData = await clienteResponse.json()
        setCliente(clienteData)

        // Obtener historial
        const historialResponse = await fetch(`/api/clientes/${params.id}/historial`)
        if (historialResponse.ok) {
          const historialData = await historialResponse.json()
          setHistorial(historialData)
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Historial de Compras: ${cliente?.nombre}`}
          description="Historial de compras realizadas por el cliente"
        />
        <Button variant="outline" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <Separator />

      {historial.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Este cliente no tiene compras registradas</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-4">
          {historial.map((venta) => (
            <Card
              key={venta.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/ventas/${venta.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Venta #{venta.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Fecha</p>
                    <p className="text-sm">{new Date(venta.fecha).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-sm">${venta.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <p className="text-sm">{venta.estado}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Productos</p>
                    <p className="text-sm">{venta.cantidad_productos} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

