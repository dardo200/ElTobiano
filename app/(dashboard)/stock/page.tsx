"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { PlusCircle, MinusCircle, Layers, Search, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { Badge } from "@/components/ui/badge"

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  codigo: string
  precio_compra: number
  precio_mayorista: number
  codigo_proveedor: string
  stock: number
}

export default function StockPage() {
  const { toast } = useToast()
  const [operacion, setOperacion] = useState<"sumar" | "restar">("sumar")
  const [codigo, setCodigo] = useState("")
  const [historial, setHistorial] = useState<Producto[]>([])
  const [ultimoProducto, setUltimoProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(false)
  const [totalModificados, setTotalModificados] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enfocar el input al cargar la página
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Enfocar el input después de procesar un código
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [historial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!codigo.trim()) {
      toast({
        title: "Error",
        description: "Ingrese un código de barras",
        variant: "destructive",
      })
      return
    }

    setCargando(true)

    try {
      const cantidad = operacion === "sumar" ? 1 : -1

      const response = await fetch("/api/productos/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo, cantidad }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar el stock")
      }

      const productoActualizado = await response.json()

      // Actualizar el historial
      setHistorial((prev) => [productoActualizado, ...prev].slice(0, 10))
      setUltimoProducto(productoActualizado)
      setTotalModificados((prev) => prev + 1)

      // Limpiar el campo de código
      setCodigo("")

      // Mostrar notificación
      toast({
        title: "Stock actualizado",
        description: `${productoActualizado.nombre}: ${operacion === "sumar" ? "+" : "-"}1 (Total: ${productoActualizado.stock})`,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el stock",
        variant: "destructive",
      })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title="Gestión de Stock"
          description="Actualice el stock de productos con el lector de códigos de barras"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-5 w-5" />
                Actualizar Stock
              </CardTitle>
              <CardDescription>Escanee códigos de barras para actualizar el stock</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Operación</Label>
                  <RadioGroup
                    defaultValue="sumar"
                    value={operacion}
                    onValueChange={(value) => setOperacion(value as "sumar" | "restar")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sumar" id="sumar" />
                      <Label htmlFor="sumar" className="flex items-center">
                        <PlusCircle className="mr-1 h-4 w-4 text-green-500" />
                        Sumar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="restar" id="restar" />
                      <Label htmlFor="restar" className="flex items-center">
                        <MinusCircle className="mr-1 h-4 w-4 text-red-500" />
                        Restar
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de Barras</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="codigo"
                      ref={inputRef}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="Escanee o ingrese el código"
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button type="submit" disabled={cargando}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">Productos modificados: {totalModificados}</div>
              <Badge variant={operacion === "sumar" ? "default" : "destructive"}>
                {operacion === "sumar" ? "Sumando" : "Restando"}
              </Badge>
            </CardFooter>
          </Card>

          <Card className="col-span-1 md:col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Último Producto</CardTitle>
              <CardDescription>Detalles del último producto escaneado</CardDescription>
            </CardHeader>
            <CardContent>
              {ultimoProducto ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{ultimoProducto.nombre}</h3>
                    <Badge variant={operacion === "sumar" ? "default" : "destructive"}>
                      {operacion === "sumar" ? (
                        <ArrowUp className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3" />
                      )}
                      {operacion === "sumar" ? "+1" : "-1"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p>{ultimoProducto.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Stock Actual</p>
                      <p className="font-semibold">{ultimoProducto.stock}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Precio</p>
                      <p>${ultimoProducto.precio.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código Proveedor</p>
                      <p>{ultimoProducto.codigo_proveedor || "N/A"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-sm">{ultimoProducto.descripcion || "Sin descripción"}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Escanee un producto para ver sus detalles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Cambios</CardTitle>
            <CardDescription>Últimos 10 productos escaneados</CardDescription>
          </CardHeader>
          <CardContent>
            {historial.length > 0 ? (
              <div className="space-y-4">
                {historial.map((producto, index) => (
                  <div key={`${producto.id}-${index}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <Badge variant="outline">{producto.codigo}</Badge>
                        </div>
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">Stock: {producto.stock}</p>
                        </div>
                      </div>
                    </div>
                    {index < historial.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No hay historial de cambios</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

