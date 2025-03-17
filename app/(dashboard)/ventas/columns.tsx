"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Edit, Truck, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Venta } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export const columns: ColumnDef<Venta>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "cliente_nombre", // Cambiado a "cliente_nombre"
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
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
    accessorKey: "estado",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
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
      }

      return <Badge variant={variant}>{estado}</Badge>
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const router = useRouter()
      const venta = row.original

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
            toast.error("Error al cambiar el estado de la venta")
          }
        } catch (error) {
          console.error("Error al cambiar el estado de la venta:", error)
          toast.error("Error al cambiar el estado de la venta")
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

          {venta.estado === "Pendiente" && (
            <Button variant="outline" size="sm" onClick={() => handleCambiarEstado(venta.id, "Para embalar")}>
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
        </div>
      )
    },
  },
]

