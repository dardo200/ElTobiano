"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import type { Producto } from "@/types"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

export default function ProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("/api/productos")
        if (response.ok) {
          const data = await response.json()
          setProductos(data)
          setFilteredProductos(data)
        } else {
          console.error("Error al obtener productos")
          toast.error("No se pudieron cargar los productos")
        }
      } catch (error) {
        console.error("Error al obtener productos:", error)
        toast.error("Error al cargar los productos")
      } finally {
        // Siempre terminamos la carga, incluso si hay un error
        setIsLoading(false)
      }
    }

    // Establecer un timeout para mostrar el estado de carga por al menos 500ms
    // para evitar parpadeos en conexiones rápidas
    const minLoadingTime = 500
    const startTime = Date.now()

    fetchProductos().then(() => {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < minLoadingTime) {
        setTimeout(() => {
          setIsLoading(false)
        }, minLoadingTime - elapsedTime)
      }
    })
  }, [])

  // Función para filtrar productos por nombre o código
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProductos(productos)
      return
    }

    const filtered = productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredProductos(filtered)
  }, [searchTerm, productos])

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Productos (${isLoading ? "..." : productos.length})`}
          description="Gestiona tu catálogo de productos"
        />
        <Button onClick={() => router.push("/productos/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
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
        <>
          <div className="flex items-center py-4">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DataTable columns={columns} data={filteredProductos} />
        </>
      )}
    </>
  )
}

