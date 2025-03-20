"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Barcode, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Producto, Proveedor } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  id_proveedor: z.string().min(1, "Proveedor requerido"),
  costo_envio: z.coerce.number().min(0, "El costo de envío no puede ser negativo"),
  detalles: z
    .array(
      z.object({
        id_producto: z.string().min(1, "Producto requerido"),
        cantidad: z.coerce.number().min(1, "Cantidad mínima es 1"),
        precio: z.coerce.number().min(0, "Precio debe ser mayor o igual a 0"),
        iva_porcentaje: z.coerce.number().min(0, "IVA debe ser mayor o igual a 0"),
        actualizar_precio_compra: z.boolean().default(true),
      }),
    )
    .min(1, "Debe agregar al menos un producto"),
})

type CompraFormValues = z.infer<typeof formSchema>

interface NuevaCompraFormProps {
  productos: Producto[]
}

export const NuevaCompraForm: React.FC<NuevaCompraFormProps> = ({ productos }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [searchCode, setSearchCode] = useState("")
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await fetch("/api/proveedores")
        if (response.ok) {
          const data = await response.json()
          setProveedores(data)
        } else {
          console.error("Error al obtener proveedores")
        }
      } catch (error) {
        console.error("Error al obtener proveedores:", error)
      }
    }

    fetchProveedores()
  }, [])

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_proveedor: "",
      costo_envio: 0,
      detalles: [
        {
          id_producto: "",
          cantidad: 1,
          precio: 0,
          iva_porcentaje: 21, // Valor por defecto: 21%
          actualizar_precio_compra: true,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "detalles",
  })

  const watchDetalles = form.watch("detalles")
  const watchIdProveedor = form.watch("id_proveedor")

  // Actualizar el proveedor seleccionado cuando cambia el id_proveedor
  useEffect(() => {
    if (watchIdProveedor) {
      const proveedor = proveedores.find((p) => p.id.toString() === watchIdProveedor)
      setSelectedProveedor(proveedor || null)

      // Actualizar el costo de envío con el valor del proveedor
      if (proveedor && proveedor.envio !== undefined) {
        form.setValue("costo_envio", proveedor.envio)
      }
    } else {
      setSelectedProveedor(null)
    }
  }, [watchIdProveedor, proveedores, form])

  // Calcular el precio con IVA para cada detalle
  const calcularPrecioConIVA = (precio: number, ivaPorcentaje: number): number => {
    return precio * (1 + ivaPorcentaje / 100)
  }

  const calcularTotal = () => {
    // Sumar el precio base * cantidad de cada producto
    const subtotal = watchDetalles.reduce((total, detalle) => {
      const precio = detalle.precio || 0
      const cantidad = detalle.cantidad || 0
      return total + precio * cantidad
    }, 0)

    // Sumar el IVA de cada producto
    const totalIVA = watchDetalles.reduce((total, detalle) => {
      const precio = detalle.precio || 0
      const cantidad = detalle.cantidad || 0
      const ivaPorcentaje = detalle.iva_porcentaje || 0
      return total + precio * (ivaPorcentaje / 100) * cantidad
    }, 0)

    // Sumar el costo de envío
    const costoEnvio = form.watch("costo_envio") || 0

    return subtotal + totalIVA + costoEnvio
  }

  const handleProductoChange = (index: number, id_producto: string) => {
    const producto = productos.find((p) => p.id.toString() === id_producto)
    if (producto) {
      form.setValue(`detalles.${index}.precio`, producto.precio_compra || producto.precio)
    }
  }

  const handleScanBarcode = (index: number) => {
    const barcodeInput = prompt("Escanee o ingrese el código de barras o ID del producto:")
    if (barcodeInput) {
      // Buscar producto por código o ID
      const producto = productos.find((p) => p.codigo === barcodeInput || p.id.toString() === barcodeInput)
      if (producto) {
        form.setValue(`detalles.${index}.id_producto`, producto.id.toString())
        form.setValue(`detalles.${index}.precio`, producto.precio_compra || producto.precio)
        toast.success(`Producto escaneado: ${producto.nombre}`)
      } else {
        toast.error("Producto no encontrado")
      }
    }
  }

  const handleSearchByCode = async () => {
    if (!searchCode) return

    try {
      // Buscar producto por código
      const productoResponse = await fetch(`/api/productos/codigo/${searchCode}`)
      if (productoResponse.ok) {
        const producto = await productoResponse.json()
        if (producto) {
          // Agregar producto a la lista
          append({
            id_producto: producto.id.toString(),
            cantidad: 1,
            precio: producto.precio_compra || producto.precio,
            iva_porcentaje: 21, // Valor por defecto: 21%
            actualizar_precio_compra: true,
          })
          setSearchCode("")
          toast.success(`Producto agregado: ${producto.nombre}`)
          return
        }
      }

      toast.error("Producto no encontrado")
    } catch (error) {
      console.error("Error al buscar por código:", error)
      toast.error("Error al buscar por código")
    }
  }

  const onSubmit = async (data: CompraFormValues) => {
    setIsLoading(true)
    try {
      // Calcular el total
      const total = calcularTotal()

      // Preparar los detalles con el precio_con_iva calculado
      const detallesConIVA = data.detalles.map((detalle) => ({
        ...detalle,
        precio_con_iva: calcularPrecioConIVA(detalle.precio, detalle.iva_porcentaje),
      }))

      // Preparar los datos para la API
      const compraData = {
        id_proveedor: Number.parseInt(data.id_proveedor),
        fecha: new Date().toISOString(),
        total,
        costo_envio: data.costo_envio,
        detalles: detallesConIVA.map((detalle) => ({
          id_producto: Number.parseInt(detalle.id_producto),
          cantidad: detalle.cantidad,
          precio: detalle.precio,
          iva_porcentaje: detalle.iva_porcentaje,
          precio_con_iva: detalle.precio_con_iva,
          actualizar_precio_compra: detalle.actualizar_precio_compra,
        })),
      }

      const response = await fetch("/api/compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(compraData),
      })

      if (response.ok) {
        toast.success("Compra registrada correctamente.")
        router.push("/compras")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al crear la compra:", errorData)
        toast.error(errorData.error || "Error al registrar la compra.")
      }
    } catch (error) {
      console.error("Error al crear la compra:", error)
      toast.error("Error al registrar la compra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Escanear código de barras"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="max-w-xs"
          />
          <Button type="button" onClick={handleSearchByCode} disabled={!searchCode}>
            <Barcode className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Productos</h3>
          {fields.map((field, index) => (
            <Card key={field.id} className="mb-4">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.id_producto`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Producto</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            disabled={isLoading}
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProductoChange(index, value)
                            }}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productos.map((producto) => (
                                <SelectItem key={producto.id} value={producto.id.toString()}>
                                  {producto.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => handleScanBarcode(index)}>
                            <Barcode className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.cantidad`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.precio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Base</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.iva_porcentaje`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IVA</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={(value) => field.onChange(Number.parseFloat(value))}
                          value={field.value.toString()}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar IVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="10.5">10.5%</SelectItem>
                            <SelectItem value="21">21%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col justify-between md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`detalles.${index}.actualizar_precio_compra`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <div className="flex items-center">
                              <FormLabel>Actualizar precio</FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      Actualiza el precio de compra del producto con el precio base + IVA + parte
                                      proporcional del envío
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isLoading || fields.length === 1}
                      className="self-end"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mostrar el precio con IVA calculado */}
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    Precio con IVA: $
                    {calcularPrecioConIVA(
                      watchDetalles[index]?.precio || 0,
                      watchDetalles[index]?.iva_porcentaje || 0,
                    ).toFixed(2)}
                  </p>
                  <p>
                    Subtotal: $
                    {((watchDetalles[index]?.precio || 0) * (watchDetalles[index]?.cantidad || 0)).toFixed(2)}
                  </p>
                  <p>
                    IVA: $
                    {(
                      (watchDetalles[index]?.precio || 0) *
                      (watchDetalles[index]?.cantidad || 0) *
                      ((watchDetalles[index]?.iva_porcentaje || 0) / 100)
                    ).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id_producto: "",
                cantidad: 1,
                precio: 0,
                iva_porcentaje: 21,
                actualizar_precio_compra: true,
              })
            }
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>
                $
                {watchDetalles
                  .reduce((total, detalle) => total + (detalle.precio || 0) * (detalle.cantidad || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span>
                $
                {watchDetalles
                  .reduce((total, detalle) => {
                    const precio = detalle.precio || 0
                    const cantidad = detalle.cantidad || 0
                    const ivaPorcentaje = detalle.iva_porcentaje || 0
                    return total + precio * (ivaPorcentaje / 100) * cantidad
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío:</span>
              <span>${(form.watch("costo_envio") || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${calcularTotal().toFixed(2)}</span>
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
            Registrar Compra
          </Button>
        </div>
      </form>
    </Form>
  )
}

