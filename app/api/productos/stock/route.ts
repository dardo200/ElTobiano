import { NextResponse } from "next/server"
import { obtenerProductoPorCodigo, actualizarStock } from "@/lib/producto-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { codigo, cantidad } = body

    if (!codigo) {
      return NextResponse.json({ error: "El código de barras es obligatorio" }, { status: 400 })
    }

    if (cantidad === undefined || cantidad === null) {
      return NextResponse.json({ error: "La cantidad es obligatoria" }, { status: 400 })
    }

    // Obtener el producto por código de barras
    const producto = await obtenerProductoPorCodigo(codigo)
    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Actualizar el stock
    const actualizado = await actualizarStock(producto.id, cantidad)
    if (!actualizado) {
      return NextResponse.json({ error: "Error al actualizar el stock" }, { status: 500 })
    }

    // Obtener el producto actualizado
    const productoActualizado = await obtenerProductoPorCodigo(codigo)

    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error("Error al actualizar stock:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

