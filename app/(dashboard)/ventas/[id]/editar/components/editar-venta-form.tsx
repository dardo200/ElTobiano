"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProductoSelector } from "@/components/ventas/producto-selector"
import { ComboSelector } from "@/components/ventas/combo-selector"
import { DetalleVentaItem } from "@/components/ventas/detalle-venta-item"
import { useVentaForm } from "@/hooks/use-venta-form"
import { toast } from "@/components/ui/use-toast"
import type { Venta, Cliente, Producto, Combo } from "@/types"

const formSchema = z.object({
  id_cliente: z.string().optional(),
  estado: z.string().min(1, "El estado es requerido"),
})

type VentaFormValues = z.infer<typeof formSchema>

interface EditarVentaFormProps {
  venta: Venta
  clientes: Cliente[]
  productos: Producto[]
  combos: Combo[]
}

export const EditarVentaForm: React.FC<EditarVentaFormProps> = ({ venta, clientes, productos, combos }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [showAddComboDialog, setShowAddComboDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [detalleToDelete, setDetalleToDelete] = useState<number | null>(null)

  // Usar nuestro hook personalizado para la lógica del formulario
  const {
    detalles,
    total,
    isMayorista,
    comboDetalles,
    handleAddProducto,
    handleAddCombo,
    handleUpdateCantidad,
    handleDeleteDetalle,
    handleMayoristaChange,
  } = useVentaForm({
    clientes,
    productos,
    combos,
    initialDetalles:
      venta.detalles?.map((detalle) => ({
        ...detalle,
        es_mayorista: detalle.es_mayorista || false,
      })) || [],
    ventaId: venta.id,
  })

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cliente: venta.id_cliente ? venta.id_cliente.toString() : undefined,
      estado: venta.estado,
    },
  })

  const onSubmit = async (data: VentaFormValues) => {
    setIsLoading(true)
    try {
      console.log("Submitting form with venta ID:", venta.id)

      // Primero, actualizar los datos básicos de la venta
      const updateResponse = await fetch(`/api/ventas/${venta.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_cliente: data.id_cliente ? Number.parseInt(data.id_cliente) : null,
          estado: data.estado,
          total: total,
        }),
      })

      if (!updateResponse.ok) {
        let errorMessage = "Error al actualizar la venta"
        try {
          const errorData = await updateResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        throw new Error(errorMessage)
      }

      console.log("Basic venta data updated, now updating details. Detalles count:", detalles.length)

      // Asegurarse de que los datos_combo_modificado se preserven
      const detallesParaEnviar = detalles.map((detalle) => {
        // Caso 1: Si el detalle es un combo marcado como modificado
        if (detalle.es_combo && detalle.combo_modificado) {
          // Buscar el detalle original si existe
          const detalleOriginal = venta.detalles?.find(
            (d) => d.id === detalle.id && d.id_producto === detalle.id_producto && d.es_combo,
          )

          // Si encontramos el detalle original y tiene datos_combo_modificado, usarlos
          if (detalleOriginal && detalleOriginal.datos_combo_modificado) {
            console.log("Preservando datos de combo modificado para detalle:", detalle.id)
            return {
              ...detalle,
              datos_combo_modificado: detalleOriginal.datos_combo_modificado,
            }
          }

          // Si no encontramos datos pero el combo está marcado como modificado,
          // intentar reconstruir los datos desde comboDetalles
          if (comboDetalles[detalle.id_producto]) {
            console.log("Reconstruyendo datos de combo modificado desde comboDetalles")
            const items = comboDetalles[detalle.id_producto].map((item) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
            }))

            return {
              ...detalle,
              datos_combo_modificado: JSON.stringify(items),
            }
          }
        }

        // Caso 2: Si el detalle original tenía datos_combo_modificado, asegurarse de incluirlo
        const detalleOriginal = venta.detalles?.find(
          (d) => d.id === detalle.id && d.id_producto === detalle.id_producto,
        )

        if (detalleOriginal && detalleOriginal.datos_combo_modificado) {
          console.log("Preservando datos de combo modificado del detalle original:", detalleOriginal.id)
          return {
            ...detalle,
            datos_combo_modificado: detalleOriginal.datos_combo_modificado,
            combo_modificado: true,
          }
        }

        return detalle
      })

      console.log("Detalles preparados para enviar:", detallesParaEnviar)

      // Luego, actualizar los detalles de la venta
      const detallesUrl = `/api/ventas/detalles?id=${venta.id}`
      console.log("Calling API endpoint:", detallesUrl)

      const detallesResponse = await fetch(detallesUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detallesParaEnviar),
      })

      console.log("API response status:", detallesResponse.status)

      if (!detallesResponse.ok) {
        let errorMessage = "Error al actualizar los detalles de la venta"
        try {
          const errorData = await detallesResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Error parsing error response:", e)
          // If we can't parse the JSON, use the status text
          errorMessage = `Error ${detallesResponse.status}: ${detallesResponse.statusText}`
        }
        throw new Error(errorMessage)
      }

      toast.success("Venta actualizada correctamente")
      router.push("/ventas")
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar la venta:", error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar la venta")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteDetalle = () => {
    if (detalleToDelete === null) return
    handleDeleteDetalle(detalleToDelete)
    setShowDeleteAlert(false)
    setDetalleToDelete(null)
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="id_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Sin cliente</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Para embalar">Para embalar</SelectItem>
                      <SelectItem value="Despachado">Despachado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Detalles de la venta</h3>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddProductDialog(true)
                    handleMayoristaChange(false) // Reset mayorista state when opening dialog
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Producto
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddComboDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Combo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {detalles.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No hay productos en esta venta</p>
              ) : (
                detalles.map((detalle) => (
                  <DetalleVentaItem
                    key={detalle.id}
                    detalle={detalle}
                    comboDetalles={comboDetalles[detalle.id_producto]}
                    onUpdateCantidad={handleUpdateCantidad}
                    onDelete={(id) => {
                      setDetalleToDelete(id)
                      setShowDeleteAlert(true)
                    }}
                  />
                ))
              )}
            </div>
            <div className="flex justify-between mt-4 pt-2 border-t">
              <p className="font-bold">Total:</p>
              <p className="font-bold">${total.toFixed(2)}</p>
            </div>
          </div>

          <Separator />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/ventas")}
              className="mr-2"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || detalles.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </Form>

      {/* Diálogo para agregar producto */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-md">
          <ProductoSelector
            productos={productos}
            onSelect={(producto, cantidad, esMayorista) => {
              handleAddProducto(producto, cantidad, esMayorista)
              setShowAddProductDialog(false)
            }}
            onCancel={() => setShowAddProductDialog(false)}
            initialMayorista={isMayorista}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar combo */}
      <Dialog open={showAddComboDialog} onOpenChange={setShowAddComboDialog}>
        <DialogContent className="sm:max-w-md">
          <ComboSelector
            combos={combos}
            onSelect={(combo, cantidad) => {
              handleAddCombo(combo, cantidad)
              setShowAddComboDialog(false)
            }}
            onCancel={() => setShowAddComboDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Alerta de confirmación para eliminar */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el producto de la venta y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDetalle}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

