import { NextResponse } from "next/server"
import { obtenerComboPorCodigo } from "@/lib/combo-service"

export async function GET(req: Request, { params }: { params: { codigo: string } }) {
  try {
    const codigo = params.codigo
    const combo = await obtenerComboPorCodigo(codigo)

    if (!combo) {
      return NextResponse.json(null)
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error(`Error al obtener combo con código ${params.codigo}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

