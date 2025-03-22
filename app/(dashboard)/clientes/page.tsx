"use client"

import { useEffect, useState, useCallback } from "react"
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

  const fetchClientes = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Función para eliminar un cliente y actualizar la lista
  const handleDeleteCliente = async (id: number) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Actualizar el estado local eliminando el cliente
        setClientes((prevClientes) => prevClientes.filter((cliente) => cliente.id !== id))
        return true
      }
      return false
    } catch (error) {
      console.error("Error al eliminar el cliente:", error)
      return false
    }
  }

  // Función personalizada de filtrado para buscar por nombre o DNI
  const filterFunction = (row: Cliente, filterValue: string) => {
    const searchTerm = filterValue.toLowerCase()
    const matchesNombre = row.nombre?.toLowerCase().includes(searchTerm) || false
    const matchesDNI = row.dni?.toLowerCase().includes(searchTerm) || false
    const matchesEmail = row.email?.toLowerCase().includes(searchTerm) || false
    const matchesTelefono = row.telefono?.toLowerCase().includes(searchTerm) || false

    return matchesNombre || matchesDNI || matchesEmail || matchesTelefono
  }

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
        <DataTable
          columns={columns}
          data={clientes}
          searchKey="nombre"
          searchPlaceholder="Buscar por nombre, DNI, email o teléfono..."
          deleteRow={handleDeleteCliente}
          filterFunction={filterFunction}
        />
      )}
    </>
  )
}

