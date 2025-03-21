"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Tag, Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { Cliente, Producto, Combo } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  id_cliente: z.string().optional(),
  detalles: z
    .array(
      z.object({
        id_producto: z.string().min(1, "Producto requerido"),
        cantidad: z.coerce.number().min(1, "Cantidad mínima es 1"),
        precio: z.coerce.number().min(0, "Precio debe ser mayor o igual a 0"),
        es_combo: z.boolean().default(false),
        tipo: z.enum(["producto", "combo"]).default("producto"),
        es_mayorista: z.boolean().default(false),
      }),
    )
    .min(1, "Debe agregar al menos un producto"),
})

type VentaFormValues = z.infer<typeof formSchema>

interface NuevaVentaFormProps {
  clientes: Cliente[]
  productos: Producto[]
}

export const NuevaVentaForm: React.FC<NuevaVentaFormProps> = ({ clientes, productos }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [combos, setCombos] = useState<Combo[]>([])
  const [searchCode, setSearchCode] = useState("")
  const [activeTabsState, setActiveTabsState] = useState<Record<number, "producto" | "combo">>({})
  const [isMayorista, setIsMayorista] = useState(false)

  // Convertir clientes a opciones para el Combobox
  const clienteOptions: ComboboxOption[] = [
    { value: "null", label: "Sin cliente" },
    ...clientes.map((cliente) => ({
      value: cliente.id.toString(),
      label: cliente.nombre,
      searchTerms: `${cliente.dni || ""} ${cliente.email || ""} ${cliente.telefono || ""}`,
    })),
  ]

  // Convertir productos a opciones para el Combobox
  const productoOptions: ComboboxOption[] = productos.map((producto) => ({
    value: producto.id.toString(),
    label: `${producto.nombre} - $${
      isMayorista && producto.precio_mayorista ? producto.precio_mayorista.toFixed(2) : producto.precio.toFixed(2)
    } - Stock: ${producto.stock || 0}`,
    searchTerms: `${producto.codigo || ""} ${producto.descripcion || ""} ${producto.codigo_proveedor || ""}`,
  }))

  // Convertir combos a opciones para el Combobox
  const comboOptions: ComboboxOption[] = combos.map((combo) => ({
    value: combo.id.toString(),
    label: `${combo.nombre} - $${combo.precio_venta.toFixed(2)}`,
    searchTerms: `${combo.codigo || ""} ${combo.descripcion || ""}`,
  }))

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const response = await fetch("/api/combos")
        if (response.ok) {
          const data = await response.json()
          setCombos(data)
        } else {
          console.error("Error al obtener combos")
        }
      } catch (error) {
        console.error("Error al obtener combos:", error)
      }
    }

    fetchCombos()
  }, [])

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_cliente: undefined,
      detalles: [
        {
          id_producto: "",
          cantidad: 1,
          precio: 0,
          es_combo: false,
          tipo: "producto",
          es_mayorista: false,
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

  const handleProductoChange = (index: number, id_producto: string, tipo: "producto" | "combo") => {
    if (tipo === "producto") {
      const producto = productos.find((p) => p.id.toString() === id_producto)
      if (producto) {
        // Usar precio mayorista si está seleccionado, de lo contrario usar precio minorista
        const precio = isMayorista && producto.precio_mayorista ? producto.precio_mayorista : producto.precio
        form.setValue(`detalles.${index}.precio`, precio)
        form.setValue(`detalles.${index}.es_combo`, false)
        form.setValue(`detalles.${index}.tipo`, "producto")
        form.setValue(`detalles.${index}.es_mayorista`, isMayorista)
      }
    } else {
      const combo = combos.find((c) => c.id.toString() === id_producto)
      if (combo) {
        form.setValue(`detalles.${index}.precio`, combo.precio_venta)
        form.setValue(`detalles.${index}.es_combo`, true)
        form.setValue(`detalles.${index}.tipo`, "combo")
        form.setValue(`detalles.${index}.es_mayorista`, false)
      }
    }
  }

  const handleScanBarcode = (index: number) => {
    const barcodeInput = prompt("Ingrese el código de barras o ID del producto:")
    if (barcodeInput) {
      // Primero buscar en productos
      const producto = productos.find((p) => p.codigo === barcodeInput || p.id.toString() === barcodeInput)
      if (producto) {
        // Usar precio mayorista si está seleccionado, de lo contrario usar precio minorista
        const precio = isMayorista && producto.precio_mayorista ? producto.precio_mayorista : producto.precio
        form.setValue(`detalles.${index}.id_producto`, producto.id.toString())
        form.setValue(`detalles.${index}.precio`, precio)
        form.setValue(`detalles.${index}.es_combo`, false)
        form.setValue(`detalles.${index}.tipo`, "producto")
        form.setValue(`detalles.${index}.es_mayorista`, isMayorista)
        setActiveTabsState({ ...activeTabsState, [index]: "producto" })
        toast.success(`Producto escaneado: ${producto.nombre}`)
        return
      }

      // Si no se encuentra en productos, buscar en combos
      const combo = combos.find((c) => c.codigo === barcodeInput || c.id.toString() === barcodeInput)
      if (combo) {
        form.setValue(`detalles.${index}.id_producto`, combo.id.toString())
        form.setValue(`detalles.${index}.precio`, combo.precio_venta)
        form.setValue(`detalles.${index}.es_combo`, true)
        form.setValue(`detalles.${index}.tipo`, "combo")
        form.setValue(`detalles.${index}.es_mayorista`, false)
        setActiveTabsState({ ...activeTabsState, [index]: "combo" })
        toast.success(`Combo escaneado: ${combo.nombre}`)
        return
      }

      toast.error("Producto o combo no encontrado")
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
          // Usar precio mayorista si está seleccionado, de lo contrario usar precio minorista
          const precio = isMayorista && producto.precio_mayorista ? producto.precio_mayorista : producto.precio
          // Agregar producto a la lista
          append({
            id_producto: producto.id.toString(),
            cantidad: 1,
            precio: precio,
            es_combo: false,
            tipo: "producto",
            es_mayorista: isMayorista,
          })
          setSearchCode("")
          toast.success(`Producto agregado: ${producto.nombre}`)
          return
        }
      }

      // Buscar combo por código
      const comboResponse = await fetch(`/api/combos/codigo/${searchCode}`)
      if (comboResponse.ok) {
        const combo = await comboResponse.json()
        if (combo) {
          // Agregar combo a la lista
          append({
            id_producto: combo.id.toString(),
            cantidad: 1,
            precio: combo.precio_venta,
            es_combo: true,
            tipo: "combo",
            es_mayorista: false,
          })
          setSearchCode("")
          toast.success(`Combo agregado: ${combo.nombre}`)
          return
        }
      }

      toast.error("Producto o combo no encontrado")
    } catch (error) {
      console.error("Error al buscar por código:", error)
      toast.error("Error al buscar por código")
    }
  }

  const onSubmit = async (data: VentaFormValues) => {
    setIsLoading(true)
    try {
      // Calcular el total
      const total = calcularTotal()

      // Preparar los datos para la API
      const ventaData = {
        id_cliente: data.id_cliente && data.id_cliente !== "null" ? Number.parseInt(data.id_cliente) : null,
        fecha: new Date().toISOString(),
        total,
        cerrado: false,
        estado: "Pendiente",
        detalles: data.detalles.map((detalle) => ({
          id_producto: Number.parseInt(detalle.id_producto),
          cantidad: detalle.cantidad,
          precio: detalle.precio,
          es_combo: detalle.es_combo,
          es_mayorista: detalle.es_mayorista,
        })),
      }

      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ventaData),
      })

      if (response.ok) {
        toast.success("Venta creada correctamente.")
        router.push("/ventas")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al crear la venta:", errorData)

        // Mostrar mensaje de error más detallado
        if (errorData.details) {
          toast.error(`Error: ${errorData.details}`)
        } else {
          toast.error(errorData.error || "Error al crear la venta")
        }
      }
    } catch (error) {
      console.error("Error al crear la venta:", error)
      toast.error(`Error: ${error.message || "Error desconocido al crear la venta"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (index: number, value: "producto" | "combo") => {
    setActiveTabsState({ ...activeTabsState, [index]: value })

    // Limpiar el valor del producto/combo seleccionado
    form.setValue(`detalles.${index}.id_producto`, "")
    form.setValue(`detalles.${index}.precio`, 0)

    // Actualizar el tipo y es_combo según la pestaña seleccionada
    form.setValue(`detalles.${index}.tipo`, value)
    form.setValue(`detalles.${index}.es_combo`, value === "combo")
    form.setValue(`detalles.${index}.es_mayorista`, value === "producto" ? isMayorista : false)
  }

  const handleMayoristaChange = (checked: boolean) => {
    setIsMayorista(checked)

    // Actualizar los precios de los productos ya seleccionados
    watchDetalles.forEach((detalle, index) => {
      if (detalle.tipo === "producto" && detalle.id_producto) {
        const producto = productos.find((p) => p.id.toString() === detalle.id_producto)
        if (producto) {
          const precio = checked && producto.precio_mayorista ? producto.precio_mayorista : producto.precio
          form.setValue(`detalles.${index}.precio`, precio)
          form.setValue(`detalles.${index}.es_mayorista`, checked)
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="id_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <Combobox
                    options={clienteOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Seleccionar cliente"
                    emptyMessage="No se encontraron clientes"
                    disabled={isLoading}
                    searchPlaceholder="Buscar por nombre, DNI, email..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center space-x-2">
            <Switch id="precio-mayorista" checked={isMayorista} onCheckedChange={handleMayoristaChange} />
            <Label htmlFor="precio-mayorista">Usar precios mayoristas</Label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <Input
            placeholder="Escanear código de barras"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Button type="button" onClick={handleSearchByCode} disabled={!searchCode} className="w-full sm:w-auto">
            <Barcode className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Productos</h3>
          {fields.map((field, index) => {
            const activeTab = activeTabsState[index] || watchDetalles[index].tipo || "producto"

            return (
              <Card key={field.id} className="mb-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="sm:col-span-2">
                      <Tabs
                        value={activeTab}
                        onValueChange={(value) => handleTabChange(index, value as "producto" | "combo")}
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="producto">Productos</TabsTrigger>
                          <TabsTrigger value="combo">Combos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="producto">
                          <FormField
                            control={form.control}
                            name={`detalles.${index}.id_producto`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Producto</FormLabel>
                                <div className="flex gap-2 w-full">
                                  <FormControl className="flex-1">
                                    <Combobox
                                      options={productoOptions}
                                      value={field.value}
                                      onChange={(value) => {
                                        field.onChange(value)
                                        handleProductoChange(index, value, "producto")
                                      }}
                                      placeholder="Seleccionar producto"
                                      emptyMessage="No se encontraron productos"
                                      disabled={isLoading}
                                      searchPlaceholder="Buscar por nombre, código..."
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleScanBarcode(index)}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="combo">
                          <FormField
                            control={form.control}
                            name={`detalles.${index}.id_producto`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Combo</FormLabel>
                                <div className="flex gap-2 w-full">
                                  <FormControl className="flex-1">
                                    <Combobox
                                      options={comboOptions}
                                      value={field.value}
                                      onChange={(value) => {
                                        field.onChange(value)
                                        handleProductoChange(index, value, "combo")
                                      }}
                                      placeholder="Seleccionar combo"
                                      emptyMessage="No se encontraron combos"
                                      disabled={isLoading}
                                      searchPlaceholder="Buscar por nombre, código..."
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
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
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" disabled={isLoading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end justify-end sm:justify-start">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isLoading || fields.length === 1}
                        className="h-10 w-10"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id_producto: "",
                cantidad: 1,
                precio: 0,
                es_combo: false,
                tipo: "producto",
                es_mayorista: isMayorista,
              })
            }
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
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/ventas")}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Venta
          </Button>
        </div>
      </form>
    </Form>
  )
}

