"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Producto } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { eliminarProducto } from "@/lib/producto-service"
import { toast } from "sonner"

interface ProductosTableProps {
  productos: Producto[]
}

export function ProductosTable({ productos }: ProductosTableProps) {
  const router = useRouter()
  const [nombreFilter, setNombreFilter] = useState("")
  const [codigoFilter, setCodigoFilter] = useState("")
  const [codigoProveedorFilter, setCodigoProveedorFilter] = useState("")

  const handleDeleteProducto = async (id: number) => {
    try {
      const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este producto?")
      if (!confirmDelete) return false

      await eliminarProducto(id)
      toast.success("Producto eliminado correctamente")
      router.refresh()
      return true
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      toast.error("Error al eliminar el producto")
      return false
    }
  }

  // Filtrar productos basado en los tres criterios
  const filteredProductos = productos.filter((producto) => {
    const nombreMatch = producto.nombre.toLowerCase().includes(nombreFilter.toLowerCase())
    const codigoMatch = producto.codigo.toLowerCase().includes(codigoFilter.toLowerCase())
    const codigoProveedorMatch = producto.codigo_proveedor
      ? producto.codigo_proveedor.toLowerCase().includes(codigoProveedorFilter.toLowerCase())
      : codigoProveedorFilter === ""

    return nombreMatch && codigoMatch && codigoProveedorMatch
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="nombre-filter">Filtrar por nombre</Label>
          <Input
            id="nombre-filter"
            placeholder="Nombre del producto"
            value={nombreFilter}
            onChange={(e) => setNombreFilter(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="codigo-filter">Filtrar por código</Label>
          <Input
            id="codigo-filter"
            placeholder="Código del producto"
            value={codigoFilter}
            onChange={(e) => setCodigoFilter(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="codigo-proveedor-filter">Filtrar por código de proveedor</Label>
          <Input
            id="codigo-proveedor-filter"
            placeholder="Código de proveedor"
            value={codigoProveedorFilter}
            onChange={(e) => setCodigoProveedorFilter(e.target.value)}
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredProductos}
        deleteRow={handleDeleteProducto}
        hideSearchInput={true} // Agregar esta propiedad para ocultar el campo de búsqueda
      />
    </div>
  )
}

