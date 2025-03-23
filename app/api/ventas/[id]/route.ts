import { NextResponse } from "next/server"
import { actualizarVenta, eliminarVenta, obtenerVentaPorId } from "@/lib/venta-service"

// Función auxiliar para extraer el ID de la URL
function extractIdFromUrl(request: Request): number | null {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const idStr = pathParts[pathParts.length - 1]
    const id = Number.parseInt(idStr, 10)
    return isNaN(id) ? null : id
  } catch (error) {
    console.error("Error al extraer ID de la URL:", error)
    return null
  }
}

export async function GET(request: Request) {
  try {
    const id = extractIdFromUrl(request)

    if (id === null) {
      return NextResponse.json({ error: "ID inválido o no proporcionado" }, { status: 400 })
    }

    const venta = await obtenerVentaPorId(id)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al obtener venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const id = extractIdFromUrl(request)

    if (id === null) {
      return NextResponse.json({ error: "ID inválido o no proporcionado" }, { status: 400 })
    }

    const body = await request.json()
    const venta = await actualizarVenta(id, body)

    if (!venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json(venta)
  } catch (error) {
    console.error(`Error al actualizar venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const id = extractIdFromUrl(request)

    if (id === null) {
      return NextResponse.json({ error: "ID inválido o no proporcionado" }, { status: 400 })
    }

    const success = await eliminarVenta(id)

    if (!success) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar venta:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

