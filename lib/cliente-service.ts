import { executeQuery } from "./db"
import type { Cliente } from "@/types"

export async function obtenerClientes(): Promise<Cliente[]> {
  try {
    const result = await executeQuery("SELECT * FROM Clientes ORDER BY nombre")
    return result.rows
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    throw error
  }
}

export async function obtenerClientePorId(id: number): Promise<Cliente | null> {
  try {
    const result = await executeQuery("SELECT * FROM Clientes WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al obtener cliente con id ${id}:`, error)
    throw error
  }
}

export async function crearCliente(cliente: Omit<Cliente, "id">): Promise<Cliente> {
  try {
    // Actualizar la consulta para incluir los nuevos campos
    const result = await executeQuery(
      `INSERT INTO Clientes (
        nombre, email, telefono, direccion, dni, provincia, ciudad, cp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        cliente.nombre,
        cliente.email,
        cliente.telefono,
        cliente.direccion,
        cliente.dni || null,
        cliente.provincia || null,
        cliente.ciudad || null,
        cliente.cp || null,
      ],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error al crear cliente:", error)
    throw error
  }
}

export async function actualizarCliente(id: number, cliente: Partial<Cliente>): Promise<Cliente | null> {
  try {
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (cliente.nombre !== undefined) {
      updateFields.push(`nombre = $${paramIndex}`)
      updateValues.push(cliente.nombre)
      paramIndex++
    }

    if (cliente.email !== undefined) {
      updateFields.push(`email = $${paramIndex}`)
      updateValues.push(cliente.email)
      paramIndex++
    }

    if (cliente.telefono !== undefined) {
      updateFields.push(`telefono = $${paramIndex}`)
      updateValues.push(cliente.telefono)
      paramIndex++
    }

    if (cliente.direccion !== undefined) {
      updateFields.push(`direccion = $${paramIndex}`)
      updateValues.push(cliente.direccion)
      paramIndex++
    }

    // Agregar los nuevos campos
    if (cliente.dni !== undefined) {
      updateFields.push(`dni = $${paramIndex}`)
      updateValues.push(cliente.dni || null)
      paramIndex++
    }

    if (cliente.provincia !== undefined) {
      updateFields.push(`provincia = $${paramIndex}`)
      updateValues.push(cliente.provincia || null)
      paramIndex++
    }

    if (cliente.ciudad !== undefined) {
      updateFields.push(`ciudad = $${paramIndex}`)
      updateValues.push(cliente.ciudad || null)
      paramIndex++
    }

    if (cliente.cp !== undefined) {
      updateFields.push(`cp = $${paramIndex}`)
      updateValues.push(cliente.cp || null)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return null
    }

    updateValues.push(id)

    const result = await executeQuery(
      `UPDATE Clientes SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      updateValues,
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al actualizar cliente con id ${id}:`, error)
    throw error
  }
}

export async function eliminarCliente(id: number): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM Clientes WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al eliminar cliente con id ${id}:`, error)
    throw error
  }
}

export async function buscarClientes(termino: string): Promise<Cliente[]> {
  try {
    const result = await executeQuery(
      "SELECT * FROM Clientes WHERE nombre ILIKE $1 OR email ILIKE $1 OR telefono ILIKE $1 ORDER BY nombre",
      [`%${termino}%`],
    )

    return result.rows
  } catch (error) {
    console.error(`Error al buscar clientes con término "${termino}":`, error)
    throw error
  }
}

export async function obtenerHistorialComprasCliente(id: number): Promise<any[]> {
  try {
    const result = await executeQuery(
      `
      SELECT v.*, COUNT(dv.id) as cantidad_productos
      FROM Ventas v
      LEFT JOIN DetalleVentas dv ON v.id = dv.id_venta
      WHERE v.id_cliente = $1
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `,
      [id],
    )

    return result.rows
  } catch (error) {
    console.error(`Error al obtener historial de compras del cliente con id ${id}:`, error)
    throw error
  }
}

