import { NextResponse } from "next/server"
import { actualizarDetallesVenta } from "@/lib/venta-service"
import type { DetalleVenta } from "@/types"

export async function PUT(req: Request) {
  try {
    // Get the ID from the URL query parameters
    const url = new URL(req.url)
    const idString = url.searchParams.get("id")

    console.log("API endpoint called with ID:", idString)

    if (!idString) {
      console.log("ID de venta no proporcionado")
      return NextResponse.json({ error: "ID de venta no proporcionado" }, { status: 400 })
    }

    const id = Number.parseInt(idString, 10)

    if (isNaN(id)) {
      console.log("ID de venta inválido:", idString)
      return NextResponse.json({ error: "ID de venta inválido" }, { status: 400 })
    }

    // Parse the request body
    let detalles
    try {
      detalles = (await req.json()) as Array<DetalleVenta & { es_combo?: boolean }>
      console.log("Detalles recibidos:", detalles.length)
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        {
          error: "Error al procesar los detalles de la venta",
          details: error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 400 },
      )
    }

    console.log("Actualizando detalles para venta ID:", id)
    const venta = await actualizarDetallesVenta(id, detalles)

    if (!venta) {
      console.log("Venta no encontrada con ID:", id)
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    console.log("Venta actualizada correctamente:", id)
    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar detalles de venta:`, error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

