"use client"

import type React from "react"
import { Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Producto, Combo } from "@/types"

interface ProductoComboSelectorProps {
  index: number
  productos: Producto[]
  combos: Combo[]
  isMayorista: boolean
  isLoading: boolean
  form: any
  activeTabsState: Record<number, "producto" | "combo">
  handleTabChange: (index: number, value: "producto" | "combo") => void
  handleProductoChange: (index: number, id: string, tipo: "producto" | "combo") => void
  handleScanBarcode: (index: number) => void
  handleEditCombo?: (index: number) => void
}

export const ProductoComboSelector: React.FC<ProductoComboSelectorProps> = ({
  index,
  productos,
  combos,
  isMayorista,
  isLoading,
  form,
  activeTabsState,
  handleTabChange,
  handleProductoChange,
  handleScanBarcode,
  handleEditCombo,
}) => {
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

  return (
    <div className="sm:col-span-2">
      <Tabs
        value={activeTabsState[index] || form.watch(`detalles.${index}.tipo`) || "producto"}
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
                  <Button type="button" variant="outline" size="icon" onClick={() => handleScanBarcode(index)}>
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
                  {handleEditCombo && field.value && (
                    <Button type="button" variant="outline" size="icon" onClick={() => handleEditCombo(index)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      </svg>
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

