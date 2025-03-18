import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const result = await executeQuery("SELECT id, usuario, rol FROM usuarios WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error al obtener información del usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

