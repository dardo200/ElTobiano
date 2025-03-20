import { NextResponse } from "next/server"
import { actualizarEstadoVenta } from "@/lib/venta-service"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await req.json()
    const { estado } = body

    if (!estado) {
      return NextResponse.json({ error: "El estado es requerido" }, { status: 400 })
    }

    try {
      const venta = await actualizarEstadoVenta(id, estado)

      if (!venta) {
        return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
      }

      return NextResponse.json(venta)
    } catch (error) {
      // Verificar si el error es por falta de stock
      if (error instanceof Error && error.message.includes("Stock insuficiente")) {
        return NextResponse.json(
          {
            error:
              "No hay stock disponible. Por favor, actualice el stock o realice una compra antes de cambiar el estado.",
          },
          { status: 400 },
        )
      }
      throw error
    }
  } catch (error) {
    console.error(`Error al actualizar estado de venta con id ${params.id}:`, error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

