"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
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
import type { Venta, Cliente, Producto, Combo, DetalleVenta } from "@/types"
import { toast } from "@/components/ui/use-toast"

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
  const [detalles, setDetalles] = useState<Array<DetalleVenta & { es_combo?: boolean }>>([])
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [showAddComboDialog, setShowAddComboDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([])
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [detalleToDelete, setDetalleToDelete] = useState<number | null>(null)
  const [total, setTotal] = useState(venta.total || 0)

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cliente: venta.id_cliente ? venta.id_cliente.toString() : undefined,
      estado: venta.estado,
    },
  })

  useEffect(() => {
    // Inicializar los detalles de la venta
    if (venta.detalles && venta.detalles.length > 0) {
      setDetalles(venta.detalles)
    }
  }, [venta])

  useEffect(() => {
    // Calcular el total de la venta
    const nuevoTotal = detalles.reduce((sum, detalle) => sum + detalle.precio * detalle.cantidad, 0)
    setTotal(nuevoTotal)
  }, [detalles])

  useEffect(() => {
    // Filtrar productos según el término de búsqueda
    if (searchTerm.trim() === "") {
      setFilteredProductos([])
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredProductos(filtered)
    }
  }, [searchTerm, productos])

  useEffect(() => {
    // Filtrar combos según el término de búsqueda
    if (searchTerm.trim() === "") {
      setFilteredCombos([])
    } else {
      const filtered = combos.filter(
        (combo) =>
          combo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (combo.codigo && combo.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredCombos(filtered)
    }
  }, [searchTerm, combos])

  const onSubmit = async (data: VentaFormValues) => {
    setIsLoading(true)
    try {
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
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || "Error al actualizar la venta")
      }

      // Luego, actualizar los detalles de la venta
      const detallesResponse = await fetch(`/api/ventas/${venta.id}/detalles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(detalles),
      })

      if (!detallesResponse.ok) {
        const errorData = await detallesResponse.json()
        throw new Error(errorData.error || "Error al actualizar los detalles de la venta")
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

  const handleAddProducto = () => {
    if (!selectedProducto) return

    // Verificar si el producto ya está en la lista
    const existingIndex = detalles.findIndex((d) => d.id_producto === selectedProducto.id && !d.es_combo)

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      const newDetalles = [...detalles]
      newDetalles[existingIndex].cantidad += cantidad
      setDetalles(newDetalles)
    } else {
      // Si no existe, agregar nuevo detalle
      setDetalles([
        ...detalles,
        {
          id: Date.now(), // ID temporal
          id_venta: venta.id,
          id_producto: selectedProducto.id,
          cantidad: cantidad,
          precio: selectedProducto.precio,
          es_combo: false,
          producto: selectedProducto,
        },
      ])
    }

    // Limpiar selección
    setSelectedProducto(null)
    setCantidad(1)
    setSearchTerm("")
    setShowAddProductDialog(false)
  }

  const handleAddCombo = () => {
    if (!selectedCombo) return

    // Verificar si el combo ya está en la lista
    const existingIndex = detalles.findIndex((d) => d.id_producto === selectedCombo.id && d.es_combo)

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      const newDetalles = [...detalles]
      newDetalles[existingIndex].cantidad += cantidad
      setDetalles(newDetalles)
    } else {
      // Si no existe, agregar nuevo detalle
      setDetalles([
        ...detalles,
        {
          id: Date.now(), // ID temporal
          id_venta: venta.id,
          id_producto: selectedCombo.id,
          cantidad: cantidad,
          precio: selectedCombo.precio,
          es_combo: true,
          producto: {
            id: selectedCombo.id,
            nombre: selectedCombo.nombre,
            precio: selectedCombo.precio,
            codigo: selectedCombo.codigo,
          },
        },
      ])
    }

    // Limpiar selección
    setSelectedCombo(null)
    setCantidad(1)
    setSearchTerm("")
    setShowAddComboDialog(false)
  }

  const handleDeleteDetalle = (id: number) => {
    setDetalleToDelete(id)
    setShowDeleteAlert(true)
  }

  const confirmDeleteDetalle = () => {
    if (detalleToDelete === null) return

    const newDetalles = detalles.filter((d) => d.id !== detalleToDelete)
    setDetalles(newDetalles)
    setShowDeleteAlert(false)
    setDetalleToDelete(null)
  }

  const handleUpdateCantidad = (id: number, newCantidad: number) => {
    if (newCantidad < 1) return

    const newDetalles = detalles.map((d) => (d.id === id ? { ...d, cantidad: newCantidad } : d))

    setDetalles(newDetalles)
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
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddProductDialog(true)}>
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
                  <div key={detalle.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {detalle.es_combo && (
                            <Badge variant="outline" className="mr-2">
                              Combo
                            </Badge>
                          )}
                          {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">Precio: ${detalle.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateCantidad(detalle.id, detalle.cantidad - 1)}
                          disabled={detalle.cantidad <= 1}
                        >
                          -
                        </Button>
                        <span className="w-10 text-center">{detalle.cantidad}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateCantidad(detalle.id, detalle.cantidad + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="font-bold w-20 text-right">${(detalle.cantidad * detalle.precio).toFixed(2)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteDetalle(detalle.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="button" size="sm" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredProductos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchTerm ? "No se encontraron productos" : "Ingrese un término de búsqueda"}
                </p>
              ) : (
                filteredProductos.map((producto) => (
                  <div
                    key={producto.id}
                    className={`p-2 cursor-pointer hover:bg-muted ${
                      selectedProducto?.id === producto.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedProducto(producto)}
                  >
                    <p className="font-medium">{producto.nombre}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Código: {producto.codigo || "N/A"}</span>
                      <span>Precio: ${producto.precio.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedProducto && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedProducto.nombre}</p>
                      <p className="text-sm text-muted-foreground">Precio: ${selectedProducto.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCantidad(cantidad + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddProducto} disabled={!selectedProducto}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para agregar combo */}
      <Dialog open={showAddComboDialog} onOpenChange={setShowAddComboDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Combo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="button" size="sm" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredCombos.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchTerm ? "No se encontraron combos" : "Ingrese un término de búsqueda"}
                </p>
              ) : (
                filteredCombos.map((combo) => (
                  <div
                    key={combo.id}
                    className={`p-2 cursor-pointer hover:bg-muted ${selectedCombo?.id === combo.id ? "bg-muted" : ""}`}
                    onClick={() => setSelectedCombo(combo)}
                  >
                    <p className="font-medium">{combo.nombre}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Código: {combo.codigo || "N/A"}</span>
                      <span>Precio: ${combo.precio.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedCombo && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedCombo.nombre}</p>
                      <p className="text-sm text-muted-foreground">Precio: ${selectedCombo.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCantidad(cantidad + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddComboDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddCombo} disabled={!selectedCombo}>
              Agregar
            </Button>
          </DialogFooter>
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

