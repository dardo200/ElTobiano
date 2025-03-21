import { NextResponse } from "next/server"
import { obtenerClientePorId, actualizarCliente, eliminarCliente } from "@/lib/cliente-service"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Usar await params para cumplir con la nueva API de Next.js
    const paramsObj = await params
    const id = Number.parseInt(paramsObj.id)
    const cliente = await obtenerClientePorId(id)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error(`Error al obtener cliente con id ${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Usar await params para cumplir con la nueva API de Next.js
    const paramsObj = await params
    const id = Number.parseInt(paramsObj.id)
    const body = await req.json()
    const cliente = await actualizarCliente(id, body)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error(`Error al actualizar cliente con id ${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Usar await params para cumplir con la nueva API de Next.js
    const paramsObj = await params
    const id = Number.parseInt(paramsObj.id)
    const success = await eliminarCliente(id)

    if (!success) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar cliente con id ${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

