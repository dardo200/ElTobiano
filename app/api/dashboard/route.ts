import { NextResponse } from "next/server"
import { obtenerEstadisticasDashboard } from "@/lib/dashboard-service"

export async function GET() {
  try {
    const stats = await obtenerEstadisticasDashboard()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

