"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
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
import { Label } from "@/components/ui/label"

export default function ProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchProveedorTerm, setSearchProveedorTerm] = useState("")

  const fetchProductos = useCallback(async () => {
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
  }, [])

  useEffect(() => {
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
  }, [fetchProductos])

  // Función para filtrar productos por nombre, código y código de proveedor
  useEffect(() => {
    let filtered = [...productos]

    // Filtrar por nombre o código
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filtrar por código de proveedor
    if (searchProveedorTerm.trim()) {
      filtered = filtered.filter(
        (producto) =>
          producto.codigo_proveedor &&
          producto.codigo_proveedor.toLowerCase().includes(searchProveedorTerm.toLowerCase()),
      )
    }

    setFilteredProductos(filtered)
  }, [searchTerm, searchProveedorTerm, productos])

  // Función para eliminar un producto y actualizar la lista
  const handleDeleteProducto = async (id: number) => {
    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Actualizar el estado local eliminando el producto
        setProductos((prevProductos) => prevProductos.filter((producto) => producto.id !== id))
        setFilteredProductos((prevProductos) => prevProductos.filter((producto) => producto.id !== id))
        return true
      }
      return false
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      return false
    }
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="search" className="mb-2 block">
                Buscar por nombre o código
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="searchProveedor" className="mb-2 block">
                Buscar por código de proveedor
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchProveedor"
                  placeholder="Buscar por código de proveedor..."
                  value={searchProveedorTerm}
                  onChange={(e) => setSearchProveedorTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredProductos}
            deleteRow={handleDeleteProducto}
            initialState={{
              sorting: [
                {
                  id: "nombre",
                  desc: false,
                },
              ],
            }}
          />
        </>
      )}
    </>
  )
}

