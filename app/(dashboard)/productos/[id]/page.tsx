"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProductoForm } from "./components/producto-form"
import type { Producto } from "@/types"

export default function ProductoPage() {
  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isNuevo = params.id === "nuevo"

  useEffect(() => {
    if (isNuevo) {
      setIsLoading(false)
      return
    }

    const fetchProducto = async () => {
      try {
        const response = await fetch(`/api/productos/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProducto(data)
        } else {
          console.error("Error al obtener el producto")
          router.push("/productos")
        }
      } catch (error) {
        console.error("Error al obtener el producto:", error)
        router.push("/productos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducto()
  }, [params.id, router, isNuevo])

  const handleDelete = async () => {
    if (!producto) return

    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        const response = await fetch(`/api/productos/${producto.id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          router.push("/productos")
        } else {
          alert("Error al eliminar el producto")
        }
      } catch (error) {
        console.error("Error al eliminar el producto:", error)
        alert("Error al eliminar el producto")
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
          title={isNuevo ? "Crear Producto" : `Editar Producto: ${producto?.nombre}`}
          description={isNuevo ? "Agrega un nuevo producto al catálogo" : "Edita los detalles del producto"}
        />
        {!isNuevo && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <ProductoForm initialData={producto} />
    </>
  )
}

