import { executeQuery } from "./db"
import type { Proveedor } from "@/types"

export async function obtenerProveedores(): Promise<Proveedor[]> {
  try {
    const result = await executeQuery("SELECT * FROM Proveedor ORDER BY nombre")
    return result.rows
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    throw error
  }
}

export async function obtenerProveedorPorId(id: number): Promise<Proveedor | null> {
  try {
    const result = await executeQuery("SELECT * FROM Proveedor WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al obtener proveedor con id ${id}:`, error)
    throw error
  }
}

export async function crearProveedor(proveedor: Omit<Proveedor, "id">): Promise<Proveedor> {
  try {
    const result = await executeQuery(
      "INSERT INTO Proveedor (nombre, telefono, email, direccion) VALUES ($1, $2, $3, $4) RETURNING *",
      [proveedor.nombre, proveedor.telefono, proveedor.email, proveedor.direccion],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error al crear proveedor:", error)
    throw error
  }
}

export async function actualizarProveedor(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor | null> {
  try {
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (proveedor.nombre !== undefined) {
      updateFields.push(`nombre = $${paramIndex}`)
      updateValues.push(proveedor.nombre)
      paramIndex++
    }

    if (proveedor.telefono !== undefined) {
      updateFields.push(`telefono = $${paramIndex}`)
      updateValues.push(proveedor.telefono)
      paramIndex++
    }

    if (proveedor.email !== undefined) {
      updateFields.push(`email = $${paramIndex}`)
      updateValues.push(proveedor.email)
      paramIndex++
    }

    if (proveedor.direccion !== undefined) {
      updateFields.push(`direccion = $${paramIndex}`)
      updateValues.push(proveedor.direccion)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return null
    }

    updateValues.push(id)

    const result = await executeQuery(
      `UPDATE Proveedor SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      updateValues,
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al actualizar proveedor con id ${id}:`, error)
    throw error
  }
}

export async function eliminarProveedor(id: number): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM Proveedor WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al eliminar proveedor con id ${id}:`, error)
    throw error
  }
}

