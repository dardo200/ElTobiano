"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Producto } from "@/types"

export function useComboEditor(form: any, productos: Producto[]) {
  const [editingComboIndex, setEditingComboIndex] = useState<number | null>(null)
  const [editingComboItems, setEditingComboItems] = useState<Array<{ id: number; nombre: string; cantidad: number }>>(
    [],
  )
  const [updateOriginalCombo, setUpdateOriginalCombo] = useState(false)
  const [modifiedCombos, setModifiedCombos] = useState<Record<string, { items: any[]; newPrice: number }>>({})
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [productQuantity, setProductQuantity] = useState<number>(1)

  const fetchComboDetails = async (index: number, comboId: string) => {
    try {
      // Fetch combo details
      const response = await fetch(`/api/combos/${comboId}`)
      if (!response.ok) {
        toast.error("Error al obtener detalles del combo")
        return
      }

      const combo = await response.json()

      // If we already have a modified version of this combo, use that
      if (modifiedCombos[comboId]) {
        setEditingComboItems(modifiedCombos[comboId].items)
      } else {
        // Otherwise use the original combo items
        const comboItems = combo.detalles.map((item) => ({
          id: item.id_producto,
          nombre: item.producto?.nombre || `Producto #${item.id_producto}`,
          cantidad: item.cantidad,
        }))
        setEditingComboItems(comboItems)
      }

      // Set this combo as the one being edited
      setEditingComboIndex(index)
    } catch (error) {
      console.error("Error al obtener detalles del combo:", error)
      toast.error("Error al obtener detalles del combo")
    }
  }

  const handleEditCombo = async (index: number) => {
    const comboId = form.getValues(`detalles.${index}.id_producto`)
    if (!comboId) return

    // If we're already editing this combo, toggle it off
    if (editingComboIndex === index) {
      setEditingComboIndex(null)
      return
    }

    fetchComboDetails(index, comboId)
  }

  const handleSaveComboChanges = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const comboId = form.getValues(`detalles.${editingComboIndex}.id_producto`)
    if (!comboId) return

    // Calculate new price based on the modified items
    try {
      // Get prices for all products in the combo
      const productPromises = editingComboItems.map(async (item) => {
        const productResponse = await fetch(`/api/productos/${item.id}`)
        if (!productResponse.ok) throw new Error(`Error fetching product ${item.id}`)
        const product = await productResponse.json()
        return {
          ...item,
          precio: product.precio,
        }
      })

      const productsWithPrices = await Promise.all(productPromises)

      // Calculate new price (simple sum of all products)
      const newPrice = productsWithPrices.reduce((total, item) => {
        return total + item.precio * item.cantidad
      }, 0)

      // Store the modified combo
      setModifiedCombos({
        ...modifiedCombos,
        [comboId]: {
          items: editingComboItems,
          newPrice: newPrice,
        },
      })

      // Update the price in the form
      form.setValue(`detalles.${editingComboIndex}.precio`, newPrice)

      toast.success("Combo modificado correctamente")

      // If user wants to update the original combo
      if (updateOriginalCombo) {
        // Call API to update the combo
        const updateResponse = await fetch(`/api/combos/${comboId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            detalles: editingComboItems.map((item) => ({
              id_producto: item.id,
              cantidad: item.cantidad,
            })),
            precio_venta: newPrice,
          }),
        })

        if (updateResponse.ok) {
          toast.success("Combo original actualizado correctamente")
        } else {
          toast.error("Error al actualizar el combo original")
        }
      }
    } catch (error) {
      console.error("Error al calcular nuevo precio:", error)
      toast.error("Error al calcular nuevo precio")
    }

    setEditingComboIndex(null)
  }

  const handleAddProductToCombo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProductId("")
    setProductQuantity(1)
    setShowAddProductDialog(true)
  }

  const handleConfirmAddProduct = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!selectedProductId) {
      toast.error("Debe seleccionar un producto")
      return
    }

    const producto = productos.find((p) => p.id.toString() === selectedProductId)
    if (!producto) {
      toast.error("Producto no encontrado")
      return
    }

    setEditingComboItems([
      ...editingComboItems,
      {
        id: producto.id,
        nombre: producto.nombre,
        cantidad: productQuantity,
      },
    ])

    setShowAddProductDialog(false)
    toast.success(`Producto ${producto.nombre} agregado al combo`)
  }

  const handleRemoveProductFromCombo = (productIndex: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const newItems = [...editingComboItems]
    newItems.splice(productIndex, 1)
    setEditingComboItems(newItems)
  }

  const handleUpdateQuantity = (productIndex: number, newQuantity: number, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (e) {
      e.stopPropagation()
    }

    const newItems = editingComboItems.map((item, index) => {
      if (index === productIndex) {
        return { ...item, cantidad: newQuantity }
      }
      return item
    })

    setEditingComboItems(newItems)
  }

  const handleCloseDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setShowAddProductDialog(false)
  }

  return {
    editingComboIndex,
    editingComboItems,
    updateOriginalCombo,
    modifiedCombos,
    showAddProductDialog,
    selectedProductId,
    productQuantity,
    setUpdateOriginalCombo,
    setEditingComboIndex,
    setEditingComboItems,
    setModifiedCombos,
    setShowAddProductDialog,
    setSelectedProductId,
    setProductQuantity,
    fetchComboDetails,
    handleEditCombo,
    handleSaveComboChanges,
    handleAddProductToCombo,
    handleConfirmAddProduct,
    handleRemoveProductFromCombo,
    handleUpdateQuantity,
    handleCloseDialog,
  }
}

