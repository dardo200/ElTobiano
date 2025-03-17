import { NextResponse } from "next/server"
import { obtenerProductosStockBajo } from "@/lib/producto-service"

export async function GET() {
  try {
    const productos = await obtenerProductosStockBajo(2) // Productos con stock menor a 2
    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

