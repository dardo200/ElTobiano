import { NextResponse } from "next/server"
import { obtenerVentaPorId, actualizarVenta, eliminarVenta } from "@/lib/venta-service"

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const ventaId = Number.parseInt(id)
    const venta = await obtenerVentaPorId(ventaId)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al obtener venta con id ${context.params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const ventaId = Number.parseInt(id)
    const body = await req.json()

    const venta = await actualizarVenta(ventaId, body)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar venta con id ${context.params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const ventaId = Number.parseInt(id)
    const success = await eliminarVenta(ventaId)

    if (!success) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar venta con id ${context.params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}