import { NextResponse } from "next/server"
import { obtenerCombos, crearCombo } from "@/lib/combo-service"

export async function GET() {
  try {
    const combos = await obtenerCombos()
    return NextResponse.json(combos)
  } catch (error) {
    console.error("Error al obtener combos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Datos recibidos para crear combo:", body)

    const { detalles, ...comboData } = body

    const combo = await crearCombo(comboData, detalles)
    return NextResponse.json(combo)
  } catch (error) {
    console.error("Error detallado al crear combo:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

