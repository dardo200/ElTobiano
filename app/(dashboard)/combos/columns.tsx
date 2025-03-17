"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Combo } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export const columns: ColumnDef<Combo>[] = [
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
  // Eliminar o comentar la columna ID original
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
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
    accessorKey: "precio_venta",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Precio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const precio = Number.parseFloat(row.getValue("precio_venta"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(precio)

      return <div>{formatted}</div>
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const router = useRouter()
      const combo = row.original

      const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este combo?")) {
          try {
            const response = await fetch(`/api/combos/${id}`, {
              method: "DELETE",
            })

            if (response.ok) {
              toast.success("Combo eliminado correctamente")
              router.refresh()
              // Force a full page refresh to ensure data updates
              window.location.reload()
            } else {
              toast.error("Error al eliminar el combo")
            }
          } catch (error) {
            console.error("Error al eliminar el combo:", error)
            toast.error("Error al eliminar el combo")
          }
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/combos/${combo.id}`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/combos/${combo.id}/ver`)}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Ver</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(combo.id)}>
            <Trash className="h-4 w-4" />
            <span className="ml-2">Eliminar</span>
          </Button>
        </div>
      )
    },
  },
]

