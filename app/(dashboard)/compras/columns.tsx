"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Compra } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const columns: ColumnDef<Compra>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "proveedor.nombre",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Proveedor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const proveedorNombre = row.original.proveedor?.nombre || `Proveedor #${row.original.id_proveedor}`
      return <div>{proveedorNombre}</div>
    },
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Fecha
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const fecha = row.getValue("fecha")
      const formatted = fecha ? new Date(fecha as string).toLocaleDateString() : "-"
      return <div>{formatted}</div>
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const total = Number.parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(total)

      return <div>{formatted}</div>
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const router = useRouter()
      const compra = row.original

      const handleDelete = async (id: number) => {
        try {
          const response = await fetch(`/api/compras/${id}`, {
            method: "DELETE",
          })

          if (response.ok) {
            toast.success("Compra eliminada correctamente")
            window.location.reload()
          } else {
            toast.error("Error al eliminar la compra")
          }
        } catch (error) {
          console.error("Error al eliminar la compra:", error)
          toast.error("Error al eliminar la compra")
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/compras/${compra.id}`)}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Ver</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => router.push(`/compras/${compra.id}/editar`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4" />
                <span className="ml-2">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Está seguro que desea eliminar esta compra? Esta acción no se puede deshacer y afectará al stock de
                  productos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(compra.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    },
  },
]

