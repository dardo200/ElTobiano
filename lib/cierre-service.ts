import { executeQuery } from "./db"
import type { CierreDia } from "@/types"

export async function obtenerCierresDia(): Promise<CierreDia[]> {
  try {
    const result = await executeQuery("SELECT * FROM CierresDia ORDER BY fecha DESC")
    return result.rows
  } catch (error) {
    console.error("Error al obtener cierres del día:", error)
    throw error
  }
}

export async function obtenerCierreDiaPorId(id: number): Promise<CierreDia | null> {
  try {
    const result = await executeQuery("SELECT * FROM CierresDia WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al obtener cierre del día con id ${id}:`, error)
    throw error
  }
}

export async function crearCierreDia(fecha: string): Promise<CierreDia | null> {
  const client = await import("./db").then((module) => module.getClient())
  try {
    await client.query("BEGIN")

    // Verificar si ya existe un cierre para esta fecha
    const checkResult = await client.query("SELECT * FROM CierresDia WHERE fecha = $1", [fecha])

    if (checkResult.rows.length > 0) {
      await client.query("ROLLBACK")
      return null // Ya existe un cierre para esta fecha
    }

    // Calcular el total de ventas para la fecha
    const ventasResult = await client.query(
      "SELECT COALESCE(SUM(total), 0) as total_ventas FROM Ventas WHERE fecha::date = $1::date",
      [fecha],
    )

    const totalVentas = Number.parseFloat(ventasResult.rows[0].total_ventas)

    // Calcular el total de compras para la fecha
    const comprasResult = await client.query(
      "SELECT COALESCE(SUM(total), 0) as total_compras FROM Compras WHERE fecha::date = $1::date",
      [fecha],
    )

    const totalCompras = Number.parseFloat(comprasResult.rows[0].total_compras)

    // Calcular las ganancias
    const ganancias = totalVentas - totalCompras

    // Crear el cierre del día
    const cierreResult = await client.query(
      "INSERT INTO CierresDia (fecha, total_ventas, total_compras, ganancias) VALUES ($1, $2, $3, $4) RETURNING *",
      [fecha, totalVentas, totalCompras, ganancias],
    )

    // Marcar las ventas como cerradas
    await client.query("UPDATE Ventas SET cerrado = true WHERE fecha::date = $1::date", [fecha])

    await client.query("COMMIT")

    return cierreResult.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(`Error al crear cierre del día para la fecha ${fecha}:`, error)
    throw error
  } finally {
    client.release() // Liberar la conexión de vuelta al pool
  }
}