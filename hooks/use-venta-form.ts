"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Cliente, Producto, Combo, DetalleVenta } from "@/types"

interface UseVentaFormProps {
  clientes: Cliente[]
  productos: Producto[]
  combos: Combo[]
  initialDetalles?: Array<DetalleVenta & { es_combo?: boolean; es_mayorista?: boolean; combo_modificado?: boolean }>
  ventaId?: number
}

export function useVentaForm({ clientes, productos, combos, initialDetalles = [], ventaId }: UseVentaFormProps) {
  const [detalles, setDetalles] =
    useState<
      Array<
        DetalleVenta & {
          es_combo?: boolean
          es_mayorista?: boolean
          combo_modificado?: boolean
        }
      >
    >(initialDetalles)
  const [isMayorista, setIsMayorista] = useState(false)
  const [total, setTotal] = useState(0)
  const [comboDetalles, setComboDetalles] = useState<
    Record<
      number,
      Array<{
        id_producto: number
        nombre: string
        cantidad: number
        codigo?: string
      }>
    >
  >({})
  const [editingComboIndex, setEditingComboIndex] = useState<number | null>(null)
  const [editingComboItems, setEditingComboItems] = useState<
    Array<{ id_producto: number; nombre: string; cantidad: number }>
  >([])
  const [modifiedCombos, setModifiedCombos] = useState<Record<string, { items: any[]; newPrice: number }>>({})

  // Calcular el total cuando cambian los detalles
  useEffect(() => {
    const nuevoTotal = detalles.reduce((sum, detalle) => sum + detalle.precio * detalle.cantidad, 0)
    setTotal(nuevoTotal)
  }, [detalles])

  // Función para agregar un producto
  const handleAddProducto = (producto: Producto, cantidad: number, esMayorista: boolean) => {
    // Usar precio mayorista si está seleccionado, de lo contrario usar precio minorista
    const precio = esMayorista && producto.precio_mayorista ? producto.precio_mayorista : producto.precio

    // Verificar si el producto ya está en la lista
    const existingIndex = detalles.findIndex((d) => d.id_producto === producto.id && !d.es_combo)

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      const newDetalles = [...detalles]
      newDetalles[existingIndex].cantidad += cantidad
      setDetalles(newDetalles)
    } else {
      // Si no existe, agregar nuevo detalle
      setDetalles([
        ...detalles,
        {
          id: Date.now(), // ID temporal
          id_venta: ventaId || 0,
          id_producto: producto.id,
          cantidad: cantidad,
          precio: precio,
          es_combo: false,
          es_mayorista: esMayorista,
          producto: producto,
        },
      ])
    }
  }

  // Función para agregar un combo
  const handleAddCombo = (combo: Combo, cantidad: number) => {
    // Verificar si el combo ya está en la lista
    const existingIndex = detalles.findIndex((d) => d.id_producto === combo.id && d.es_combo)

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      const newDetalles = [...detalles]
      newDetalles[existingIndex].cantidad += cantidad
      setDetalles(newDetalles)
    } else {
      // Si no existe, agregar nuevo detalle
      setDetalles([
        ...detalles,
        {
          id: Date.now(), // ID temporal
          id_venta: ventaId || 0,
          id_producto: combo.id,
          cantidad: cantidad,
          precio: combo.precio_venta,
          es_combo: true,
          es_mayorista: false,
          producto: {
            id: combo.id,
            nombre: combo.nombre,
            precio: combo.precio_venta,
            codigo: combo.codigo,
          },
        },
      ])
    }
  }

  // Función para actualizar la cantidad de un detalle
  const handleUpdateCantidad = (id: number, newCantidad: number) => {
    if (newCantidad < 1) return

    const newDetalles = detalles.map((d) => (d.id === id ? { ...d, cantidad: newCantidad } : d))
    setDetalles(newDetalles)
  }

  // Función para eliminar un detalle
  const handleDeleteDetalle = (id: number) => {
    const newDetalles = detalles.filter((d) => d.id !== id)
    setDetalles(newDetalles)
  }

  // Función para cambiar el modo mayorista
  const handleMayoristaChange = (checked: boolean) => {
    setIsMayorista(checked)

    // Actualizar los precios de los productos ya seleccionados
    if (detalles.length > 0) {
      const updatedDetalles = detalles.map((detalle) => {
        if (detalle.tipo === "producto" && detalle.id_producto) {
          const producto = productos.find((p) => p.id.toString() === detalle.id_producto.toString())
          if (producto) {
            const precio = checked && producto.precio_mayorista ? producto.precio_mayorista : producto.precio
            return {
              ...detalle,
              precio,
              es_mayorista: checked,
            }
          }
        }
        return detalle
      })
      setDetalles(updatedDetalles)
    }
  }

  // Función para editar un combo
  const handleEditCombo = async (index: number) => {
    const comboId = detalles[index].id_producto
    if (!comboId) return

    // Si ya estamos editando este combo, cerrarlo
    if (editingComboIndex === index) {
      setEditingComboIndex(null)
      return
    }

    try {
      // Si tenemos detalles modificados para este combo, usarlos
      if (modifiedCombos[comboId]) {
        setEditingComboItems(modifiedCombos[comboId].items)
        setEditingComboIndex(index)
        return
      }

      // Si tenemos detalles en comboDetalles, usarlos
      if (comboDetalles[comboId]) {
        setEditingComboItems(comboDetalles[comboId])
        setEditingComboIndex(index)
        return
      }

      // Si no, obtener los detalles del combo desde la API
      const response = await fetch(`/api/combos/${comboId}`)
      if (response.ok) {
        const comboData = await response.json()
        if (comboData.detalles && comboData.detalles.length > 0) {
          const items = comboData.detalles.map((d: any) => ({
            id_producto: d.id_producto,
            nombre: d.producto?.nombre || `Producto #${d.id_producto}`,
            cantidad: d.cantidad,
          }))
          setEditingComboItems(items)
          setComboDetalles({
            ...comboDetalles,
            [comboId]: items,
          })
        }
      } else {
        toast.error("Error al obtener detalles del combo")
        return
      }

      setEditingComboIndex(index)
    } catch (error) {
      console.error("Error al obtener detalles del combo:", error)
      toast.error("Error al obtener detalles del combo")
    }
  }

  // Función para guardar cambios en un combo
  const handleSaveComboChanges = async (items: any[], updateOriginal: boolean) => {
    if (editingComboIndex === null) return

    const comboId = detalles[editingComboIndex].id_producto
    if (!comboId) return

    try {
      // Calcular nuevo precio basado en los items modificados
      const productPromises = items.map(async (item) => {
        const productResponse = await fetch(`/api/productos/${item.id_producto}`)
        if (!productResponse.ok) throw new Error(`Error fetching product ${item.id_producto}`)
        const product = await productResponse.json()
        return {
          ...item,
          precio: product.precio,
        }
      })

      const productsWithPrices = await Promise.all(productPromises)

      // Calcular nuevo precio (suma simple de todos los productos)
      const newPrice = productsWithPrices.reduce((total, item) => {
        return total + item.precio * item.cantidad
      }, 0)

      // Guardar el combo modificado
      setModifiedCombos({
        ...modifiedCombos,
        [comboId]: {
          items: items,
          newPrice: newPrice,
        },
      })

      // Actualizar el precio en los detalles
      const updatedDetalles = detalles.map((detalle, index) => {
        if (index === editingComboIndex) {
          return {
            ...detalle,
            precio: newPrice,
            combo_modificado: true,
          }
        }
        return detalle
      })
      setDetalles(updatedDetalles)

      // Si el usuario quiere actualizar el combo original
      if (updateOriginal) {
        const updateResponse = await fetch(`/api/combos/${comboId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            detalles: items.map((item) => ({
              id_producto: item.id_producto,
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
      } else {
        toast.success("Combo modificado correctamente")
      }

      setEditingComboIndex(null)
    } catch (error) {
      console.error("Error al guardar cambios del combo:", error)
      toast.error("Error al guardar cambios del combo")
    }
  }

  // Función para agregar un producto al combo en edición
  const handleAddProductToCombo = (productId: number, quantity: number) => {
    const producto = productos.find((p) => p.id === productId)
    if (!producto) {
      toast.error("Producto no encontrado")
      return
    }

    setEditingComboItems([
      ...editingComboItems,
      {
        id_producto: producto.id,
        nombre: producto.nombre,
        cantidad: quantity,
      },
    ])

    toast.success(`Producto ${producto.nombre} agregado al combo`)
  }

  // Función para eliminar un producto del combo en edición
  const handleRemoveProductFromCombo = (productIndex: number) => {
    const newItems = [...editingComboItems]
    newItems.splice(productIndex, 1)
    setEditingComboItems(newItems)
  }

  // Función para actualizar la cantidad de un producto en el combo en edición
  const handleUpdateComboProductQuantity = (productIndex: number, newQuantity: number) => {
    const newItems = editingComboItems.map((item, index) => {
      if (index === productIndex) {
        return { ...item, cantidad: newQuantity }
      }
      return item
    })

    setEditingComboItems(newItems)
  }

  // Preparar los detalles para enviar a la API
  const prepareDetallesForSubmit = () => {
    return detalles.map((detalle) => {
      // Si es un combo modificado, incluir los items
      if (detalle.es_combo && detalle.combo_modificado && modifiedCombos[detalle.id_producto]) {
        return {
          ...detalle,
          combo_modificado: true,
          items: modifiedCombos[detalle.id_producto].items.map((item) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
          })),
        }
      }
      return detalle
    })
  }

  return {
    detalles,
    setDetalles,
    total,
    isMayorista,
    comboDetalles,
    editingComboIndex,
    editingComboItems,
    handleAddProducto,
    handleAddCombo,
    handleUpdateCantidad,
    handleDeleteDetalle,
    handleMayoristaChange,
    handleEditCombo,
    handleSaveComboChanges,
    handleAddProductToCombo,
    handleRemoveProductFromCombo,
    handleUpdateComboProductQuantity,
    prepareDetallesForSubmit,
  }
}

