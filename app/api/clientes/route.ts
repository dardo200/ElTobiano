import { NextResponse } from "next/server"
import { obtenerClientes, crearCliente } from "@/lib/cliente-service"

export async function GET() {
  try {
    const clientes = await obtenerClientes()
    return NextResponse.json(clientes)
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cliente = await crearCliente(body)
    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

