import { NextResponse } from "next/server"
import { contarVentasPendientes } from "@/lib/venta-service"

export async function GET() {
  try {
    const count = await contarVentasPendientes()
    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error al contar ventas pendientes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

