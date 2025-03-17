"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ComboForm } from "./components/combo-form"
import type { Combo, Producto } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ComboPage() {
  const params = useParams()
  const router = useRouter()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isNuevo = params.id === "nuevo"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener productos
        const productosResponse = await fetch("/api/productos")
        if (productosResponse.ok) {
          const productosData = await productosResponse.json()
          setProductos(productosData)
        }

        if (!isNuevo) {
          // Obtener combo
          const comboResponse = await fetch(`/api/combos/${params.id}`)
          if (comboResponse.ok) {
            const comboData = await comboResponse.json()
            setCombo(comboData)
          } else {
            console.error("Error al obtener el combo")
            router.push("/combos")
          }
        }
      } catch (error) {
        console.error("Error al obtener datos:", error)
        if (!isNuevo) {
          router.push("/combos")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, isNuevo])

  const handleDelete = async () => {
    if (!combo) return

    if (confirm("¿Estás seguro de que deseas eliminar este combo?")) {
      try {
        const response = await fetch(`/api/combos/${combo.id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          router.push("/combos")
        } else {
          alert("Error al eliminar el combo")
        }
      } catch (error) {
        console.error("Error al eliminar el combo:", error)
        alert("Error al eliminar el combo")
      }
    }
  }

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <Heading
            title={isNuevo ? "Crear Combo" : "Editar Combo"}
            description={isNuevo ? "Agrega un nuevo combo" : "Edita los detalles del combo"}
          />
        </div>
        <Separator className="my-4" />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={isNuevo ? "Crear Combo" : `Editar Combo: ${combo?.nombre}`}
          description={isNuevo ? "Agrega un nuevo combo" : "Edita los detalles del combo"}
        />
        {!isNuevo && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator className="my-4" />
      <ComboForm initialData={combo} productos={productos} />
    </>
  )
}

