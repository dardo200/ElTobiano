"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Compra, Proveedor } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  id_proveedor: z.string().min(1, "El proveedor es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  costo_envio: z.coerce.number().min(0, "El costo de envío no puede ser negativo"),
})

type CompraFormValues = z.infer<typeof formSchema>

interface EditarCompraFormProps {
  compra: Compra
  proveedores: Proveedor[]
}

export const EditarCompraForm: React.FC<EditarCompraFormProps> = ({ compra, proveedores }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_proveedor: compra.id_proveedor.toString(),
      fecha: new Date(compra.fecha).toISOString().split("T")[0],
      costo_envio: compra.costo_envio || 0,
    },
  })

  const watchIdProveedor = form.watch("id_proveedor")

  // Actualizar el proveedor seleccionado cuando cambia el id_proveedor
  useEffect(() => {
    if (watchIdProveedor) {
      const proveedor = proveedores.find((p) => p.id.toString() === watchIdProveedor)
      setSelectedProveedor(proveedor || null)
    } else {
      setSelectedProveedor(null)
    }
  }, [watchIdProveedor, proveedores])

  const onSubmit = async (data: CompraFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/compras/${compra.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_proveedor: Number.parseInt(data.id_proveedor),
          fecha: new Date(data.fecha).toISOString(),
          costo_envio: data.costo_envio,
        }),
      })

      if (response.ok) {
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

        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Detalles de la compra</h3>
          <div className="space-y-2">
            {compra.detalles?.map((detalle, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{detalle.producto?.nombre || `Producto #${detalle.id_producto}`}</p>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {detalle.cantidad} x ${detalle.precio.toFixed(2)}
                    {detalle.iva_porcentaje !== undefined && ` + IVA ${detalle.iva_porcentaje}%`}
                  </p>
                </div>
                <p className="font-bold">
                  ${((detalle.precio_con_iva || detalle.precio) * detalle.cantidad).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-2 border-t">
            <p className="font-bold">Total:</p>
            <p className="font-bold">${compra.total.toFixed(2)}</p>
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

