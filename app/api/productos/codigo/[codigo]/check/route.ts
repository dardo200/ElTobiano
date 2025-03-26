import { NextResponse } from "next/server"
import { verificarCodigoExiste } from "@/lib/producto-service"

export async function GET(request: Request, { params }: { params: { codigo: string } }) {
  try {
    // En Next.js 15, extraemos el código directamente de la URL
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    const codigoIndex = segments.findIndex((segment) => segment === "codigo") + 1
    const codigoParam = segments[codigoIndex]

    if (!codigoParam) {
      return NextResponse.json({ error: "Código no proporcionado" }, { status: 400 })
    }

    const exists = await verificarCodigoExiste(codigoParam)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error al verificar código:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

