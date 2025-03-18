"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import type { Proveedor } from "@/types"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function ProveedoresPage() {
  const router = useRouter()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProveedores = useCallback(async () => {
    try {
      const response = await fetch("/api/proveedores")
      if (response.ok) {
        const data = await response.json()
        setProveedores(data)
      } else {
        console.error("Error al obtener proveedores")
        toast.error("No se pudieron cargar los proveedores")
      }
    } catch (error) {
      console.error("Error al obtener proveedores:", error)
      toast.error("Error al cargar los proveedores")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

  // Función para eliminar un proveedor y actualizar la lista
  const handleDeleteProveedor = async (id: number) => {
    try {
      const response = await fetch(`/api/proveedores/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Actualizar el estado local eliminando el proveedor
        setProveedores((prevProveedores) => prevProveedores.filter((proveedor) => proveedor.id !== id))
        return true
      }
      return false
    } catch (error) {
      console.error("Error al eliminar el proveedor:", error)
      return false
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Proveedores (${proveedores.length})`} description="Gestiona los proveedores de tu negocio" />
        <Button onClick={() => router.push("/proveedores/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>
      <Separator className="my-4" />
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={proveedores}
          searchKey="nombre"
          searchPlaceholder="Buscar proveedores..."
          deleteRow={handleDeleteProveedor}
        />
      )}
    </>
  )
}

