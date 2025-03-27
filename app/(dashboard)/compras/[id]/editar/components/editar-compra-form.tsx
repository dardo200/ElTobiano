"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Compra, Proveedor, Producto } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
  id_proveedor: z.string().min(1, "El proveedor es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  costo_envio: z.coerce.number().min(0, "El costo de envío no puede ser negativo"),
})

type CompraFormValues = z.infer<typeof formSchema> & {
  detalles: {
    id?: number
    id_producto: number
    cantidad: number
    precio: number | string
    iva_porcentaje: number
    precio_con_iva: number | string
    producto?: {
      id: number
      nombre: string
      descripcion?: string
    }
    esNuevo?: boolean
    eliminado?: boolean
  }[]
}

interface EditarCompraFormProps {
  compra: Compra
  proveedores: Proveedor[]
}

// Función auxiliar para asegurar que un valor sea un número
const ensureNumber = (value: any): number => {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export const EditarCompraForm: React.FC<EditarCompraFormProps> = ({ compra, proveedores }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [detallesModificados, setDetallesModificados] = useState(false)

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_proveedor: compra.id_proveedor.toString(),
      fecha: new Date(compra.fecha).toISOString().split("T")[0],
      costo_envio: compra.costo_envio || 0,
      detalles:
        compra.detalles?.map((detalle) => ({
          id: detalle.id,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio: ensureNumber(detalle.precio),
          iva_porcentaje: detalle.iva_porcentaje || 0,
          precio_con_iva: ensureNumber(detalle.precio_con_iva || detalle.precio),
          producto: detalle.producto,
        })) || [],
    },
  })

  const watchIdProveedor = form.watch("id_proveedor")

  useEffect(() => {
    if (watchIdProveedor) {
      const proveedor = proveedores.find((p) => p.id.toString() === watchIdProveedor)
      setSelectedProveedor(proveedor || null)
    } else {
      setSelectedProveedor(null)
    }
  }, [watchIdProveedor, proveedores])

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch("/api/productos")
        if (response.ok) {
          const data = await response.json()
          setProductos(data)
        }
      } catch (error) {
        console.error("Error al cargar productos:", error)
      }
    }

    fetchProductos()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos(productos)
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredProductos(filtered)
    }
  }, [searchTerm, productos])

  const handleAddProducto = (producto: Producto) => {
    const detalles = form.getValues("detalles") || []

    // Verificar si el producto ya está en la lista
    const existingIndex = detalles.findIndex((d) => d.id_producto === producto.id && !d.eliminado)

    if (existingIndex >= 0) {
      // Si ya existe, incrementar la cantidad
      const updatedDetalles = [...detalles]
      updatedDetalles[existingIndex].cantidad += 1
      form.setValue("detalles", updatedDetalles)
    } else {
      // Asegurar que precio_compra y precio sean números
      const precioCompra = ensureNumber(producto.precio_compra)
      const precio = ensureNumber(producto.precio)
      const precioFinal = precioCompra > 0 ? precioCompra : precio

      // Si no existe, añadir nuevo detalle
      form.setValue("detalles", [
        ...detalles,
        {
          id_producto: producto.id,
          cantidad: 1,
          precio: precioFinal,
          iva_porcentaje: 21, // Valor por defecto, ajustar según necesidad
          precio_con_iva: precioFinal * 1.21,
          producto: {
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
          },
          esNuevo: true,
        },
      ])
    }

    setDetallesModificados(true)
    setIsProductDialogOpen(false)
  }

  const handleRemoveDetalle = (index: number) => {
    const detalles = form.getValues("detalles")

    // Si es un detalle existente, marcarlo como eliminado
    if (detalles[index].id) {
      const updatedDetalles = [...detalles]
      updatedDetalles[index].eliminado = true
      form.setValue("detalles", updatedDetalles)
    } else {
      // Si es un detalle nuevo, eliminarlo del array
      const updatedDetalles = detalles.filter((_, i) => i !== index)
      form.setValue("detalles", updatedDetalles)
    }

    setDetallesModificados(true)
  }

  const handleUpdateCantidad = (index: number, cantidad: number) => {
    if (cantidad < 1) return

    const detalles = form.getValues("detalles")
    const updatedDetalles = [...detalles]
    updatedDetalles[index].cantidad = cantidad
    form.setValue("detalles", updatedDetalles)

    setDetallesModificados(true)
  }

  const calcularTotal = () => {
    const detalles = form.getValues("detalles") || []
    const costoEnvio = ensureNumber(form.getValues("costo_envio")) || 0

    const subtotal = detalles
      .filter((d) => !d.eliminado)
      .reduce((sum, detalle) => sum + detalle.cantidad * ensureNumber(detalle.precio_con_iva), 0)

    return subtotal + costoEnvio
  }

  const onSubmit = async (data: CompraFormValues) => {
    setIsLoading(true)
    try {
      // Obtener todos los detalles, incluidos los marcados como eliminados
      const detalles = form.getValues("detalles") || []

      // Preparar los detalles para la API
      const detallesActualizados = {
        existentes: detalles
          .filter((d) => d.id && !d.esNuevo && !d.eliminado)
          .map((d) => ({
            id: d.id!,
            cantidad: d.cantidad,
            precio: ensureNumber(d.precio),
            iva_porcentaje: d.iva_porcentaje,
            precio_con_iva: ensureNumber(d.precio_con_iva),
          })),
        nuevos: detalles
          .filter((d) => d.esNuevo && !d.eliminado)
          .map((d) => ({
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio: ensureNumber(d.precio),
            iva_porcentaje: d.iva_porcentaje,
            precio_con_iva: ensureNumber(d.precio_con_iva),
            actualizar_precio_compra: true,
          })),
        eliminados: detalles.filter((d) => d.id && d.eliminado).map((d) => d.id!),
      }

      const total = calcularTotal()

      console.log("Enviando datos de actualización:", {
        id_proveedor: Number.parseInt(data.id_proveedor),
        fecha: new Date(data.fecha).toISOString(),
        costo_envio: ensureNumber(data.costo_envio),
        total: total,
        detallesActualizados: detallesActualizados,
      })

      const response = await fetch(`/api/compras/detalles?id=${compra.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_proveedor: Number.parseInt(data.id_proveedor),
          fecha: new Date(data.fecha).toISOString(),
          costo_envio: ensureNumber(data.costo_envio),
          total: total,
          detallesActualizados: detallesActualizados,
        }),
      })

      if (response.ok) {
        const resultado = await response.json()
        console.log("Respuesta del servidor:", resultado)
        toast.success("Compra actualizada correctamente")
        router.push("/compras")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al actualizar la compra:", errorData)
        toast.error(errorData.error || "Error al actualizar la compra")
      }
    } catch (error) {
      console.error("Error al actualizar la compra:", error)
      toast.error("Error al actualizar la compra")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FormField
            control={form.control}
            name="id_proveedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                        {proveedor.nombre}
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
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costo_envio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de Envío</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" disabled={isLoading} {...field} />
                </FormControl>
                {selectedProveedor && (
                  <p className="text-sm text-muted-foreground">
                    Costo de envío predeterminado del proveedor: ${selectedProveedor.envio?.toFixed(2) || "0.00"}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Productos de la compra</h3>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agregar producto a la compra</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {filteredProductos.map((producto) => (
                        <Card
                          key={producto.id}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleAddProducto(producto)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{producto.nombre}</p>
                                <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
                                {producto.codigo && (
                                  <p className="text-xs text-muted-foreground">Código: {producto.codigo}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  $
                                  {typeof producto.precio_compra === "number"
                                    ? producto.precio_compra.toFixed(2)
                                    : ensureNumber(producto.precio).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">Stock: {producto.stock || 0}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredProductos.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No se encontraron productos</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                  <TableHead className="w-[120px] text-right">Precio</TableHead>
                  <TableHead className="w-[80px] text-right">IVA</TableHead>
                  <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form
                  .watch("detalles")
                  ?.filter((d) => !d.eliminado)
                  .map((detalle, index) => (
                    <TableRow key={detalle.id || `new-${index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                          </p>
                          {detalle.esNuevo && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Nuevo</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateCantidad(index, detalle.cantidad - 1)}
                          >
                            -
                          </Button>
                          <span>{detalle.cantidad}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleUpdateCantidad(index, detalle.cantidad + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${ensureNumber(detalle.precio).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{detalle.iva_porcentaje}%</TableCell>
                      <TableCell className="text-right font-bold">
                        ${(ensureNumber(detalle.precio_con_iva) * detalle.cantidad).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveDetalle(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {(!form.watch("detalles") || form.watch("detalles").filter((d) => !d.eliminado).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No hay productos en esta compra. Haga clic en "Agregar producto" para añadir.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal:</p>
              <p className="text-sm text-muted-foreground">Costo de envío:</p>
              <p className="font-bold mt-1">Total:</p>
            </div>
            <div className="text-right">
              <p className="text-sm">
                $
                {form
                  .watch("detalles")
                  ?.filter((d) => !d.eliminado)
                  .reduce((sum, d) => sum + d.cantidad * ensureNumber(d.precio_con_iva), 0)
                  .toFixed(2) || "0.00"}
              </p>
              <p className="text-sm">${ensureNumber(form.watch("costo_envio")).toFixed(2) || "0.00"}</p>
              <p className="font-bold mt-1">${calcularTotal().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <Separator />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/compras")}
            className="mr-2"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  )
}

