import { NextResponse } from "next/server"
import { obtenerVentaPorId } from "@/lib/venta-service"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de venta inválido" }, { status: 400 })
    }

    const venta = await obtenerVentaPorId(id)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    // Devolver la venta para que el cliente genere el PDF
    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al obtener datos para presupuesto de venta ${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

