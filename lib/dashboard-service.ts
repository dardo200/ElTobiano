import type { DashboardStats } from "@/types"
import { getClient } from "./db"

export async function obtenerEstadisticasDashboard(): Promise<DashboardStats> {
  const client = await getClient()

  try {
    // Total de ventas
    const totalVentasResult = await client.query("SELECT COALESCE(SUM(total), 0) as total FROM Ventas")
    const totalVentas = Number.parseFloat(totalVentasResult.rows[0].total) || 0

    // Total de productos
    const totalProductosResult = await client.query("SELECT COUNT(*) as total FROM Productos")
    const totalProductos = Number.parseInt(totalProductosResult.rows[0].total)

    // Total de clientes
    const totalClientesResult = await client.query("SELECT COUNT(*) as total FROM Clientes")
    const totalClientes = Number.parseInt(totalClientesResult.rows[0].total)

    // Ventas recientes
    const ventasRecientesResult = await client.query(`
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
      LIMIT 5
    `)

    const ventasRecientes = ventasRecientesResult.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))

    // Productos más vendidos
    const productosPopularesResult = await client.query(`
      SELECT p.nombre, SUM(dv.cantidad) as cantidad
      FROM DetalleVentas dv
      JOIN Productos p ON dv.id_producto = p.id
      GROUP BY p.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `)

    const productosPopulares = productosPopularesResult.rows

    // Ventas por mes
    const ventasPorMesResult = await client.query(`
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM') as mes,
        SUM(total) as total
      FROM Ventas
      WHERE fecha >= NOW() - INTERVAL '12 months'
      GROUP BY mes
      ORDER BY mes
    `)

    const ventasPorMes = ventasPorMesResult.rows

    return {
      totalVentas,
      totalProductos,
      totalClientes,
      ventasRecientes,
      productosPopulares,
      ventasPorMes,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error)
    throw error
  } finally {
    client.release() // Liberar la conexión de vuelta al pool
  }
}

