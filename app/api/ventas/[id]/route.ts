import { NextResponse } from "next/server"
import { obtenerVentaPorId, actualizarVenta, eliminarVenta } from "@/lib/venta-service"

export async function GET(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const venta = await obtenerVentaPorId(id)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al obtener venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const body = await req.json()

    const venta = await actualizarVenta(id, body)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const success = await eliminarVenta(id)

    if (!success) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

