import { NextResponse } from "next/server"
import { obtenerProveedorPorId, actualizarProveedor, eliminarProveedor } from "@/lib/proveedor-service"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get("id")

    if (!idParam) {
      return NextResponse.json({ error: "ID de proveedor no proporcionado" }, { status: 400 })
    }

    const id = Number.parseInt(idParam)
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
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get("id")

    if (!idParam) {
      return NextResponse.json({ error: "ID de proveedor no proporcionado" }, { status: 400 })
    }

    const id = Number.parseInt(idParam)
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
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get("id")

    if (!idParam) {
      return NextResponse.json({ error: "ID de proveedor no proporcionado" }, { status: 400 })
    }

    const id = Number.parseInt(idParam)
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

