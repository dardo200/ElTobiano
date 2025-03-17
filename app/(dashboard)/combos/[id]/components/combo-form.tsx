"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import type { Combo, Producto } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precio_venta: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  codigo: z.string().optional(),
  detalles: z
    .array(
      z.object({
        id_producto: z.string().min(1, "Producto requerido"),
        cantidad: z.coerce.number().min(1, "Cantidad mínima es 1"),
      }),
    )
    .min(1, "Debe agregar al menos un producto"),
})

type ComboFormValues = z.infer<typeof formSchema>

interface ComboFormProps {
  initialData?: Combo | null
  productos: Producto[]
}

export const ComboForm: React.FC<ComboFormProps> = ({ initialData, productos }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Transformar los detalles iniciales para el formulario
  const defaultDetalles = initialData?.detalles?.map((detalle) => ({
    id_producto: detalle.id_producto.toString(),
    cantidad: detalle.cantidad,
  })) || [{ id_producto: "", cantidad: 1 }]

  const form = useForm<ComboFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      precio_venta: initialData?.precio_venta || 0,
      codigo: initialData?.codigo || "",
      detalles: defaultDetalles,
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
      form.setValue(`detalles.${index}.precio`, producto.precio)
    }
  }

  const handleScanBarcode = () => {
    const code = prompt("Escanee o ingrese el código de barras:")
    if (code) {
      form.setValue("codigo", code)
    }
  }

  const onSubmit = async (data: ComboFormValues) => {
    setIsLoading(true)
    try {
      const url = initialData ? `/api/combos/${initialData.id}` : "/api/combos"

      const method = initialData ? "PATCH" : "POST"

      // Transformar los detalles para la API
      const detallesTransformados = data.detalles.map((detalle) => ({
        id_producto: Number.parseInt(detalle.id_producto),
        cantidad: detalle.cantidad,
      }))

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          detalles: detallesTransformados,
        }),
      })

      if (response.ok) {
        toast.success(initialData ? "Combo actualizado correctamente." : "Combo creado correctamente.")
        router.push("/combos")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al guardar el combo:", errorData)

        // Mostrar mensaje de error más detallado
        if (errorData.details) {
          toast.error(`Error: ${errorData.details}`)
        } else {
          toast.error(errorData.error || "Ha ocurrido un error al guardar el combo.")
        }
      }
    } catch (error) {
      console.error("Error al guardar el combo:", error)
      toast.error(`Error: ${error.message || "Error desconocido al guardar el combo"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Nombre del combo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="precio_venta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" disabled={isLoading} placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Barras</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Código de barras" {...field} value={field.value || ""} />
                  </FormControl>
                  <Button type="button" variant="outline" size="icon" onClick={handleScanBarcode} disabled={isLoading}>
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="Descripción del combo"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium mb-4">Productos del Combo</h3>
          {fields.map((field, index) => (
            <Card key={field.id} className="mb-4">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`detalles.${index}.id_producto`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
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
                                {producto.nombre} - ${producto.precio.toFixed(2)} - Stock: {producto.stock || 0}
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
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isLoading || fields.length === 1}
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
            onClick={() => append({ id_producto: "", cantidad: 1 })}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>

        <Separator />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/combos")}
            className="mr-2"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear combo"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

