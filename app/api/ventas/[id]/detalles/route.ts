import { NextResponse } from "next/server"
import { actualizarDetallesVenta } from "@/lib/venta-service"
import type { DetalleVenta } from "@/types"

export async function PUT(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de venta inválido" }, { status: 400 })
    }

    const detalles = (await req.json()) as Array<DetalleVenta & { es_combo?: boolean }>

    const venta = await actualizarDetallesVenta(id, detalles)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar detalles de venta:`, error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

