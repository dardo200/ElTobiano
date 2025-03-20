import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Eliminar la cookie de sesión
    cookies().delete("user_id")

    // Eliminar la cookie de rol
    cookies().delete("user_role")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

