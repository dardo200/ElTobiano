import { NextResponse } from "next/server"
import { obtenerProductos, crearProducto } from "@/lib/producto-service"

export async function GET() {
  try {
    const productos = await obtenerProductos()
    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Datos recibidos para crear producto:", body)

    const producto = await crearProducto(body)
    return NextResponse.json(producto)
  } catch (error) {
    console.error("Error detallado al crear producto:", error)
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

