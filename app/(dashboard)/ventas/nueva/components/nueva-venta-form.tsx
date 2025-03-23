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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { Cliente, Producto, Combo } from "@/types"
import { toast } from "@/components/ui/use-toast"
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

// Importar componentes y hooks personalizados
import { ProductoComboSelector } from "@/components/ventas/producto-combo-selector"
import { ComboEditor } from "@/components/ventas/combo-editor"
import { useComboEditor } from "@/hooks/use-combo-editor"
import { useProductSearch } from "@/hooks/use-product-search"

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
  const [activeTabsState, setActiveTabsState] = useState<Record<number, "producto" | "combo">>({})
  const [isMayorista, setIsMayorista] = useState(false)

  // Convertir clientes a opciones para el Combobox
  const client = useState(false)

  // Convertir clientes a opciones para el Combobox
  const clienteOptions: ComboboxOption[] = [
    { value: "null", label: "Sin cliente" },
    ...clientes.map((cliente) => ({
      value: cliente.id.toString(),
      label: cliente.nombre,
      searchTerms: `${cliente.dni || ""} ${cliente.email || ""} ${cliente.telefono || ""}`,
    })),
  ]

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

  // Usar hooks personalizados
  const comboEditor = useComboEditor(form, productos)
  const productSearch = useProductSearch(productos, combos, isMayorista, append)

  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [productQuantity, setProductQuantity] = useState<number>(1)
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [productosSinStock, setProductosSinStock] = useState<Array<any>>([])
  const [ventaDataPendiente, setVentaDataPendiente] = useState<any>(null)

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

        // Cargar automáticamente los detalles del combo
        comboEditor.fetchComboDetails(index, id_producto)
      }
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

  const onSubmit = async (data: VentaFormValues) => {
    setIsLoading(true)
    try {
      // Calcular el total
      const total = calcularTotal()

      // Prepare the data for the API
      const ventaData = {
        id_cliente: data.id_cliente && data.id_cliente !== "null" ? Number.parseInt(data.id_cliente) : null,
        fecha: new Date().toISOString(),
        total,
        cerrado: false,
        estado: "Pendiente",
        detalles: data.detalles.map((detalle) => {
          // If this is a modified combo, we need to handle it differently
          if (detalle.es_combo && comboEditor.modifiedCombos[detalle.id_producto]) {
            // If we're not updating the original combo, we need to create individual product entries
            if (!comboEditor.updateOriginalCombo) {
              // Return the modified combo items as individual products
              return {
                id_producto: Number.parseInt(detalle.id_producto),
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                es_combo: detalle.es_combo,
                es_mayorista: detalle.es_mayorista,
                combo_modificado: true,
                items: comboEditor.modifiedCombos[detalle.id_producto].items.map((item) => ({
                  id_producto: item.id,
                  cantidad: item.cantidad * detalle.cantidad, // Multiply by the combo quantity
                })),
              }
            }
          }

          // Regular product or unmodified combo
          return {
            id_producto: Number.parseInt(detalle.id_producto),
            cantidad: detalle.cantidad,
            precio: detalle.precio,
            es_combo: detalle.es_combo,
            es_mayorista: detalle.es_mayorista,
          }
        }),
      }

      // Primero verificamos el stock
      const verificarResponse = await fetch("/api/ventas/verificar-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ventaData),
      })

      const verificarData = await verificarResponse.json()

      if (!verificarData.hayStockSuficiente && verificarData.productosSinStockSuficiente.length > 0) {
        // Guardar los datos para usarlos después de la confirmación
        setVentaDataPendiente(ventaData)
        setProductosSinStock(verificarData.productosSinStockSuficiente)
        setShowStockAlert(true)
        setIsLoading(false)
        return
      }

      // Si hay stock suficiente o no se requiere confirmación, crear la venta directamente
      await crearVenta(ventaData)
    } catch (error) {
      console.error("Error al crear la venta:", error)
      toast.error(`Error: ${error.message || "Error desconocido al crear la venta"}`)
      setIsLoading(false)
    }
  }

  // Función para crear la venta después de la verificación
  const crearVenta = async (ventaData: any) => {
    try {
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

  // Función para confirmar la creación de la venta a pesar de falta de stock
  const confirmarCrearVenta = () => {
    if (ventaDataPendiente) {
      crearVenta(ventaDataPendiente)
    }
    setShowStockAlert(false)
  }

  return (
    <div className="combo-form-container">
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
              value={productSearch.searchCode}
              onChange={(e) => productSearch.setSearchCode(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Button
              type="button"
              onClick={productSearch.handleSearchByCode}
              disabled={!productSearch.searchCode}
              className="w-full sm:w-auto"
            >
              <Barcode className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Productos</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="mb-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <ProductoComboSelector
                      index={index}
                      productos={productos}
                      combos={combos}
                      isMayorista={isMayorista}
                      isLoading={isLoading}
                      form={form}
                      activeTabsState={activeTabsState}
                      handleTabChange={handleTabChange}
                      handleProductoChange={handleProductoChange}
                      handleScanBarcode={(idx) =>
                        productSearch.handleScanBarcode(idx, form, activeTabsState, setActiveTabsState)
                      }
                      handleEditCombo={comboEditor.handleEditCombo}
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

                  {/* Show combo items if this is a combo */}
                  {watchDetalles[index].es_combo && comboEditor.editingComboIndex === index && (
                    <ComboEditor
                      editingComboIndex={comboEditor.editingComboIndex}
                      editingComboItems={comboEditor.editingComboItems}
                      updateOriginalCombo={comboEditor.updateOriginalCombo}
                      setUpdateOriginalCombo={comboEditor.setUpdateOriginalCombo}
                      handleAddProductToCombo={comboEditor.handleAddProductToCombo}
                      handleSaveComboChanges={comboEditor.handleSaveComboChanges}
                      handleRemoveProductFromCombo={comboEditor.handleRemoveProductFromCombo}
                      handleUpdateQuantity={comboEditor.handleUpdateQuantity}
                      showAddProductDialog={comboEditor.showAddProductDialog}
                      setShowAddProductDialog={comboEditor.setShowAddProductDialog}
                      selectedProductId={comboEditor.selectedProductId}
                      setSelectedProductId={comboEditor.setSelectedProductId}
                      productQuantity={comboEditor.productQuantity}
                      setProductQuantity={comboEditor.setProductQuantity}
                      handleConfirmAddProduct={comboEditor.handleConfirmAddProduct}
                      handleCloseDialog={comboEditor.handleCloseDialog}
                      productos={productos}
                    />
                  )}
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
      {/* Diálogo de alerta para stock insuficiente */}
      <AlertDialog open={showStockAlert} onOpenChange={setShowStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stock insuficiente</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="text-left">
                <p className="mb-2">Los siguientes productos no tienen stock suficiente:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {productosSinStock.map((producto, index) => (
                    <li key={index} className="text-sm">
                      {producto.combo ? (
                        <span>
                          <strong>{producto.nombre}</strong> (Código: {producto.codigo}) del combo "{producto.combo}"
                          <br />
                          <span className="text-xs">
                            Disponible: {producto.stockActual}, Necesario: {producto.cantidadSolicitada}
                          </span>
                        </span>
                      ) : (
                        <span>
                          <strong>{producto.nombre}</strong> (Código: {producto.codigo})
                          <br />
                          <span className="text-xs">
                            Disponible: {producto.stockActual}, Necesario: {producto.cantidadSolicitada}
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">¿Desea crear la venta de todas formas?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCrearVenta}>Crear venta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

