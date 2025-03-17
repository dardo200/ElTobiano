"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Proveedor } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export const columns: ColumnDef<Proveedor>[] = [
  {
    accessorKey: "id",
    header: "ID",
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
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => <div>{row.getValue("telefono") || "-"}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("direccion") || "-"}</div>,
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const router = useRouter()
      const proveedor = row.original

      const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
          try {
            const response = await fetch(`/api/proveedores/${id}`, {
              method: "DELETE",
            })

            if (response.ok) {
              toast.success("Proveedor eliminado correctamente")
              router.refresh()
            } else {
              toast.error("Error al eliminar el proveedor")
            }
          } catch (error) {
            console.error("Error al eliminar el proveedor:", error)
            toast.error("Error al eliminar el proveedor")
          }
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/proveedores/${proveedor.id}`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(proveedor.id)}>
            <Trash className="h-4 w-4" />
            <span className="ml-2">Eliminar</span>
          </Button>
        </div>
      )
    },
  },
]

