import { NextResponse } from "next/server"
import { obtenerCompras, crearCompra } from "@/lib/compra-service"

export async function GET() {
  try {
    const compras = await obtenerCompras()
    return NextResponse.json(compras)
  } catch (error) {
    console.error("Error al obtener compras:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { detalles, ...compraData } = body

    const compra = await crearCompra(compraData, detalles)
    return NextResponse.json(compra)
  } catch (error) {
    console.error("Error al crear compra:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

