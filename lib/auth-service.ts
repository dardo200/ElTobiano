import { executeQuery } from "./db"
import bcryptjs from "bcryptjs"
import type { Usuario } from "@/types"

export async function verificarUsuario(username: string, password: string): Promise<Usuario | null> {
  try {
    const result = await executeQuery("SELECT * FROM usuarios WHERE usuario = $1", [username])

    if (result.rows.length === 0) {
      return null
    }

    const usuario = result.rows[0]
    const passwordValido = await bcryptjs.compare(password, usuario.password)

    if (!passwordValido) {
      return null
    }

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = usuario
    return usuarioSinPassword as Usuario
  } catch (error) {
    console.error("Error al verificar usuario:", error)
    throw error
  }
}
export async function getUserById(id: number) {
  const result = await executeQuery("SELECT id, usuario, rol FROM usuarios WHERE id = $1", [id])
  return result.rows[0]
}
export async function crearUsuario(username: string, password: string, rol: string): Promise<Usuario | null> {
  try {
    // Verificar si el usuario ya existe
    const checkResult = await executeQuery("SELECT * FROM usuarios WHERE usuario = $1", [username])

    if (checkResult.rows.length > 0) {
      return null // Usuario ya existe
    }

    // Encriptar la contraseña
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)

    // Crear el usuario
    const result = await executeQuery(
      "INSERT INTO usuarios (usuario, password, rol) VALUES ($1, $2, $3) RETURNING id, usuario, rol",
      [username, hashedPassword, rol],
    )

    return result.rows[0] as Usuario
  } catch (error) {
    console.error("Error al crear usuario:", error)
    throw error
  }
}

