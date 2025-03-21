import { NextResponse } from "next/server"
import { obtenerHistorialComprasCliente } from "@/lib/cliente-service"

export async function GET(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    const idParam = await params.id
    const id = Number.parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de cliente inválido" }, { status: 400 })
    }

    const historial = await obtenerHistorialComprasCliente(id)

    return NextResponse.json(historial)
  } catch (error) {
    console.error(`Error al obtener historial de compras del cliente:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

