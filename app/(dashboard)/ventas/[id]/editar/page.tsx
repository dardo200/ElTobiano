"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { EditarVentaForm } from "./components/editar-venta-form"
import type { Venta, Cliente, Producto, Combo } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function EditarVentaPage() {
  const params = useParams()
  const router = useRouter()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener la venta
        const ventaResponse = await fetch(`/api/ventas/${params.id}`)
        if (!ventaResponse.ok) {
          throw new Error("Error al cargar la venta")
        }
        const ventaData = await ventaResponse.json()
        setVenta(ventaData)

        // Obtener clientes
        const clientesResponse = await fetch("/api/clientes")
        if (clientesResponse.ok) {
          const clientesData = await clientesResponse.json()
          setClientes(clientesData)
        }

        // Obtener productos
        const productosResponse = await fetch("/api/productos")
        if (productosResponse.ok) {
          const productosData = await productosResponse.json()
          setProductos(productosData)
        }

        // Obtener combos
        const combosResponse = await fetch("/api/combos")
        if (combosResponse.ok) {
          const combosData = await combosResponse.json()
          setCombos(combosData)
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)
        toast.error("Error al cargar los datos de la venta")
        router.push("/ventas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  if (isLoading) {
    return (
      <>
        <Heading title="Editar Venta" description="Modifica los detalles de la venta" />
        <Separator className="my-4" />
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
      </>
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
      <Heading title={`Editar Venta #${venta.id}`} description="Modifica los detalles de la venta" />
      <Separator className="my-4" />
      <EditarVentaForm venta={venta} clientes={clientes} productos={productos} combos={combos} />
    </>
  )
}

