"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, Truck } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Venta } from "@/types"

export default function DetalleVentaPage() {
  const params = useParams()
  const router = useRouter()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const response = await fetch(`/api/ventas/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setVenta(data)
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
  }, [params.id, router])

  const handlePrint = () => {
    window.print()
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
          title={`Venta #${venta.id}`}
          description={`Detalles de la venta realizada el ${new Date(venta.fecha).toLocaleDateString()}`}
        />
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/ventas")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{new Date(venta.fecha).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <Badge
                  variant={
                    venta.estado === "Pendiente"
                      ? "destructive"
                      : venta.estado === "Para embalar"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {venta.estado}
                </Badge>
              </div>
              {venta.estado === "Para embalar" && (
                <div className="pt-2">
                  <Button className="w-full" onClick={() => router.push(`/ventas/${venta.id}/despachar`)}>
                    <Truck className="mr-2 h-4 w-4" />
                    Despachar Venta
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {venta.cliente ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Nombre:</span>
                  <span>{venta.cliente.nombre}</span>
                </div>
                {venta.cliente.email && (
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{venta.cliente.email}</span>
                  </div>
                )}
                {venta.cliente.telefono && (
                  <div className="flex justify-between">
                    <span className="font-medium">Teléfono:</span>
                    <span>{venta.cliente.telefono}</span>
                  </div>
                )}
                {venta.cliente.direccion && (
                  <div className="flex justify-between">
                    <span className="font-medium">Dirección:</span>
                    <span>{venta.cliente.direccion}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Cliente no registrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Cantidad de productos:</span>
                <span>{venta.detalles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detalle de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Producto</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2 text-right">Cantidad</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles?.map((detalle) => {
                  // Asegurarse de que el precio no sea null antes de usar toFixed
                  const precio = detalle.precio || 0
                  const cantidad = detalle.cantidad || 0
                  const subtotal = precio * cantidad

                  return (
                    <tr key={detalle.id} className="border-b">
                      <td className="py-2">
                        {detalle.es_combo ? <span className="font-medium">[Combo] </span> : null}
                        {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                      </td>
                      <td className="py-2 text-right">${precio.toFixed(2)}</td>
                      <td className="py-2 text-right">{cantidad}</td>
                      <td className="py-2 text-right">${subtotal.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-bold">
                    Total:
                  </td>
                  <td className="py-2 text-right font-bold">${venta.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

