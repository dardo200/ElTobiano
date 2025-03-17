"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Producto } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export const columns: ColumnDef<Producto>[] = [
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Código
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("codigo") || "-"}</div>,
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue("descripcion") || "-"}</div>,
  },
  {
    accessorKey: "precio",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Precio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const precio = Number.parseFloat(row.getValue("precio"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(precio)

      return <div>{formatted}</div>
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = Number.parseInt(row.getValue("stock") || "0")

      return <Badge variant={stock > 0 ? "outline" : "destructive"}>{stock}</Badge>
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const router = useRouter()
      const producto = row.original

      const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
          try {
            const response = await fetch(`/api/productos/${id}`, {
              method: "DELETE",
            })

            if (response.ok) {
              toast.success("Producto eliminado correctamente")
              router.refresh()
            } else {
              toast.error("Error al eliminar el producto")
            }
          } catch (error) {
            console.error("Error al eliminar el producto:", error)
            toast.error("Error al eliminar el producto")
          }
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/productos/${producto.id}`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(producto.id)}>
            <Trash className="h-4 w-4" />
            <span className="ml-2">Eliminar</span>
          </Button>
        </div>
      )
    },
  },
]

