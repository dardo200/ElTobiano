import { NextResponse } from "next/server"
import { obtenerHistorialComprasCliente } from "@/lib/cliente-service"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const paramsAwait = await params
    const id = Number.parseInt(paramsAwait.id)
    const historial = await obtenerHistorialComprasCliente(id)

    return NextResponse.json(historial)
  } catch (error) {
    console.error(`Error al obtener historial de compras del cliente con id ${(await params).id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

