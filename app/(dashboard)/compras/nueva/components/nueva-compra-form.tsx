"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { Producto, Proveedor } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  id_proveedor: z.string().min(1, "Proveedor requerido"),
  detalles: z
    .array(
      z.object({
        id_producto: z.string().min(1, "Producto requerido"),
        cantidad: z.coerce.number().min(1, "Cantidad mínima es 1"),
        precio: z.coerce.number().min(0, "Precio debe ser mayor o igual a 0"),
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
      detalles: [
        {
          id_producto: "",
          cantidad: 1,
          precio: 0,
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

  const calcularTotal = () => {
    return watchDetalles.reduce((total, detalle) => {
      const precio = detalle.precio || 0
      const cantidad = detalle.cantidad || 0
      return total + precio * cantidad
    }, 0)
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

      // Preparar los datos para la API
      const compraData = {
        id_proveedor: Number.parseInt(data.id_proveedor),
        fecha: new Date().toISOString(),
        total,
        detalles: data.detalles.map((detalle) => ({
          id_producto: Number.parseInt(detalle.id_producto),
          cantidad: detalle.cantidad,
          precio: detalle.precio,
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.id_producto`}
                    render={({ field }) => (
                      <FormItem>
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
                        <FormLabel>Precio de Compra</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col justify-between">
                    <FormField
                      control={form.control}
                      name={`detalles.${index}.actualizar_precio_compra`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Actualizar precio de compra</FormLabel>
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
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ id_producto: "", cantidad: 1, precio: 0, actualizar_precio_compra: true })}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${calcularTotal().toFixed(2)}</span>
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

