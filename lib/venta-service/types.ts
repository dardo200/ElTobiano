import type { Venta, DetalleVenta } from "@/types"

export interface VentaCreateParams extends Omit<Venta, "id"> {
  detalles: Array<
    Omit<DetalleVenta, "id" | "id_venta"> & {
      es_combo?: boolean
      combo_modificado?: boolean
      items?: { id_producto: number; cantidad: number }[]
    }
  >
}

export interface VentaUpdateParams extends Partial<Venta> {}

export interface DetalleVentaUpdateParams extends DetalleVenta {
  es_combo?: boolean
  datos_combo_modificado?: string
}

