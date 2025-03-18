"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
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
import { useState } from "react"
import type { Producto } from "@/types"

export const columns: ColumnDef<Producto>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ row }) => <div className="font-mono">{row.getValue("codigo") || "N/A"}</div>,
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => {
      const descripcion = row.getValue("descripcion") as string
      return <div className="truncate max-w-[300px]">{descripcion || "Sin descripción"}</div>
    },
  },
  {
    accessorKey: "precio",
    header: () => <div className="text-right">Precio Venta</div>,
    cell: ({ row }) => {
      const precio = Number.parseFloat(row.getValue("precio"))
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(precio)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "precio_compra",
    header: () => <div className="text-right">Precio Compra</div>,
    cell: ({ row }) => {
      const precio_compra = Number.parseFloat(row.getValue("precio_compra") || 0)
      const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(precio_compra)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "stock",
    header: () => <div className="text-center">Stock</div>,
    cell: ({ row }) => {
      const stock = Number.parseInt(row.getValue("stock") || "0")

      // Determinar el color según el nivel de stock
      let badgeVariant = "default"
      if (stock <= 0) {
        badgeVariant = "destructive" // Rojo para stock 0
      } else if (stock < 4) {
        badgeVariant = "warning" // Amarillo para stock bajo (1-3)
      } else {
        badgeVariant = "success" // Verde para stock suficiente (4+)
      }

      // Determinar el texto según el nivel de stock
      let stockText = `${stock} unidades`
      if (stock === 0) {
        stockText = "Sin stock"
      } else if (stock < 4) {
        stockText = `Bajo: ${stock}`
      }

      return (
        <div className="text-center">
          <Badge variant={badgeVariant}>{stockText}</Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const router = useRouter()
      const producto = row.original
      const [isDeleting, setIsDeleting] = useState(false)
      const deleteRow = table.options.meta?.deleteRow

      const handleDelete = async () => {
        setIsDeleting(true)
        try {
          if (deleteRow) {
            const success = await deleteRow(producto.id)
            if (success) {
              toast.success("Producto eliminado correctamente")
            } else {
              toast.error("Error al eliminar el producto")
            }
          }
        } catch (error) {
          console.error("Error al eliminar el producto:", error)
          toast.error("Error al eliminar el producto")
        } finally {
          setIsDeleting(false)
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/productos/${producto.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el producto{" "}
                    <span className="font-bold">{producto.nombre}</span> y lo quitará del sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

