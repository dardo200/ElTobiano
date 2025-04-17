import { NextResponse } from "next/server"
import { obtenerUltimoCodigoBarras } from "@/lib/producto-service"

export async function GET() {
  try {
    const ultimoCodigo = await obtenerUltimoCodigoBarras()
    return NextResponse.json({ ultimoCodigo })
  } catch (error) {
    console.error("Error al obtener el último código de barras:", error)
    return NextResponse.json({ error: "Error al obtener el último código de barras" }, { status: 500 })
  }
}
