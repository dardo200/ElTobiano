import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verificarUsuario, crearUsuario } from "@/lib/auth-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body

    // Verificar si el usuario existe
    let usuario = await verificarUsuario(username, password)

    // Si no existe, crear un usuario administrador (solo para la primera vez)
    if (!usuario) {
      // Verificar si hay usuarios en la base de datos
      const checkResult = await import("@/lib/db").then((module) =>
        module.executeQuery("SELECT COUNT(*) as count FROM usuarios"),
      )
      const count = Number.parseInt(checkResult.rows[0].count)

      if (count === 0 && username === "admin" && password === "admin") {
        // Crear el primer usuario administrador
        usuario = await crearUsuario("admin", "admin", "admin")
      } else {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
      }
    }

    // Establecer una cookie de sesión
    const cookieStore = await cookies()
    cookieStore.set("user_id", usuario.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    })

    // Guardar el rol del usuario en una cookie
    cookieStore.set("user_role", usuario.rol, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    })

    // Determinar la URL de redirección basada en el rol
    let redirectUrl = "/dashboard"
    if (usuario.rol === "despacho") {
      redirectUrl = "/ventas"
    }

    return NextResponse.json({
      ...usuario,
      redirectUrl,
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

