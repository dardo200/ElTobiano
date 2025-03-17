"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { NuevaCompraForm } from "./components/nueva-compra-form"
import type { Producto } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function NuevaCompraPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("/api/productos")
        if (response.ok) {
          const data = await response.json()
          setProductos(data)
        } else {
          console.error("Error al obtener productos")
        }
      } catch (error) {
        console.error("Error al obtener productos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductos()
  }, [])

  if (isLoading) {
    return (
      <>
        <Heading title="Nueva Compra" description="Registra una nueva compra a proveedor" />
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

  return (
    <>
      <Heading title="Nueva Compra" description="Registra una nueva compra a proveedor" />
      <Separator className="my-4" />
      <NuevaCompraForm productos={productos} />
    </>
  )
}

