import { NextResponse } from "next/server"
import { obtenerProductosStockBajo } from "@/lib/producto-service"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limite = Number.parseInt(url.searchParams.get("limite") || "3")
    const exacto = url.searchParams.get("exacto") === "true"
    const minimo = Number.parseInt(url.searchParams.get("minimo") || "0")

    const productos = await obtenerProductosStockBajo(limite, exacto, minimo)
    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error)
    return NextResponse.json({ error: "Error al obtener productos con stock bajo" }, { status: 500 })
  }
}

