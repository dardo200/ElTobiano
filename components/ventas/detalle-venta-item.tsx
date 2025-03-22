"use client"

import { Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DetalleVenta } from "@/types"

interface DetalleVentaItemProps {
  detalle: DetalleVenta & {
    es_combo?: boolean
    es_mayorista?: boolean
    combo_modificado?: boolean
  }
  comboDetalles?: Array<{
    id_producto: number
    nombre: string
    cantidad: number
    codigo?: string
  }>
  onUpdateCantidad: (id: number, cantidad: number) => void
  onDelete: (id: number) => void
}

export function DetalleVentaItem({ detalle, comboDetalles, onUpdateCantidad, onDelete }: DetalleVentaItemProps) {
  return (
    <div className="flex justify-between items-center border-b pb-2">
      <div className="flex-1">
        <div className="flex items-center">
          <div className="font-medium flex items-center">
            {detalle.es_combo && (
              <Badge variant="outline" className="mr-2">
                Combo
              </Badge>
            )}
            {detalle.combo_modificado && (
              <Badge variant="secondary" className="mr-2">
                Modificado
              </Badge>
            )}
            {detalle.es_mayorista && (
              <Badge variant="outline" className="mr-2">
                Mayorista
              </Badge>
            )}
            <span>{detalle.producto?.nombre || `Producto #${detalle.id_producto}`}</span>
          </div>
        </div>
        {detalle.es_combo && comboDetalles && (
          <div className="mt-1 ml-5 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Productos en este combo:</p>
            <ul className="list-disc pl-4">
              {comboDetalles.map((producto, idx) => (
                <li key={idx}>
                  {producto.nombre} ({producto.cantidad} {producto.cantidad > 1 ? "unidades" : "unidad"})
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Precio: ${detalle.precio?.toFixed(2) || "0.00"}</p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onUpdateCantidad(detalle.id, detalle.cantidad - 1)}
            disabled={detalle.cantidad <= 1}
          >
            -
          </Button>
          <span className="w-10 text-center">{detalle.cantidad}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onUpdateCantidad(detalle.id, detalle.cantidad + 1)}
          >
            +
          </Button>
        </div>
        <p className="font-bold w-20 text-right">${(detalle.cantidad * detalle.precio).toFixed(2)}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={() => onDelete(detalle.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

