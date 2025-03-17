"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Combo } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function VerComboPage() {
  const params = useParams()
  const router = useRouter()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        const response = await fetch(`/api/combos/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCombo(data)
        } else {
          console.error("Error al obtener el combo")
          router.push("/combos")
        }
      } catch (error) {
        console.error("Error al obtener el combo:", error)
        router.push("/combos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCombo()
  }, [params.id, router])

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <Heading title="Detalle de Combo" description="Información detallada del combo" />
          <Button variant="outline" onClick={() => router.push("/combos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

  if (!combo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Combo no encontrado</p>
      </div>
    )
  }

  // Calcular el precio total de los productos individuales
  const precioIndividual =
    combo.detalles?.reduce((total, detalle) => {
      const precioProducto = detalle.producto?.precio || 0
      return total + precioProducto * detalle.cantidad
    }, 0) || 0

  // Calcular el ahorro
  const ahorro = precioIndividual - combo.precio_venta
  const porcentajeAhorro = precioIndividual > 0 ? (ahorro / precioIndividual) * 100 : 0

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Combo: ${combo.nombre}`} description="Información detallada del combo" />
        <Button variant="outline" onClick={() => router.push("/combos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Combo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                <p className="text-lg">{combo.nombre}</p>
              </div>
              {combo.descripcion && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descripción</h3>
                  <p className="text-lg">{combo.descripcion}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Precio de Venta</h3>
                <p className="text-lg">${combo.precio_venta.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Precio Individual</h3>
                <p className="text-lg">${precioIndividual.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Ahorro</h3>
                <p className="text-lg text-green-600">
                  ${ahorro.toFixed(2)} ({porcentajeAhorro.toFixed(2)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Incluidos</CardTitle>
          </CardHeader>
          <CardContent>
            {combo.detalles && combo.detalles.length > 0 ? (
              <div className="space-y-4">
                {combo.detalles.map((detalle) => (
                  <div key={detalle.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{detalle.producto?.nombre || `Producto #${detalle.id_producto}`}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {detalle.cantidad}</p>
                    </div>
                    <div className="text-right">
                      <p>${(detalle.producto?.precio || 0).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Total: ${((detalle.producto?.precio || 0) * detalle.cantidad).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay productos en este combo</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

