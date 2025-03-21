import { NextResponse } from "next/server"
import { obtenerClientePorId, actualizarCliente, eliminarCliente } from "@/lib/cliente-service"

export async function GET(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const cliente = await obtenerClientePorId(id)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error(`Error al obtener cliente:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const body = await req.json()
    const cliente = await actualizarCliente(id, body)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error(`Error al actualizar cliente:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const success = await eliminarCliente(id)

    if (!success) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar cliente:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

