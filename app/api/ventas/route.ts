import { NextResponse } from "next/server"
import { obtenerVentas, obtenerVentasPorEstado, crearVenta } from "@/lib/venta-service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get("estado")

    if (estado) {
      const ventas = await obtenerVentasPorEstado(estado)
      return NextResponse.json(ventas)
    } else {
      const ventas = await obtenerVentas()
      return NextResponse.json(ventas)
    }
  } catch (error) {
    console.error("Error al obtener ventas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Datos recibidos para crear venta:", body)

    const { detalles, ...ventaData } = body

    const venta = await crearVenta(ventaData, detalles)
    return NextResponse.json(venta)
  } catch (error) {
    console.error("Error detallado al crear venta:", error)
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

