"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Compra } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function DetalleCompraPage() {
  const params = useParams()
  const router = useRouter()
  const [compra, setCompra] = useState<Compra | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompra = async () => {
      try {
        // Use the new API endpoint with query parameters
        const response = await fetch(`/api/compras/detalles?id=${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCompra(data)
        } else {
          console.error("Error al obtener la compra")
          router.push("/compras")
        }
      } catch (error) {
        console.error("Error al obtener la compra:", error)
        router.push("/compras")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompra()
  }, [params.id, router])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <Heading title="Detalle de Compra" description="Información detallada de la compra" />
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/compras")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!compra) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Compra no encontrada</p>
      </div>
    )
  }

  // Lista de proveedores (simulada)
  const proveedores = [
    { id: 1, nombre: "Proveedor 1" },
    { id: 2, nombre: "Proveedor 2" },
    { id: 3, nombre: "Proveedor 3" },
  ]

  const proveedor = proveedores.find((p) => p.id === compra.id_proveedor)

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Compra #${compra.id}`}
          description={`Detalles de la compra realizada el ${new Date(compra.fecha).toLocaleDateString()}`}
        />
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/compras")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{new Date(compra.fecha).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Proveedor:</span>
                <span>{proveedor?.nombre || `Proveedor #${compra.id_proveedor}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>${compra.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Cantidad de productos:</span>
                <span>{compra.detalles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${compra.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${compra.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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
                {compra.detalles?.map((detalle, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{detalle.producto?.nombre || `Producto #${detalle.id_producto}`}</td>
                    <td className="py-2 text-right">${detalle.precio.toFixed(2)}</td>
                    <td className="py-2 text-right">{detalle.cantidad}</td>
                    <td className="py-2 text-right">${(detalle.precio * detalle.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-bold">
                    Total:
                  </td>
                  <td className="py-2 text-right font-bold">${compra.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

