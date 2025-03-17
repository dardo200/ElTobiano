"use client"

import { Button } from "@/components/ui/button"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DashboardStats, Venta, Producto } from "@/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, Package, Users, ShoppingCart, AlertCircle, TruckIcon, ArchiveIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([])
  const [productosStockBajo, setProductosStockBajo] = useState<Producto[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener estadísticas generales
        const statsResponse = await fetch("/api/dashboard")
        if (!statsResponse.ok) {
          throw new Error("Error al cargar las estadísticas")
        }
        const statsData = await statsResponse.json()
        setStats(statsData)

        // Obtener ventas pendientes de despacho
        const ventasResponse = await fetch("/api/ventas?estado=Para embalar")
        if (!ventasResponse.ok) {
          throw new Error("Error al cargar las ventas pendientes")
        }
        const ventasData = await ventasResponse.json()
        setVentasPendientes(ventasData)

        // Obtener productos con stock bajo
        const productosResponse = await fetch("/api/productos/stock-bajo")
        if (!productosResponse.ok) {
          throw new Error("Error al cargar los productos con stock bajo")
        }
        const productosData = await productosResponse.json()
        setProductosStockBajo(productosData)
      } catch (error) {
        console.error("Error al obtener datos:", error)
        setError("Ocurrió un error al cargar los datos")
        toast.error("Error al cargar los datos del dashboard")
      } finally {
        // Establecer un timeout para mostrar el estado de carga por al menos 500ms
        // para evitar parpadeos en conexiones rápidas
        const minLoadingTime = 500
        setTimeout(() => {
          setIsLoading(false)
        }, minLoadingTime)
      }
    }

    fetchData()
  }, [])

  const handleCardClick = (route: string) => {
    router.push(route)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Heading title="Dashboard" description="Resumen general del sistema" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <Heading title="Dashboard" description="Resumen general del sistema" />
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Error al cargar datos</h2>
            <p className="text-muted-foreground">{error || "No se pudieron cargar las estadísticas"}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Intentar nuevamente
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Asegurarse de que los datos existan para evitar errores
  const ventasPorMes = stats.ventasPorMes || []
  const productosPopulares = stats.productosPopulares || []
  const ventasRecientes = stats.ventasRecientes || []

  return (
    <div className="space-y-6">
      <Heading title="Dashboard" description="Resumen general del sistema" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/ventas")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalVentas.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("/productos")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProductos || 0}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/clientes")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClientes || 0}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick("/ventas")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Recientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ventasRecientes.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Ventas Pendientes de Despacho */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ventas Pendientes de Despacho</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleCardClick("/ventas?estado=Para embalar")}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent>
          {ventasPendientes.length > 0 ? (
            <div className="space-y-4">
              {ventasPendientes.slice(0, 5).map((venta) => (
                <div key={venta.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Venta #{venta.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {venta.cliente?.nombre || "Cliente no registrado"}
                    </p>
                    <p className="text-sm text-muted-foreground">Fecha: {new Date(venta.fecha).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-bold">${venta.total.toFixed(2)}</p>
                    <Badge variant="secondary">Para embalar</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/ventas/${venta.id}`)
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay ventas pendientes de despacho</p>
          )}
        </CardContent>
      </Card>

      {/* Sección de Productos con Stock Bajo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Productos con Stock Bajo</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleCardClick("/productos")}>
            <ArchiveIcon className="mr-2 h-4 w-4" />
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          {productosStockBajo.length > 0 ? (
            <div className="space-y-4">
              {productosStockBajo.map((producto) => (
                <div key={producto.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{producto.nombre}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{producto.descripcion}</p>
                    <p className="text-sm text-muted-foreground">Código: {producto.codigo}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-bold">${producto.precio.toFixed(2)}</p>
                    <Badge variant="destructive">Stock: {producto.stock}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/productos/${producto.id}`)
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay productos con stock bajo</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="ventas">
        <TabsList>
          <TabsTrigger value="ventas">Ventas por Mes</TabsTrigger>
          <TabsTrigger value="productos">Productos Populares</TabsTrigger>
        </TabsList>
        <TabsContent value="ventas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Mes</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {ventasPorMes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ventasPorMes}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de ventas disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {productosPopulares.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productosPopulares}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nombre" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de productos populares disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

