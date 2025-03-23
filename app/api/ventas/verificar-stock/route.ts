import { NextResponse } from "next/server"
import { verificarStockVenta } from "@/lib/venta-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Datos recibidos para verificar stock:", body)

    const { detalles } = body

    const resultado = await verificarStockVenta(detalles)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al verificar stock:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

