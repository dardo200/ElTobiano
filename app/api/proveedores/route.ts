import { NextResponse } from "next/server"
import { obtenerProveedores, crearProveedor } from "@/lib/proveedor-service"

export async function GET() {
  try {
    const proveedores = await obtenerProveedores()
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const proveedor = await crearProveedor(body)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al crear proveedor:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

