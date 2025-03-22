"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProveedorForm } from "./components/proveedor-form"
import type { Proveedor } from "@/types"

export default function ProveedorPage() {
  const params = useParams()
  const router = useRouter()
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isNuevo = params.id === "nuevo"

  useEffect(() => {
    if (isNuevo) {
      setIsLoading(false)
      return
    }

    const fetchProveedor = async () => {
      try {
        const response = await fetch(`/api/proveedores/detalles?id=${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProveedor(data)
        } else {
          console.error("Error al obtener el proveedor")
          router.push("/proveedores")
        }
      } catch (error) {
        console.error("Error al obtener el proveedor:", error)
        router.push("/proveedores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProveedor()
  }, [params.id, router, isNuevo])

  const handleDelete = async () => {
    if (!proveedor) return

    if (confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        const response = await fetch(`/api/proveedores/detalles?id=${proveedor.id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          router.push("/proveedores")
        } else {
          alert("Error al eliminar el proveedor")
        }
      } catch (error) {
        console.error("Error al eliminar el proveedor:", error)
        alert("Error al eliminar el proveedor")
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
          title={isNuevo ? "Crear Proveedor" : `Editar Proveedor: ${proveedor?.nombre}`}
          description={isNuevo ? "Agrega un nuevo proveedor" : "Edita los detalles del proveedor"}
        />
        {!isNuevo && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <ProveedorForm initialData={proveedor} />
    </>
  )
}

