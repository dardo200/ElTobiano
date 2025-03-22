"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Save, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import type { Producto } from "@/types"

interface ComboEditorProps {
  comboId: number
  comboItems: Array<{ id_producto: number; nombre: string; cantidad: number }>
  productos: Producto[]
  onSave: (items: Array<{ id_producto: number; nombre: string; cantidad: number }>, updateOriginal: boolean) => void
  onAddProduct: (productId: number, quantity: number) => void
  onRemoveProduct: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
}

export function ComboEditor({
  comboId,
  comboItems,
  productos,
  onSave,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity,
}: ComboEditorProps) {
  const [updateOriginalCombo, setUpdateOriginalCombo] = useState(false)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [productQuantity, setProductQuantity] = useState<number>(1)

  const productoOptions = productos.map((producto) => ({
    value: producto.id.toString(),
    label: `${producto.nombre} - $${producto.precio.toFixed(2)} - Stock: ${producto.stock || 0}`,
    searchTerms: `${producto.codigo || ""} ${producto.descripcion || ""} ${producto.codigo_proveedor || ""}`,
  }))

  const handleConfirmAddProduct = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!selectedProductId) return

    const productId = Number.parseInt(selectedProductId)
    onAddProduct(productId, productQuantity)

    setShowAddProductDialog(false)
    setSelectedProductId("")
    setProductQuantity(1)
  }

  const handleSaveComboChanges = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSave(comboItems, updateOriginalCombo)
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Contenido del combo</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id={`update-original-${comboId}`}
              checked={updateOriginalCombo}
              onCheckedChange={setUpdateOriginalCombo}
            />
            <Label htmlFor={`update-original-${comboId}`}>Actualizar combo original</Label>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(true)} size="sm">
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
            {comboItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No hay productos en este combo. Agrega algunos productos.
                </TableCell>
              </TableRow>
            ) : (
              comboItems.map((item, itemIndex) => (
                <TableRow key={itemIndex}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => onUpdateQuantity(itemIndex, Number.parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="destructive" size="sm" onClick={() => onRemoveProduct(itemIndex)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para agregar producto al combo */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar producto al combo</DialogTitle>
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
                onChange={(e) => setProductQuantity(Number.parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmAddProduct} disabled={!selectedProductId}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

