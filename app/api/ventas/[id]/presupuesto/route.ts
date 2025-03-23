import { NextResponse } from "next/server"

// Función auxiliar para extraer y validar el ID
const getValidId = (params: any): number | null => {
  try {
    if (!params || !params.id) return null
    const id = Number.parseInt(String(params.id), 10)
    return isNaN(id) ? null : id
  } catch (error) {
    return null
  }
}

export async function GET(request: Request, { params }: { params: any }) {
  try {
    const id = getValidId(params)

    if (id === null) {
      return NextResponse.json({ error: "ID inválido o no proporcionado" }, { status: 400 })
    }

    // Resto del código...

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al generar presupuesto:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

