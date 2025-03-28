import { NextResponse } from "next/server"
import { obtenerProveedorPorId, actualizarProveedor, eliminarProveedor } from "@/lib/proveedor-service"

// Helper function to extract ID from URL
function extractIdFromUrl(req: Request): number {
  const url = new URL(req.url)
  const pathParts = url.pathname.split("/")
  const idStr = pathParts[pathParts.length - 1]
  return Number.parseInt(idStr, 10)
}

export async function GET(req: Request) {
  try {
    const id = extractIdFromUrl(req)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de proveedor inválido" }, { status: 400 })
    }

    const proveedor = await obtenerProveedorPorId(id)

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error(`Error al obtener proveedor:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const id = extractIdFromUrl(req)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de proveedor inválido" }, { status: 400 })
    }

    const body = await req.json()
    const proveedor = await actualizarProveedor(id, body)

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error(`Error al actualizar proveedor:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const id = extractIdFromUrl(req)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de proveedor inválido" }, { status: 400 })
    }

    const success = await eliminarProveedor(id)

    if (!success) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar proveedor:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

