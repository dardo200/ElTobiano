"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import type { Compra } from "@/types"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ComprasPage() {
  const router = useRouter()
  const [compras, setCompras] = useState<Compra[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const response = await fetch("/api/compras")
        if (response.ok) {
          const data = await response.json()
          setCompras(data)
        } else {
          console.error("Error al obtener compras")
        }
      } catch (error) {
        console.error("Error al obtener compras:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompras()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Compras (${compras.length})`} description="Gestiona las compras a proveedores" />
        <Button onClick={() => router.push("/compras/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Compra
        </Button>
      </div>
      <Separator className="my-4" />

      {isLoading ? (
        <div className="space-y-4">
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
      ) : (
        <DataTable
          columns={columns}
          data={compras}
          searchKey="proveedor_nombre"
          searchPlaceholder="Buscar por proveedor..."
        />
      )}
    </>
  )
}

