"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { EditarCompraForm } from "./components/editar-compra-form"
import type { Compra, Proveedor } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function EditarCompraPage() {
  const params = useParams()
  const router = useRouter()
  const [compra, setCompra] = useState<Compra | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener la compra
        const compraResponse = await fetch(`/api/compras/detalles?id=${params.id}`)
        if (!compraResponse.ok) {
          throw new Error("Error al cargar la compra")
        }
        const compraData = await compraResponse.json()
        setCompra(compraData)

        // Obtener proveedores
        const proveedoresResponse = await fetch("/api/proveedores")
        if (proveedoresResponse.ok) {
          const proveedoresData = await proveedoresResponse.json()
          setProveedores(proveedoresData)
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)
        toast.error("Error al cargar los datos de la compra")
        router.push("/compras")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  if (isLoading) {
    return (
      <>
        <Heading title="Editar Compra" description="Modifica los detalles de la compra" />
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

  if (!compra) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Compra no encontrada</p>
      </div>
    )
  }

  return (
    <>
      <Heading title={`Editar Compra #${compra.id}`} description="Modifica los detalles de la compra" />
      <Separator className="my-4" />
      <EditarCompraForm compra={compra} proveedores={proveedores} />
    </>
  )
}

