"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Producto, Combo } from "@/types"

export function useProductSearch(
  productos: Producto[],
  combos: Combo[],
  isMayorista: boolean,
  append: (value: any) => void,
) {
  const [searchCode, setSearchCode] = useState("")

  const handleScanBarcode = (
    index: number,
    form: any,
    activeTabsState: Record<number, "producto" | "combo">,
    setActiveTabsState: (value: Record<number, "producto" | "combo">) => void,
  ) => {
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

  return {
    searchCode,
    setSearchCode,
    handleScanBarcode,
    handleSearchByCode,
  }
}

