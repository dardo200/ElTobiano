import { executeQuery } from "../db"
import type { Venta } from "@/types"

export async function obtenerVentas(): Promise<Venta[]> {
  try {
    const result = await executeQuery(`
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
    `)

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error("Error al obtener ventas:", error)
    throw error
  }
}

export async function obtenerVentasPorEstado(estado: string): Promise<Venta[]> {
  try {
    const result = await executeQuery(
      `
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      WHERE v.estado = $1
      ORDER BY v.fecha DESC
    `,
      [estado],
    )

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error(`Error al obtener ventas con estado ${estado}:`, error)
    throw error
  }
}

export async function obtenerVentasRecientes(limite = 5): Promise<Venta[]> {
  try {
    const result = await executeQuery(
      `
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
      LIMIT $1
    `,
      [limite],
    )

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error(`Error al obtener ventas recientes:`, error)
    throw error
  }
}

export async function contarVentasPendientes(): Promise<number> {
  try {
    const result = await executeQuery(
      `
      SELECT COUNT(*) as count
      FROM Ventas
      WHERE estado IN ('Pendiente', 'Para embalar')
    `,
    )
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error("Error al contar ventas pendientes:", error)
    throw error
  }
}

