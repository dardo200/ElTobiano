"use client"

import { Label } from "@/components/ui/label"

import { Switch } from "@/components/ui/switch"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  const [detalles, setDetalles] = useState<
    Array<
      DetalleVenta & {
        es_combo?: boolean
        es_mayorista?: boolean
        combo_modificado?: boolean
      }
    >
  >([])
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
  const [isMayorista, setIsMayorista] = useState(false)
  const [comboDetalles, setComboDetalles] = useState<
    Record<
      number,
      Array<{
        id_producto: number
        nombre: string
        cantidad: number
        codigo?: string
      }>
    >
  >({})

  // Usar un ref para evitar actualizaciones infinitas
  const detallesRef = useRef(detalles)
  useEffect(() => {
    detallesRef.current = detalles
  }, [detalles])

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cliente: venta.id_cliente ? venta.id_cliente.toString() : undefined,
      estado: venta.estado,
    },
  })

  // Añadir este estado para controlar cuándo cargar los detalles de los combos
  const [shouldLoadComboDetails, setShouldLoadComboDetails] = useState(true)

  useEffect(() => {
    // Inicializar los detalles de la venta solo si no hay detalles cargados
    if (venta.detalles && venta.detalles.length > 0 && detalles.length === 0) {
      setDetalles(
        venta.detalles.map((detalle) => ({
          ...detalle,
          es_mayorista: detalle.es_mayorista || false,
        })),
      )
      // Activar la carga de detalles de combos después de inicializar
      setShouldLoadComboDetails(true)
    }
  }, [venta, detalles.length])

  useEffect(() => {
    // Calcular el total de la venta
    const nuevoTotal = detalles.reduce((sum, detalle) => sum + detalle.precio * detalle.cantidad, 0)
    setTotal(nuevoTotal)
  }, [detalles])

  useEffect(() => {
    // Cargar detalles de los combos
    const loadComboDetails = async () => {
      if (!shouldLoadComboDetails) return

      // Evitar que se vuelva a ejecutar mientras se está procesando
      setShouldLoadComboDetails(false)

      const combosToLoad = detalles.filter((d) => d.es_combo).map((d) => d.id_producto)
      if (combosToLoad.length === 0) return

      // Para cada combo, cargar sus detalles
      const comboDetailsMap: Record<number, any[]> = {}
      const detallesActualizados = [...detalles]
      let hayActualizaciones = false

      for (const comboId of combosToLoad) {
        try {
          // Buscar si hay un detalle con este combo que tenga datos_combo_modificado
          const detalleConComboModificado = detalles.find(
            (d) => d.es_combo && d.id_producto === comboId && d.datos_combo_modificado,
          )

          if (detalleConComboModificado && detalleConComboModificado.datos_combo_modificado) {
            // Si es un combo modificado, usar los datos almacenados
            try {
              const productosModificados = JSON.parse(detalleConComboModificado.datos_combo_modificado)

              // Obtener información completa de cada producto
              const productosCompletos = []
              for (const item of productosModificados) {
                const producto = productos.find((p) => p.id === item.id_producto)
                if (producto) {
                  productosCompletos.push({
                    id_producto: item.id_producto,
                    nombre: producto.nombre,
                    cantidad: item.cantidad,
                    codigo: producto.codigo || "",
                  })
                }
              }

              comboDetailsMap[comboId] = productosCompletos

              // Marcar este combo como modificado visualmente
              const index = detallesActualizados.findIndex((d) => d.id === detalleConComboModificado.id)
              if (index >= 0 && !detallesActualizados[index].combo_modificado) {
                detallesActualizados[index] = {
                  ...detallesActualizados[index],
                  combo_modificado: true,
                }
                hayActualizaciones = true
              }
            } catch (e) {
              console.error("Error al parsear datos_combo_modificado:", e)
            }
          } else {
            // Si no es modificado, cargar el combo original
            const response = await fetch(`/api/combos/${comboId}`)
            if (response.ok) {
              const comboData = await response.json()
              if (comboData.detalles && comboData.detalles.length > 0) {
                comboDetailsMap[comboId] = comboData.detalles.map((d: any) => ({
                  id_producto: d.id_producto,
                  nombre: d.producto?.nombre || `Producto #${d.id_producto}`,
                  cantidad: d.cantidad,
                  codigo: d.producto?.codigo || "",
                }))
              }
            }
          }
        } catch (error) {
          console.error(`Error al cargar detalles del combo ${comboId}:`, error)
        }
      }

      // Actualizar el estado de comboDetalles una sola vez
      setComboDetalles(comboDetailsMap)

      // Solo actualizar los detalles si hay cambios
      if (hayActualizaciones) {
        setDetalles(detallesActualizados)
      }
    }

    if (detalles.length > 0 && shouldLoadComboDetails) {
      loadComboDetails()
    }
  }, [shouldLoadComboDetails, detalles, productos])

  // Añadir este useEffect para activar la carga de detalles cuando cambian los detalles
  useEffect(() => {
    setShouldLoadComboDetails(true)
  }, [venta.id])

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

  const handleAddProducto = () => {
    if (!selectedProducto) return

    // Usar precio mayorista si está seleccionado, de lo contrario usar precio minorista
    const precio =
      isMayorista && selectedProducto.precio_mayorista ? selectedProducto.precio_mayorista : selectedProducto.precio

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
          precio: precio,
          es_combo: false,
          es_mayorista: isMayorista,
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
          es_mayorista: false,
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

  const handleMayoristaChange = (checked: boolean) => {
    setIsMayorista(checked)
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
                    setIsMayorista(false) // Reset mayorista state when opening dialog
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
                  <div key={detalle.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="font-medium flex items-center">
                          {detalle.es_combo && (
                            <Badge variant="outline" className="mr-2">
                              Combo
                            </Badge>
                          )}
                          {detalle.combo_modificado && (
                            <Badge variant="secondary" className="mr-2">
                              Modificado
                            </Badge>
                          )}
                          {detalle.es_mayorista && (
                            <Badge variant="outline" className="mr-2">
                              Mayorista
                            </Badge>
                          )}
                          <span>{detalle.producto?.nombre || `Producto #${detalle.id_producto}`}</span>
                        </div>
                      </div>
                      {detalle.es_combo && comboDetalles[detalle.id_producto] && (
                        <div className="mt-1 ml-5 text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Productos en este combo:</p>
                          <ul className="list-disc pl-4">
                            {comboDetalles[detalle.id_producto].map((producto, idx) => (
                              <li key={idx}>
                                {producto.nombre} ({producto.cantidad} {producto.cantidad > 1 ? "unidades" : "unidad"})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">Precio: ${detalle.precio?.toFixed(2) || "0.00"}</p>
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

            <div className="flex items-center space-x-2 mb-4">
              <Switch id="precio-mayorista-dialog" checked={isMayorista} onCheckedChange={handleMayoristaChange} />
              <Label htmlFor="precio-mayorista-dialog">Usar precio mayorista</Label>
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
                      <span>
                        Precio: $
                        {isMayorista && producto.precio_mayorista
                          ? producto.precio_mayorista.toFixed(2)
                          : producto.precio.toFixed(2)}
                      </span>
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
                      <p className="text-sm text-muted-foreground">
                        Precio: $
                        {isMayorista && selectedProducto.precio_mayorista
                          ? selectedProducto.precio_mayorista.toFixed(2)
                          : selectedProducto.precio.toFixed(2)}
                      </p>
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

