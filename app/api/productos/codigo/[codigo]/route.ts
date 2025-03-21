import { NextResponse } from "next/server"
import { obtenerProductoPorCodigo } from "@/lib/producto-service"

export async function GET(req: Request, { params }: { params: { codigo: Promise<string> | string } }) {
  try {
    const codigoParam = await params.codigo
    const producto = await obtenerProductoPorCodigo(codigoParam)

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error(`Error al obtener producto por código:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

