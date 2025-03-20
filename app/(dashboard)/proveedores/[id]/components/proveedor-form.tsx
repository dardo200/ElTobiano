"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Proveedor } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  envio: z.coerce.number().min(0, "El precio de envío no puede ser negativo").optional(),
})

type ProveedorFormValues = z.infer<typeof formSchema>

interface ProveedorFormProps {
  initialData: Proveedor | null
}

export const ProveedorForm: React.FC<ProveedorFormProps> = ({ initialData }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      envio: 0,
    },
  })

  const onSubmit = async (data: ProveedorFormValues) => {
    setIsLoading(true)
    try {
      const url = initialData ? `/api/proveedores/${initialData.id}` : "/api/proveedores"

      const method = initialData ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(initialData ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente")
        router.push("/proveedores")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al guardar el proveedor:", errorData)
        toast.error("Error al guardar el proveedor")
      }
    } catch (error) {
      console.error("Error al guardar el proveedor:", error)
      toast.error("Error al guardar el proveedor")
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
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Nombre del proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    disabled={isLoading}
                    placeholder="Email del proveedor"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="Teléfono del proveedor"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="envio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Envío</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={isLoading}
                    placeholder="Precio de envío"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="Dirección del proveedor"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/proveedores")}
            className="mr-2"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Guardar cambios" : "Crear proveedor"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

