"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { NuevaVentaForm } from "./components/nueva-venta-form"
import type { Cliente, Producto } from "@/types"

export default function NuevaVentaPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener clientes
        const clientesResponse = await fetch("/api/clientes")
        if (clientesResponse.ok) {
          const clientesData = await clientesResponse.json()
          setClientes(clientesData)
        }

        // Obtener productos
        const productosResponse = await fetch("/api/productos")
        if (productosResponse.ok) {
          const productosData = await productosResponse.json()
          setProductos(productosData)
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      <Heading title="Nueva Venta" description="Registra una nueva venta" />
      <Separator />
      <NuevaVentaForm clientes={clientes} productos={productos} />
    </>
  )
}

