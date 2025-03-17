import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcryptjs from "bcryptjs"
import { executeQuery } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    // Obtener el ID del usuario de la cookie
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el usuario de la base de datos
    const result = await executeQuery("SELECT * FROM usuarios WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const usuario = result.rows[0]

    // Verificar la contraseña actual
    const passwordValido = await bcryptjs.compare(currentPassword, usuario.password)

    if (!passwordValido) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
    }

    // Encriptar la nueva contraseña
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(newPassword, salt)

    // Actualizar la contraseña en la base de datos
    await executeQuery("UPDATE usuarios SET password = $1 WHERE id = $2", [hashedPassword, userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

