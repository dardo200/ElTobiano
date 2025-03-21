import { NextResponse } from "next/server"
import { obtenerVentaPorId, actualizarVenta, eliminarVenta } from "@/lib/venta-service"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const paramsAwait = await params
    const id = Number.parseInt(paramsAwait.id)
    const venta = await obtenerVentaPorId(id)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al obtener venta con id ${(await params).id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const paramsAwait = await params
    const id = Number.parseInt(paramsAwait.id)
    const body = await req.json()

    const venta = await actualizarVenta(id, body)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar venta con id ${(await params).id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const paramsAwait = await params
    const id = Number.parseInt(paramsAwait.id)
    const success = await eliminarVenta(id)

    if (!success) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar venta con id ${(await params).id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

