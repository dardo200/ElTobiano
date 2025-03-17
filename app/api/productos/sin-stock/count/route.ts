import { NextResponse } from "next/server"
import { contarProductosSinStock } from "@/lib/producto-service"

export async function GET() {
  try {
    const count = await contarProductosSinStock()
    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error al contar productos sin stock:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

