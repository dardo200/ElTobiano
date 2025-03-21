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
    header: () => <div className="text-center">ID</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <div className="text-left">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-left">{row.getValue("nombre")}</div>,
  },
  {
    accessorKey: "telefono",
    header: () => <div className="text-left">Teléfono</div>,
    cell: ({ row }) => <div className="text-left">{row.getValue("telefono") || "-"}</div>,
  },
  {
    accessorKey: "email",
    header: () => <div className="text-left">Email</div>,
    cell: ({ row }) => <div className="text-left">{row.getValue("email") || "-"}</div>,
  },
  {
    accessorKey: "envio",
    header: () => <div className="text-right">Precio de Envío</div>,
    cell: ({ row }) => {
      const envio = Number.parseFloat(row.getValue("envio") || "0")
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(envio)
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: "direccion",
    header: () => <div className="text-left">Dirección</div>,
    cell: ({ row }) => <div className="text-left max-w-[200px] truncate">{row.getValue("direccion") || "-"}</div>,
  },
  {
    id: "acciones",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row, table }) => {
      const router = useRouter()
      const proveedor = row.original
      const deleteRow = table.options.meta?.deleteRow

      const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
          try {
            if (deleteRow) {
              const success = await deleteRow(id)
              if (success) {
                toast.success("Proveedor eliminado correctamente")
              } else {
                toast.error("Error al eliminar el proveedor")
              }
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

