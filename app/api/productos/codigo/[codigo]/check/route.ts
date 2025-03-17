import { NextResponse } from "next/server"
import { verificarCodigoExiste } from "@/lib/producto-service"

export async function GET(req: Request, { params }: { params: { codigo: string } }) {
  try {
    const codigo = params.codigo

    if (!codigo) {
      return NextResponse.json({ error: "Código no proporcionado" }, { status: 400 })
    }

    const exists = await verificarCodigoExiste(codigo)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error("Error al verificar código:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

