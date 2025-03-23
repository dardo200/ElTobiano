import { NextResponse } from "next/server"
import { obtenerComboPorCodigo } from "@/lib/combo-service"

export async function GET(request: Request, { params }: { params: { codigo: string } }) {
  try {
    // Extraer el código de la URL como alternativa
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const codigoParam = pathParts[pathParts.length - 1]

    const combo = await obtenerComboPorCodigo(codigoParam)

    if (!combo) {
      return new NextResponse(JSON.stringify({ error: "Combo no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return NextResponse.json(combo)
  } catch (error) {
    console.error("Error al obtener combo por código:", error)
    return new NextResponse(JSON.stringify({ error: "Error al obtener combo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

