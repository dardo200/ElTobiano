import { type NextRequest, NextResponse } from "next/server"
import { obtenerCompraPorId, actualizarCompra, eliminarCompra } from "@/lib/compra-service"

export async function GET(req: NextRequest) {
  try {
    // Get the ID from the query parameter
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      console.error("ID de compra no proporcionado")
      return NextResponse.json({ error: "ID de compra no proporcionado" }, { status: 400 })
    }

    const compraId = Number.parseInt(id)
    console.log(`Obteniendo compra con ID: ${compraId}`)

    const compra = await obtenerCompraPorId(compraId)

    if (!compra) {
      console.error(`Compra con ID ${compraId} no encontrada`)
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json(compra)
  } catch (error) {
    console.error(`Error al obtener compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Get the ID from the query parameter
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      console.error("ID de compra no proporcionado")
      return NextResponse.json({ error: "ID de compra no proporcionado" }, { status: 400 })
    }

    const compraId = Number.parseInt(id)
    console.log(`Actualizando compra con ID: ${compraId}`)

    const body = await req.json()
    console.log("Datos recibidos para actualización:", JSON.stringify(body, null, 2))

    const { detallesActualizados, ...compraData } = body

    // Verificar si hay detalles actualizados
    if (detallesActualizados) {
      console.log("Detalles a actualizar:", JSON.stringify(detallesActualizados, null, 2))
    }

    const compra = await actualizarCompra(compraId, compraData, detallesActualizados)

    if (!compra) {
      console.error(`Compra con ID ${compraId} no encontrada`)
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    console.log("Compra actualizada correctamente")
    return NextResponse.json(compra)
  } catch (error) {
    console.error(`Error al actualizar compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get the ID from the query parameter
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      console.error("ID de compra no proporcionado")
      return NextResponse.json({ error: "ID de compra no proporcionado" }, { status: 400 })
    }

    const compraId = Number.parseInt(id)
    console.log(`Eliminando compra con ID: ${compraId}`)

    const success = await eliminarCompra(compraId)

    if (!success) {
      console.error(`Compra con ID ${compraId} no encontrada`)
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar compra:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

