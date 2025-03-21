import { NextResponse } from "next/server"
import { obtenerComboPorCodigo } from "@/lib/combo-service"

export async function GET(req: Request, { params }: { params: { codigo: Promise<string> | string } }) {
  try {
    const codigoParam = await params.codigo
    const combo = await obtenerComboPorCodigo(codigoParam)

    if (!combo) {
      return NextResponse.json({ error: "Combo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error(`Error al obtener combo por código:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

