import { NextResponse } from "next/server"
import { obtenerProductoPorId, actualizarProducto, eliminarProducto } from "@/lib/producto-service"

export async function GET(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const producto = await obtenerProductoPorId(id)

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error(`Error al obtener producto:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const body = await req.json()
    const producto = await actualizarProducto(id, body)

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error(`Error al actualizar producto:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const success = await eliminarProducto(id)

    if (!success) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar producto:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

