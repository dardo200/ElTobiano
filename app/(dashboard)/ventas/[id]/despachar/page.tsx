"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Check, Loader2, Barcode, ChevronDown, ChevronUp } from "lucide-react"
import type { Venta } from "@/types"

interface ProductoCombo {
  id: number
  nombre: string
  codigo: string
  cantidad: number
  verificado: boolean
}

interface ProductoVerificacion {
  id: number
  id_producto: number
  nombre: string
  codigo: string
  cantidad: number
  verificado: boolean
  es_combo: boolean
  productos_combo?: ProductoCombo[]
  expandido?: boolean
}

export default function DespacharVentaPage() {
  const params = useParams()
  const router = useRouter()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [productos, setProductos] = useState<ProductoVerificacion[]>([])
  const [codigoInput, setCodigoInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const response = await fetch(`/api/ventas/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setVenta(data)

          // Preparar lista de productos para verificación
          if (data.detalles && data.detalles.length > 0) {
            const productosParaVerificar: ProductoVerificacion[] = []

            for (const detalle of data.detalles) {
              if (!detalle.es_combo) {
                // Si es un producto normal, agregarlo directamente
                productosParaVerificar.push({
                  id: detalle.id,
                  id_producto: detalle.id_producto,
                  nombre: detalle.producto?.nombre || `Producto #${detalle.id_producto}`,
                  codigo: detalle.producto?.codigo || "",
                  cantidad: detalle.cantidad,
                  verificado: false,
                  es_combo: false,
                })
              } else {
                // Si es un combo, obtener sus productos
                try {
                  const comboResponse = await fetch(`/api/combos/${detalle.id_producto}`)
                  if (comboResponse.ok) {
                    const comboData = await comboResponse.json()

                    // Crear un array para los productos del combo
                    const productosCombo: ProductoCombo[] = []

                    // Si el combo tiene detalles, procesarlos
                    if (comboData.detalles && comboData.detalles.length > 0) {
                      // Para cada detalle del combo, obtener el producto completo
                      for (const detalleCombo of comboData.detalles) {
                        // Obtener información completa del producto
                        try {
                          const productoResponse = await fetch(`/api/productos/${detalleCombo.id_producto}`)
                          if (productoResponse.ok) {
                            const productoData = await productoResponse.json()

                            productosCombo.push({
                              id: detalleCombo.id_producto,
                              nombre: productoData.nombre || `Producto #${detalleCombo.id_producto}`,
                              codigo: productoData.codigo || "",
                              cantidad: detalleCombo.cantidad * detalle.cantidad, // Multiplicar por la cantidad del combo
                              verificado: false,
                            })
                          } else {
                            // Si hay error al obtener el producto, usar la información básica
                            productosCombo.push({
                              id: detalleCombo.id_producto,
                              nombre: detalleCombo.producto?.nombre || `Producto #${detalleCombo.id_producto}`,
                              codigo: detalleCombo.producto?.codigo || "",
                              cantidad: detalleCombo.cantidad * detalle.cantidad,
                              verificado: false,
                            })
                          }
                        } catch (error) {
                          console.error("Error al obtener detalles del producto:", error)
                          // Si hay error, usar la información básica
                          productosCombo.push({
                            id: detalleCombo.id_producto,
                            nombre: detalleCombo.producto?.nombre || `Producto #${detalleCombo.id_producto}`,
                            codigo: detalleCombo.producto?.codigo || "",
                            cantidad: detalleCombo.cantidad * detalle.cantidad,
                            verificado: false,
                          })
                        }
                      }
                    }

                    // Agregar el combo con sus productos
                    productosParaVerificar.push({
                      id: detalle.id,
                      id_producto: detalle.id_producto,
                      nombre: comboData.nombre || `Combo #${detalle.id_producto}`,
                      codigo: comboData.codigo || "",
                      cantidad: detalle.cantidad,
                      verificado: false,
                      es_combo: true,
                      productos_combo: productosCombo,
                      expandido: false,
                    })
                  }
                } catch (error) {
                  console.error("Error al obtener detalles del combo:", error)
                  // Si hay error, agregar el combo sin detalles
                  productosParaVerificar.push({
                    id: detalle.id,
                    id_producto: detalle.id_producto,
                    nombre: `Combo #${detalle.id_producto}`,
                    codigo: "",
                    cantidad: detalle.cantidad,
                    verificado: false,
                    es_combo: true,
                    productos_combo: [],
                  })
                }
              }
            }

            setProductos(productosParaVerificar)
          }
        } else {
          toast.error("Error al cargar la venta")
          router.push("/ventas")
        }
      } catch (error) {
        console.error("Error al cargar la venta:", error)
        toast.error("Error al cargar la venta")
        router.push("/ventas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenta()
  }, [params.id, router])

  const handleVerificarCodigo = () => {
    if (!codigoInput.trim()) return

    // Buscar primero en productos normales
    const productoIndex = productos.findIndex((p) => !p.es_combo && p.codigo === codigoInput.trim() && !p.verificado)

    if (productoIndex >= 0) {
      // Marcar como verificado
      const nuevosProductos = [...productos]
      nuevosProductos[productoIndex].verificado = true
      setProductos(nuevosProductos)
      toast.success(`Producto verificado: ${nuevosProductos[productoIndex].nombre}`)
      setCodigoInput("")
      return
    }

    // Si no se encontró, buscar en productos de combos
    let encontrado = false
    const nuevosProductos = [...productos]

    for (let i = 0; i < nuevosProductos.length; i++) {
      if (nuevosProductos[i].es_combo && nuevosProductos[i].productos_combo) {
        const productoComboIndex = nuevosProductos[i].productos_combo.findIndex(
          (p) => p.codigo === codigoInput.trim() && !p.verificado,
        )

        if (productoComboIndex >= 0) {
          nuevosProductos[i].productos_combo[productoComboIndex].verificado = true

          // Verificar si todos los productos del combo están verificados
          const todosVerificados = nuevosProductos[i].productos_combo.every((p) => p.verificado)
          if (todosVerificados) {
            nuevosProductos[i].verificado = true
          }

          setProductos(nuevosProductos)
          toast.success(`Producto verificado: ${nuevosProductos[i].productos_combo[productoComboIndex].nombre}`)
          encontrado = true
          break
        }
      }
    }

    if (!encontrado) {
      // Verificar si ya fue escaneado (en productos normales)
      const yaVerificado = productos.find((p) => !p.es_combo && p.codigo === codigoInput.trim() && p.verificado)

      if (yaVerificado) {
        toast.error(`El producto "${yaVerificado.nombre}" ya fue verificado`)
      } else {
        // Verificar si ya fue escaneado (en productos de combos)
        let yaVerificadoEnCombo = false
        for (const producto of productos) {
          if (producto.es_combo && producto.productos_combo) {
            const productoCombo = producto.productos_combo.find((p) => p.codigo === codigoInput.trim() && p.verificado)
            if (productoCombo) {
              toast.error(`El producto "${productoCombo.nombre}" ya fue verificado`)
              yaVerificadoEnCombo = true
              break
            }
          }
        }

        if (!yaVerificadoEnCombo) {
          toast.error("Código no encontrado en esta venta")
        }
      }
    }

    // Limpiar el input
    setCodigoInput("")
  }

  const handleVerificarManualmente = (index: number) => {
    const nuevosProductos = [...productos]

    if (!nuevosProductos[index].es_combo) {
      // Si es un producto normal, simplemente invertir su estado
      nuevosProductos[index].verificado = !nuevosProductos[index].verificado
    } else {
      // Si es un combo, marcar todos sus productos como verificados/no verificados
      const nuevoEstado = !nuevosProductos[index].verificado
      nuevosProductos[index].verificado = nuevoEstado

      if (nuevosProductos[index].productos_combo) {
        nuevosProductos[index].productos_combo.forEach((p) => {
          p.verificado = nuevoEstado
        })
      }
    }

    setProductos(nuevosProductos)
  }

  const handleVerificarProductoCombo = (comboIndex: number, productoIndex: number) => {
    const nuevosProductos = [...productos]

    // Invertir el estado del producto del combo
    nuevosProductos[comboIndex].productos_combo[productoIndex].verificado =
      !nuevosProductos[comboIndex].productos_combo[productoIndex].verificado

    // Verificar si todos los productos del combo están verificados
    const todosVerificados = nuevosProductos[comboIndex].productos_combo.every((p) => p.verificado)
    nuevosProductos[comboIndex].verificado = todosVerificados

    setProductos(nuevosProductos)
  }

  const toggleExpandirCombo = (index: number) => {
    const nuevosProductos = [...productos]
    nuevosProductos[index].expandido = !nuevosProductos[index].expandido
    setProductos(nuevosProductos)
  }

  const handleConfirmarDespacho = async () => {
    // Verificar que todos los productos estén verificados
    const todosVerificados = productos.every((p) => {
      if (!p.es_combo) {
        return p.verificado
      } else {
        // Para combos, verificar que todos sus productos estén verificados
        return p.productos_combo ? p.productos_combo.every((pc) => pc.verificado) : p.verificado
      }
    })

    if (!todosVerificados) {
      toast.error("Debe verificar todos los productos antes de confirmar el despacho")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/ventas/${venta?.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "Despachado" }),
      })

      if (response.ok) {
        toast.success("Venta despachada correctamente")
        router.push("/ventas")
      } else {
        const data = await response.json()
        if (data.error && data.error.includes("Stock insuficiente")) {
          // Mostrar un mensaje de error más detallado
          toast({
            variant: "destructive",
            title: "Error de stock",
            description: (
              <div className="mt-2 max-h-[200px] overflow-y-auto">
                <p className="font-semibold mb-2">Productos con stock insuficiente:</p>
                <pre className="text-xs whitespace-pre-wrap">{data.error}</pre>
              </div>
            ),
            duration: 10000, // Mostrar por más tiempo
          })
        } else {
          toast.error("Error al despachar la venta")
        }
      }
    } catch (error) {
      console.error("Error al despachar la venta:", error)
      toast.error("Error al despachar la venta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!venta) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Venta no encontrada</p>
      </div>
    )
  }

  // Calcular progreso total (productos normales + productos de combos)
  let totalProductos = productos.filter((p) => !p.es_combo).length
  let verificadosProductos = productos.filter((p) => !p.es_combo && p.verificado).length

  // Agregar productos de combos
  for (const producto of productos) {
    if (producto.es_combo && producto.productos_combo) {
      totalProductos += producto.productos_combo.length
      verificadosProductos += producto.productos_combo.filter((p) => p.verificado).length
    }
  }

  const progreso = totalProductos > 0 ? Math.round((verificadosProductos / totalProductos) * 100) : 0

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Despachar Venta #${venta.id}`}
          description="Verifique todos los productos antes de despachar"
        />
        <Button variant="outline" onClick={() => router.push(`/ventas/${venta.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lista de productos a verificar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productos.map((producto, index) => (
                  <div key={producto.id}>
                    <div
                      className={`flex justify-between items-center p-3 rounded-md border ${
                        producto.verificado
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            producto.verificado ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          {producto.verificado && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{producto.nombre}</p>
                            {producto.es_combo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 p-0 h-6 w-6"
                                onClick={() => toggleExpandirCombo(index)}
                              >
                                {producto.expandido ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {!producto.es_combo && <span className="mr-2">Código: {producto.codigo || "N/A"}</span>}
                            <span>Cantidad: {producto.cantidad}</span>
                            {producto.es_combo && <Badge className="ml-2">Combo</Badge>}
                          </div>
                        </div>
                      </div>
                      {!producto.es_combo && (
                        <Button
                          variant={producto.verificado ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleVerificarManualmente(index)}
                        >
                          {producto.verificado ? "Desmarcar" : "Verificar"}
                        </Button>
                      )}
                      {producto.es_combo && (
                        <Button
                          variant={producto.verificado ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleVerificarManualmente(index)}
                        >
                          {producto.verificado ? "Desmarcar todo" : "Verificar todo"}
                        </Button>
                      )}
                    </div>

                    {/* Mostrar productos del combo si está expandido */}
                    {producto.es_combo && producto.expandido && producto.productos_combo && (
                      <div className="ml-8 mt-2 space-y-2">
                        {producto.productos_combo.map((productoCombo, productoIndex) => (
                          <div
                            key={`${producto.id}-${productoCombo.id}`}
                            className={`flex justify-between items-center p-2 rounded-md border ${
                              productoCombo.verificado
                                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                : "bg-white dark:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  productoCombo.verificado ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                }`}
                              >
                                {productoCombo.verificado && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{productoCombo.nombre}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span className="mr-2">Código: {productoCombo.codigo || "N/A"}</span>
                                  <span>Cantidad: {productoCombo.cantidad}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant={productoCombo.verificado ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleVerificarProductoCombo(index, productoIndex)}
                            >
                              {productoCombo.verificado ? "Desmarcar" : "Verificar"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {productos.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No hay productos para verificar</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Verificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Escanear código de barras</p>
                  <div className="flex space-x-2">
                    <Input
                      value={codigoInput}
                      onChange={(e) => setCodigoInput(e.target.value)}
                      placeholder="Escanee o ingrese el código"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleVerificarCodigo()
                        }
                      }}
                    />
                    <Button variant="outline" size="icon" onClick={handleVerificarCodigo}>
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Progreso</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progreso}%` }}></div>
                  </div>
                  <p className="text-sm text-right mt-1">
                    {verificadosProductos} de {totalProductos} verificados
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-sm font-medium mb-1">Información de la venta</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span>{venta.cliente?.nombre || "Cliente no registrado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span>{new Date(venta.fecha).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold">${venta.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!productos.every((p) => p.verificado) || isSubmitting}
                onClick={handleConfirmarDespacho}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Despacho
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}

