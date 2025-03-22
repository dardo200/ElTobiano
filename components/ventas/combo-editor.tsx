"use client"

import type React from "react"
import { Plus, Save, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import type { Producto } from "@/types"

interface ComboEditorProps {
  editingComboIndex: number | null
  editingComboItems: Array<{ id: number; nombre: string; cantidad: number }>
  updateOriginalCombo: boolean
  setUpdateOriginalCombo: (value: boolean) => void
  handleAddProductToCombo: (e: React.MouseEvent) => void
  handleSaveComboChanges: (e: React.MouseEvent) => void
  handleRemoveProductFromCombo: (productIndex: number, e?: React.MouseEvent) => void
  handleUpdateQuantity: (productIndex: number, newQuantity: number, e?: React.ChangeEvent<HTMLInputElement>) => void
  showAddProductDialog: boolean
  setShowAddProductDialog: (show: boolean) => void
  selectedProductId: string
  setSelectedProductId: (id: string) => void
  productQuantity: number
  setProductQuantity: (quantity: number) => void
  handleConfirmAddProduct: (e: React.MouseEvent) => void
  handleCloseDialog: (e?: React.MouseEvent) => void
  productos: Producto[]
}

export const ComboEditor: React.FC<ComboEditorProps> = ({
  editingComboIndex,
  editingComboItems,
  updateOriginalCombo,
  setUpdateOriginalCombo,
  handleAddProductToCombo,
  handleSaveComboChanges,
  handleRemoveProductFromCombo,
  handleUpdateQuantity,
  showAddProductDialog,
  setShowAddProductDialog,
  selectedProductId,
  setSelectedProductId,
  productQuantity,
  setProductQuantity,
  handleConfirmAddProduct,
  handleCloseDialog,
  productos,
}) => {
  // Convertir productos a opciones para el Combobox
  const productoOptions = productos.map((producto) => ({
    value: producto.id.toString(),
    label: `${producto.nombre} - $${producto.precio.toFixed(2)}`,
    searchTerms: `${producto.codigo || ""} ${producto.descripcion || ""}`,
  }))

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Contenido del combo</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id={`update-original-${editingComboIndex}`}
              checked={updateOriginalCombo}
              onCheckedChange={setUpdateOriginalCombo}
            />
            <Label htmlFor={`update-original-${editingComboIndex}`}>Actualizar combo original</Label>
          </div>
          <Button type="button" variant="outline" onClick={handleAddProductToCombo} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
          <Button type="button" onClick={handleSaveComboChanges} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingComboItems.map((item, itemIndex) => (
              <TableRow key={itemIndex}>
                <TableCell>{item.nombre}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => handleUpdateQuantity(itemIndex, Number.parseInt(e.target.value), e)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleRemoveProductFromCombo(itemIndex, e)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {editingComboItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No hay productos en este combo. Agrega algunos productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para agregar producto al combo */}
      <Dialog open={showAddProductDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar producto al combo</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={handleCloseDialog}
            >
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
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="producto">Producto</Label>
              <Combobox
                options={productoOptions}
                value={selectedProductId}
                onChange={setSelectedProductId}
                placeholder="Seleccionar producto"
                emptyMessage="No se encontraron productos"
                searchPlaceholder="Buscar por nombre, código..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={productQuantity}
                onChange={(e) => setProductQuantity(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmAddProduct}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

