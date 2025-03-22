import { NextResponse } from "next/server"
import { obtenerComboPorId, eliminarCombo } from "@/lib/combo-service"

export async function GET(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Await the entire params object first
    const resolvedParams = await Promise.resolve(params)
    const id = Number.parseInt(resolvedParams.id)
    const combo = await obtenerComboPorId(id)

    if (!combo) {
      return NextResponse.json({ error: "Combo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error(`Error al obtener combo:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de combo inválido" }, { status: 400 })
    }

    const body = await req.json()

    // Update the combo
    const combo = await import("@/lib/combo-service").then((module) =>
      module.actualizarCombo(id, {
        nombre: body.nombre,
        descripcion: body.descripcion,
        precio_venta: body.precio_venta,
        codigo: body.codigo,
      }),
    )

    // If detalles is provided, update the combo details
    if (body.detalles && Array.isArray(body.detalles)) {
      await import("@/lib/combo-service").then((module) => module.actualizarDetallesCombo(id, body.detalles))
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error("Error al actualizar combo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Await the entire params object first
    const resolvedParams = await Promise.resolve(params)
    const id = Number.parseInt(resolvedParams.id)
    const success = await eliminarCombo(id)

    if (!success) {
      return NextResponse.json({ error: "Combo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al eliminar combo:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

