"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Trash, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Cliente } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export const columns: ColumnDef<Cliente>[] = [
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => <div>{row.getValue("telefono") || "-"}</div>,
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("direccion") || "-"}</div>,
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row, table }) => {
      const router = useRouter()
      const cliente = row.original
      const deleteRow = table.options.meta?.deleteRow

      const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
          try {
            if (deleteRow) {
              const success = await deleteRow(id)
              if (success) {
                toast.success("Cliente eliminado correctamente")
              } else {
                toast.error("Error al eliminar el cliente")
              }
            }
          } catch (error) {
            console.error("Error al eliminar el cliente:", error)
            toast.error("Error al eliminar el cliente")
          }
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/clientes/${cliente.id}`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/clientes/${cliente.id}/historial`)}>
            <History className="h-4 w-4" />
            <span className="ml-2">Historial</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(cliente.id)}>
            <Trash className="h-4 w-4" />
            <span className="ml-2">Eliminar</span>
          </Button>
        </div>
      )
    },
  },
]

