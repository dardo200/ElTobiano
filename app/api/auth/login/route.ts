import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verificarUsuario, crearUsuario } from "@/lib/auth-service";
import { executeQuery } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // Verificar si el usuario existe
    let usuario = await verificarUsuario(username, password);

    // Si no existe, crear un usuario administrador (solo para la primera vez)
    if (!usuario) {
      // Verificar si hay usuarios en la base de datos
      const checkResult = await executeQuery("SELECT COUNT(*) as count FROM usuarios");
      const count = Number.parseInt(checkResult.rows[0].count);

      if (count === 0 && username === "admin" && password === "admin") {
        // Crear el primer usuario administrador
        usuario = await crearUsuario("admin", "admin", "admin");
      } else {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }
    }
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }
    // Establecer una cookie de sesión de manera asíncrona
    const cookieStore = cookies();
    (await cookieStore).set("user_id", usuario.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.USE_HTTPS === "true", // Solo seguro en producción con HTTPS
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error en login:", error);

    // Manejo de errores específicos
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}