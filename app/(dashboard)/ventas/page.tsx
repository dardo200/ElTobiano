"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Venta } from "@/types"
import { columns } from "./columns"

export default function VentasPage() {
  const router = useRouter()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([])
  const [ventasParaEmbalar, setVentasParaEmbalar] = useState<Venta[]>([])
  const [ventasDespachadas, setVentasDespachadas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        // Obtener todas las ventas
        const response = await fetch("/api/ventas")
        if (response.ok) {
          const data = await response.json()
          setVentas(data)
        }

        // Obtener ventas por estado
        const pendientesResponse = await fetch("/api/ventas?estado=Pendiente")
        if (pendientesResponse.ok) {
          const pendientesData = await pendientesResponse.json()
          setVentasPendientes(pendientesData)
        }

        const embalarResponse = await fetch("/api/ventas?estado=Para embalar")
        if (embalarResponse.ok) {
          const embalarData = await embalarResponse.json()
          setVentasParaEmbalar(embalarData)
        }

        const despachadasResponse = await fetch("/api/ventas?estado=Despachado")
        if (despachadasResponse.ok) {
          const despachadasData = await despachadasResponse.json()
          setVentasDespachadas(despachadasData)
        }
      } catch (error) {
        console.error("Error al obtener ventas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVentas()
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Ventas (${ventas.length})`} description="Gestiona las ventas de tu negocio" />
        <Button onClick={() => router.push("/ventas/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>
      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <p className="text-muted-foreground">Cargando ventas...</p>
        </div>
      ) : (
        <Tabs defaultValue="todas" className="mt-4">
          <TabsList>
            <TabsTrigger value="todas">Todas ({ventas.length})</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes ({ventasPendientes.length})</TabsTrigger>
            <TabsTrigger value="embalar">Para Embalar ({ventasParaEmbalar.length})</TabsTrigger>
            <TabsTrigger value="despachadas">Despachadas ({ventasDespachadas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="todas" className="mt-4">
            <DataTable
              columns={columns}
              data={ventas}
              searchKey="cliente_nombre"
              searchPlaceholder="Buscar por cliente..."
            />
          </TabsContent>
          <TabsContent value="pendientes" className="mt-4">
            <DataTable
              columns={columns}
              data={ventasPendientes}
              searchKey="cliente_nombre"
              searchPlaceholder="Buscar por cliente..."
            />
          </TabsContent>
          <TabsContent value="embalar" className="mt-4">
            <DataTable
              columns={columns}
              data={ventasParaEmbalar}
              searchKey="cliente_nombre"
              searchPlaceholder="Buscar por cliente..."
            />
          </TabsContent>
          <TabsContent value="despachadas" className="mt-4">
            <DataTable
              columns={columns}
              data={ventasDespachadas}
              searchKey="cliente_nombre"
              searchPlaceholder="Buscar por cliente..."
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  )
}

