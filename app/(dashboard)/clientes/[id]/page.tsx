"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ClienteForm } from "./components/cliente-form"
import type { Cliente } from "@/types"

export default function ClientePage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isNuevo = params.id === "nuevo"

  useEffect(() => {
    if (isNuevo) {
      setIsLoading(false)
      return
    }

    const fetchCliente = async () => {
      try {
        const response = await fetch(`/api/clientes/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCliente(data)
        } else {
          console.error("Error al obtener el cliente")
          router.push("/clientes")
        }
      } catch (error) {
        console.error("Error al obtener el cliente:", error)
        router.push("/clientes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCliente()
  }, [params.id, router, isNuevo])

  const handleDelete = async () => {
    if (!cliente) return

    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      try {
        const response = await fetch(`/api/clientes/${cliente.id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          router.push("/clientes")
        } else {
          alert("Error al eliminar el cliente")
        }
      } catch (error) {
        console.error("Error al eliminar el cliente:", error)
        alert("Error al eliminar el cliente")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={isNuevo ? "Crear Cliente" : `Editar Cliente: ${cliente?.nombre}`}
          description={isNuevo ? "Agrega un nuevo cliente" : "Edita los detalles del cliente"}
        />
        {!isNuevo && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <ClienteForm initialData={cliente} />
    </>
  )
}

