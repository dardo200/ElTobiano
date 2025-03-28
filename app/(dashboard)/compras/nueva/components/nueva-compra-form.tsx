"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Barcode, Info, Search, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
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
  const [productosDropdowns, setProductosDropdowns] = useState<{ [key: number]: boolean }>({})
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({})
  const [filteredProductos, setFilteredProductos] = useState<{ [key: number]: Producto[] }>({})
  const [filterByProveedor, setFilterByProveedor] = useState(false)
  const [allProductos, setAllProductos] = useState<Producto[]>(productos)

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

  // Inicializar los estados para cada detalle
  useEffect(() => {
    const newDropdowns: { [key: number]: boolean } = {}
    const newSearchTerms: { [key: number]: string } = {}
    const newFilteredProductos: { [key: number]: Producto[] } = {}

    fields.forEach((field, index) => {
      newDropdowns[index] = newDropdowns[index] || false
      newSearchTerms[index] = newSearchTerms[index] || ""
      newFilteredProductos[index] = getFilteredProductos("", watchIdProveedor)
    })

    setProductosDropdowns(newDropdowns)
    setSearchTerms(newSearchTerms)
    setFilteredProductos(newFilteredProductos)
  }, [fields.length, watchIdProveedor, filterByProveedor])

  // Actualizar el proveedor seleccionado cuando cambia el id_proveedor
  useEffect(() => {
    if (watchIdProveedor) {
      const proveedor = proveedores.find((p) => p.id.toString() === watchIdProveedor)
      setSelectedProveedor(proveedor || null)

      // Actualizar el costo de envío con el valor del proveedor
      if (proveedor && proveedor.envio !== undefined) {
        form.setValue("costo_envio", proveedor.envio)
      }

      // Actualizar los productos filtrados para cada detalle
      const newFilteredProductos: { [key: number]: Producto[] } = {}
      fields.forEach((field, index) => {
        newFilteredProductos[index] = getFilteredProductos(searchTerms[index] || "", watchIdProveedor)
      })
      setFilteredProductos(newFilteredProductos)
    } else {
      setSelectedProveedor(null)
      setFilterByProveedor(false)
    }
  }, [watchIdProveedor, proveedores, form, fields.length, searchTerms, filterByProveedor])

  // Función para obtener productos filtrados basados en término de búsqueda y proveedor
  const getFilteredProductos = (searchTerm: string, idProveedor: string): Producto[] => {
    let filtered = [...productos]

    // Filtrar por proveedor si está activado el filtro y hay un proveedor seleccionado
    if (filterByProveedor && idProveedor) {
      filtered = filtered.filter(
        (producto) => producto.id_proveedor && producto.id_proveedor.toString() === idProveedor,
      )
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    return filtered
  }

  // Calcular el precio con IVA para cada detalle
  const calcularPrecioConIVA = (precio: number, ivaPorcentaje: number): number => {
    return precio * (1 + ivaPorcentaje / 100)
  }

  const calcularTotal = () => {
    // Sumar el precio base * cantidad de cada producto
    const subtotal = watchDetalles.reduce((total, detalle) => {
      const precio = Number(detalle.precio || 0)
      const cantidad = Number(detalle.cantidad || 0)
      return total + precio * cantidad
    }, 0)

    // Sumar el IVA de cada producto
    const totalIVA = watchDetalles.reduce((total, detalle) => {
      const precio = Number(detalle.precio || 0)
      const cantidad = Number(detalle.cantidad || 0)
      const ivaPorcentaje = Number(detalle.iva_porcentaje || 0)
      return total + precio * (ivaPorcentaje / 100) * cantidad
    }, 0)

    // Sumar el costo de envío
    const costoEnvio = Number(form.watch("costo_envio") || 0)

    return Number(subtotal + totalIVA + costoEnvio)
  }

  const handleProductoChange = (index: number, id_producto: string) => {
    const producto = productos.find((p) => p.id.toString() === id_producto)
    if (producto) {
      form.setValue(`detalles.${index}.id_producto`, id_producto)
      form.setValue(`detalles.${index}.precio`, producto.precio_compra || producto.precio)
      // Cerrar el dropdown después de seleccionar
      toggleProductoDropdown(index, false)
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

  // Función segura para formatear números
  const formatNumber = (value: any): string => {
    const num = Number(value)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  // Funciones para manejar el dropdown personalizado
  const toggleProductoDropdown = (index: number, value?: boolean) => {
    setProductosDropdowns((prev) => ({
      ...prev,
      [index]: value !== undefined ? value : !prev[index],
    }))
  }

  const handleSearchChange = (index: number, value: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [index]: value,
    }))

    // Filtrar productos basados en el término de búsqueda y proveedor
    const filtered = getFilteredProductos(value, watchIdProveedor)

    setFilteredProductos((prev) => ({
      ...prev,
      [index]: filtered,
    }))
  }

  // Manejar cambio en el filtro por proveedor
  const handleFilterByProveedorChange = (checked: boolean) => {
    setFilterByProveedor(checked)

    // Actualizar los productos filtrados para cada detalle
    const newFilteredProductos: { [key: number]: Producto[] } = {}
    fields.forEach((field, index) => {
      newFilteredProductos[index] = getFilteredProductos(searchTerms[index] || "", watchIdProveedor)
    })
    setFilteredProductos(newFilteredProductos)
  }

  // Cerrar el dropdown cuando se hace clic fuera
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([indexStr, ref]) => {
        const index = Number.parseInt(indexStr)
        if (ref && !ref.contains(event.target as Node) && productosDropdowns[index]) {
          toggleProductoDropdown(index, false)
        }
      })
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [productosDropdowns])

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

        {selectedProveedor && (
          <div className="flex items-center space-x-2">
            <Switch
              id="filter-by-proveedor"
              checked={filterByProveedor}
              onCheckedChange={handleFilterByProveedorChange}
            />
            <label
              htmlFor="filter-by-proveedor"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Mostrar solo productos de {selectedProveedor.nombre}
            </label>
          </div>
        )}

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
                          <div className="relative w-full" ref={(el) => (dropdownRefs.current[index] = el)}>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between"
                              onClick={() => toggleProductoDropdown(index)}
                            >
                              {field.value
                                ? productos.find((producto) => producto.id.toString() === field.value)?.nombre
                                : "Seleccionar producto"}
                            </Button>

                            {productosDropdowns[index] && (
                              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                                <div className="p-2 border-b flex items-center">
                                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <Input
                                    placeholder="Buscar producto..."
                                    value={searchTerms[index] || ""}
                                    onChange={(e) => handleSearchChange(index, e.target.value)}
                                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                    autoFocus
                                  />
                                  {searchTerms[index] && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleSearchChange(index, "")}
                                      className="h-6 w-6"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                  {filteredProductos[index]?.length === 0 ? (
                                    <div className="p-2 text-center text-muted-foreground">
                                      No se encontraron productos
                                      {filterByProveedor && (
                                        <div className="mt-1 text-xs">
                                          Desactive el filtro por proveedor para ver todos los productos
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    filteredProductos[index]?.map((producto) => (
                                      <div
                                        key={producto.id}
                                        className={cn(
                                          "px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                          producto.id.toString() === field.value && "bg-accent text-accent-foreground",
                                        )}
                                        onClick={() => handleProductoChange(index, producto.id.toString())}
                                      >
                                        {producto.nombre}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
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
                    {formatNumber(
                      calcularPrecioConIVA(
                        Number(watchDetalles[index]?.precio || 0),
                        Number(watchDetalles[index]?.iva_porcentaje || 0),
                      ),
                    )}
                  </p>
                  <p>
                    Subtotal: $
                    {formatNumber(
                      Number(watchDetalles[index]?.precio || 0) * Number(watchDetalles[index]?.cantidad || 0),
                    )}
                  </p>
                  <p>
                    IVA: $
                    {formatNumber(
                      Number(watchDetalles[index]?.precio || 0) *
                        Number(watchDetalles[index]?.cantidad || 0) *
                        (Number(watchDetalles[index]?.iva_porcentaje || 0) / 100),
                    )}
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
                {formatNumber(
                  watchDetalles.reduce(
                    (total, detalle) => total + Number(detalle.precio || 0) * Number(detalle.cantidad || 0),
                    0,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span>
                $
                {formatNumber(
                  watchDetalles.reduce((total, detalle) => {
                    const precio = Number(detalle.precio || 0)
                    const cantidad = Number(detalle.cantidad || 0)
                    const ivaPorcentaje = Number(detalle.iva_porcentaje || 0)
                    return total + precio * (ivaPorcentaje / 100) * cantidad
                  }, 0),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío:</span>
              <span>${formatNumber(form.watch("costo_envio"))}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${formatNumber(calcularTotal())}</span>
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

