"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import type { Cliente } from "@/types"
import { columns } from "./columns"

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("/api/clientes")
        if (response.ok) {
          const data = await response.json()
          setClientes(data)
        } else {
          console.error("Error al obtener clientes")
        }
      } catch (error) {
        console.error("Error al obtener clientes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientes()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Clientes (${clientes.length})`} description="Gestiona la información de tus clientes" />
        <Button onClick={() => router.push("/clientes/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>
      <Separator />
      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={clientes} searchKey="nombre" searchPlaceholder="Buscar clientes..." />
      )}
    </>
  )
}

