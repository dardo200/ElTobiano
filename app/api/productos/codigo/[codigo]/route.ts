import { NextResponse } from "next/server"
import { obtenerProductoPorCodigo } from "@/lib/producto-service"

export async function GET(request: Request, { params }: { params: { codigo: string } }) {
  try {
    // Extraer el código de la URL como alternativa
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const codigoParam = pathParts[pathParts.length - 1]

    const producto = await obtenerProductoPorCodigo(codigoParam)

    if (!producto) {
      return new NextResponse(JSON.stringify({ error: "Producto no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error("Error al obtener producto por código:", error)
    return new NextResponse(JSON.stringify({ error: "Error al obtener producto" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

