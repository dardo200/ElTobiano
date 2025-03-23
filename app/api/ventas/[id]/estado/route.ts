import { NextResponse } from "next/server"
import { actualizarEstadoVenta } from "@/lib/venta-service"

// Función auxiliar para extraer el ID de la URL
function extractIdFromUrl(request: Request): number | null {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    // El ID está en la posición antepenúltima (ventas/[id]/estado)
    const idStr = pathParts[pathParts.length - 2]
    const id = Number.parseInt(idStr, 10)
    return isNaN(id) ? null : id
  } catch (error) {
    console.error("Error al extraer ID de la URL:", error)
    return null
  }
}

export async function PATCH(request: Request) {
  try {
    const id = extractIdFromUrl(request)

    if (id === null) {
      return NextResponse.json({ error: "ID inválido o no proporcionado" }, { status: 400 })
    }

    const body = await request.json()

    if (!body.estado) {
      return NextResponse.json({ error: "Estado no proporcionado" }, { status: 400 })
    }

    const venta = await actualizarEstadoVenta(id, body.estado)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar estado de venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

