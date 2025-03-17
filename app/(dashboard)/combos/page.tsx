"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import type { Combo } from "@/types"
import { columns } from "./columns"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function CombosPage() {
  const router = useRouter()
  const [combos, setCombos] = useState<Combo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Agregar estado para el término de búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([])

  // Agregar useEffect para filtrar combos
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCombos(combos)
      return
    }

    const filtered = combos.filter(
      (combo) =>
        combo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (combo.codigo && combo.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredCombos(filtered)
  }, [searchTerm, combos])

  // Modificar la parte donde se establece el estado inicial
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const response = await fetch("/api/combos")
        if (response.ok) {
          const data = await response.json()
          setCombos(data)
          setFilteredCombos(data) // Inicializar filteredCombos con todos los combos
        } else {
          console.error("Error al obtener combos")
        }
      } catch (error) {
        console.error("Error al obtener combos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCombos()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Combos (${combos.length})`} description="Gestiona tus combos y promociones" />
        <Button onClick={() => router.push("/combos/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Combo
        </Button>
      </div>
      <Separator className="my-4" />

      {isLoading ? (
        <div className="space-y-4">
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
        </div>
      ) : (
        <>
          <div className="flex items-center py-4">
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DataTable columns={columns} data={filteredCombos} />
        </>
      )}
    </>
  )
}

