"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit, Truck, Package, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Venta } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"
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

export const columns: ColumnDef<Venta>[] = [
  {
    accessorKey: "id",
    header: () => <div className="text-left">ID</div>,
  },
  {
    accessorKey: "cliente.nombre",
    header: ({ column }) => (
      <div className="text-left">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      // Acceder directamente a los datos originales para evitar problemas con la estructura anidada
      const clienteNombre = row.original.cliente?.nombre || "Cliente no registrado"
      return <div>{clienteNombre}</div>
    },
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <div className="text-left">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
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
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const total = Number.parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(total)

      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <div className="text-center">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string

      let variant: "default" | "outline" | "secondary" | "destructive" | "success" = "default"

      switch (estado) {
        case "Pendiente":
          variant = "destructive"
          break
        case "Para embalar":
          variant = "secondary"
          break
        case "Despachado":
          variant = "success"
          break
        case "Completado":
          variant = "outline"
          break
      }

      return (
        <div className="text-center">
          <Badge variant={variant}>{estado}</Badge>
        </div>
      )
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => {
      const router = useRouter()
      const venta = row.original
      const [isDeleting, setIsDeleting] = useState(false)

      const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
        try {
          const response = await fetch(`/api/ventas/${id}/estado`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: nuevoEstado }),
          })

          if (response.ok) {
            toast.success(`Estado actualizado a: ${nuevoEstado}`)
            // Forzar una actualización completa de la página
            window.location.reload()
          } else {
            const errorData = await response.json()
            toast.error(errorData.error || "Error al cambiar el estado de la venta")
          }
        } catch (error) {
          console.error("Error al cambiar el estado de la venta:", error)
          toast.error("Error al cambiar el estado de la venta")
        }
      }

      const handleEliminarVenta = async (id: number) => {
        setIsDeleting(true)
        try {
          const response = await fetch(`/api/ventas/${id}`, {
            method: "DELETE",
          })

          if (response.ok) {
            toast.success("Venta eliminada correctamente")
            // Forzar una actualización completa de la página
            window.location.reload()
          } else {
            const errorData = await response.json()
            toast.error(errorData.error || "Error al eliminar la venta")
          }
        } catch (error) {
          console.error("Error al eliminar la venta:", error)
          toast.error("Error al eliminar la venta")
        } finally {
          setIsDeleting(false)
        }
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/ventas/${venta.id}`)}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Ver</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => router.push(`/ventas/${venta.id}/editar`)}>
            <Edit className="h-4 w-4" />
            <span className="ml-2">Editar</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la venta y devolverá el stock a los productos. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleEliminarVenta(venta.id)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {venta.estado === "Pendiente" && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/ventas/${venta.id}/embalar`)}>
              <Package className="h-4 w-4" />
              <span className="ml-2">Para embalar</span>
            </Button>
          )}

          {venta.estado === "Para embalar" && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/ventas/${venta.id}/despachar`)}>
              <Truck className="h-4 w-4" />
              <span className="ml-2">Despachar</span>
            </Button>
          )}

          {venta.estado === "Despachado" && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/ventas/${venta.id}/completar`)}>
              <CheckCircle className="h-4 w-4" />
              <span className="ml-2">Completar</span>
            </Button>
          )}
        </div>
      )
    },
  },
]

