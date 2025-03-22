import { NextResponse } from "next/server"
import { obtenerComboPorId, actualizarCombo, eliminarCombo } from "@/lib/combo-service"

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

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Await the entire params object first
    const resolvedParams = await Promise.resolve(params)
    const id = Number.parseInt(resolvedParams.id)
    const body = await req.json()
    const { detalles, ...comboData } = body

    const combo = await actualizarCombo(id, comboData, detalles)

    if (!combo) {
      return NextResponse.json({ error: "Combo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error(`Error al actualizar combo:`, error)
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

