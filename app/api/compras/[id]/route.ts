import { NextResponse } from "next/server"
import { obtenerCompraPorId, actualizarCompra, eliminarCompra } from "@/lib/compra-service"

export async function GET(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    // Await the params.id if it's a Promise
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const compra = await obtenerCompraPorId(id)

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json(compra)
  } catch (error) {
    console.error(`Error al obtener compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: Promise<string> | string } }) {
  try {
    // Await the params.id if it's a Promise
    const idParam = await params.id
    const id = Number.parseInt(idParam)
    const body = await req.json()

    const compra = await actualizarCompra(id, body)

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json(compra)
  } catch (error) {
    console.error(`Error al actualizar compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    // Extraer el ID directamente de la URL
    const url = req.url
    const idMatch = url.match(/\/api\/compras\/(\d+)$/)

    if (!idMatch || !idMatch[1]) {
      return NextResponse.json({ error: "ID de compra no válido" }, { status: 400 })
    }

    const id = Number.parseInt(idMatch[1])

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de compra no válido" }, { status: 400 })
    }

    const success = await eliminarCompra(id)

    if (!success) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

