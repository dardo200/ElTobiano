import type { DetalleVenta } from "@/types"

/**
 * Calcula el total de una venta a partir de sus detalles
 */
export function calcularTotalVenta(detalles: DetalleVenta[]): number {
  return detalles.reduce((total, detalle) => {
    const precio = detalle.precio || 0
    const cantidad = detalle.cantidad || 0
    return total + precio * cantidad
  }, 0)
}

/**
 * Verifica si un combo ha sido modificado
 */
export function esComboModificado(detalle: DetalleVenta): boolean {
  return Boolean(detalle.es_combo && detalle.datos_combo_modificado)
}

/**
 * Parsea los datos de un combo modificado
 */
export function parsearDatosComboModificado(detalle: DetalleVenta): any[] {
  if (!detalle.datos_combo_modificado) return []

  try {
    return JSON.parse(detalle.datos_combo_modificado)
  } catch (error) {
    console.error("Error al parsear datos_combo_modificado:", error)
    return []
  }
}

