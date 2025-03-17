import { NextResponse } from "next/server"
import { obtenerProductoPorCodigo } from "@/lib/producto-service"

export async function GET(req: Request, { params }: { params: { codigo: string } }) {
  try {
    const codigo = params.codigo
    const producto = await obtenerProductoPorCodigo(codigo)

    if (!producto) {
      return NextResponse.json(null)
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error(`Error al obtener producto con código ${params.codigo}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

