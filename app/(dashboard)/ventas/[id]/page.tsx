"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Printer, Truck, ChevronDown, ChevronUp, FileText, Package, CheckCircle, Tag } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Venta, DetalleVenta, Cliente } from "@/types"

// Importar las funciones de generación de PDF y toast correctamente
import { generarPresupuestoPDF, descargarPDF } from "@/lib/pdf-service"
import { useToast } from "@/components/ui/use-toast"
// Actualizar las importaciones para incluir el nuevo servicio
import { generarEtiquetaEnvio } from "@/lib/etiqueta-service"

interface ProductoCombo {
  id: number
  nombre: string
  codigo?: string
  cantidad: number
}

export default function DetalleVentaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [clienteCompleto, setClienteCompleto] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCombos, setExpandedCombos] = useState<Record<number, boolean>>({})
  const [combosDetalles, setCombosDetalles] = useState<Record<number, ProductoCombo[]>>({})
  // Añadir un nuevo estado para controlar la generación del PDF
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [generandoEtiqueta, setGenerandoEtiqueta] = useState(false)

  // Añadir la función para generar y descargar el PDF
  const handleGenerarPresupuesto = async () => {
    if (!venta) return

    try {
      setGenerandoPDF(true)
      const pdfBlob = await generarPresupuestoPDF(venta)
      descargarPDF(pdfBlob, `Presupuesto_${venta.id}_${venta.cliente?.nombre || "Cliente"}.pdf`)
      toast({
        title: "Presupuesto generado",
        description: "El presupuesto se ha generado y descargado correctamente",
      })
    } catch (error) {
      console.error("Error al generar el presupuesto:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el presupuesto",
      })
    } finally {
      setGenerandoPDF(false)
    }
  }

  // Función para generar la etiqueta de envío
  // Reemplazar la función handleGenerarEtiqueta con esta versión más simple
  const handleGenerarEtiqueta = async () => {
    if (!venta || !clienteCompleto) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se puede generar la etiqueta sin datos del cliente",
      })
      return
    }

    try {
      setGenerandoEtiqueta(true)
      await generarEtiquetaEnvio(venta, clienteCompleto)
      toast({
        title: "Etiqueta generada",
        description: "La etiqueta de envío se ha generado correctamente",
      })
    } catch (error) {
      console.error("Error al generar la etiqueta:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la etiqueta de envío",
      })
    } finally {
      setGenerandoEtiqueta(false)
    }
  }

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const response = await fetch(`/api/ventas/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setVenta(data)

          // Si la venta tiene un cliente, obtener los datos completos del cliente
          if (data.cliente && data.cliente.id) {
            await fetchClienteCompleto(data.cliente.id)
          }

          // Inicializar la carga de detalles de combos
          if (data.detalles && data.detalles.length > 0) {
            const combosIds: number[] = []
            const combosModificados: DetalleVenta[] = []

            // Identificar combos normales y modificados
            data.detalles.forEach((detalle: DetalleVenta) => {
              if (detalle.es_combo) {
                if (detalle.datos_combo_modificado) {
                  combosModificados.push(detalle)
                } else {
                  combosIds.push(detalle.id_producto)
                }
              }
            })

            // Cargar detalles de combos normales
            await loadCombosDetalles(combosIds)

            // Cargar detalles de combos modificados
            await loadModifiedCombosDetalles(combosModificados)
          }
        } else {
          console.error("Error al obtener la venta")
          router.push("/ventas")
        }
      } catch (error) {
        console.error("Error al obtener la venta:", error)
        router.push("/ventas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVenta()
  }, [params.id, router])

  // Función para obtener los datos completos del cliente
  const fetchClienteCompleto = async (clienteId: number) => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      if (response.ok) {
        const data = await response.json()
        setClienteCompleto(data)
        console.log("Datos completos del cliente:", data)
      } else {
        console.error("Error al obtener los datos completos del cliente")
      }
    } catch (error) {
      console.error("Error al obtener los datos completos del cliente:", error)
    }
  }

  const loadCombosDetalles = async (combosIds: number[]) => {
    if (!combosIds.length) return

    const detallesPorCombo: Record<number, ProductoCombo[]> = {}

    for (const comboId of combosIds) {
      try {
        const response = await fetch(`/api/combos/${comboId}`)
        if (response.ok) {
          const comboData = await response.json()

          if (comboData.detalles && comboData.detalles.length > 0) {
            detallesPorCombo[comboId] = comboData.detalles.map((detalle: any) => ({
              id: detalle.id_producto,
              nombre: detalle.producto?.nombre || `Producto #${detalle.id_producto}`,
              codigo: detalle.producto?.codigo || "",
              cantidad: detalle.cantidad,
            }))
          }
        }
      } catch (error) {
        console.error(`Error al cargar detalles del combo ${comboId}:`, error)
      }
    }

    setCombosDetalles((prev) => ({ ...prev, ...detallesPorCombo }))
  }

  const loadModifiedCombosDetalles = async (combosModificados: DetalleVenta[]) => {
    if (!combosModificados.length) return

    const detallesPorCombo: Record<number, ProductoCombo[]> = {}

    for (const detalle of combosModificados) {
      try {
        // Parsear los datos del combo modificado
        const items = JSON.parse(detalle.datos_combo_modificado || "[]")
        const productosInfo: ProductoCombo[] = []

        // Obtener información adicional de cada producto
        for (const item of items) {
          try {
            const response = await fetch(`/api/productos/${item.id_producto}`)
            if (response.ok) {
              const productoData = await response.json()
              productosInfo.push({
                id: item.id_producto,
                nombre: productoData.nombre || `Producto #${item.id_producto}`,
                codigo: productoData.codigo || "",
                cantidad: item.cantidad,
              })
            }
          } catch (error) {
            console.error(`Error al obtener detalles del producto ${item.id_producto}:`, error)
          }
        }

        detallesPorCombo[detalle.id] = productosInfo
      } catch (error) {
        console.error(`Error al procesar combo modificado ${detalle.id}:`, error)
      }
    }

    setCombosDetalles((prev) => ({ ...prev, ...detallesPorCombo }))
  }

  const toggleComboExpand = (id: number) => {
    setExpandedCombos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
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

  // Actualizar la página de detalles para mostrar los nuevos campos
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Venta #${venta.id}`}
          description={`Detalles de la venta realizada el ${new Date(venta.fecha).toLocaleDateString()}`}
        />
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/ventas")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {venta.estado === "Despachado" || venta.estado === "Completado" ? (
            <Button variant="default" onClick={handleGenerarEtiqueta} disabled={generandoEtiqueta}>
              <Tag className="mr-2 h-4 w-4" />
              {generandoEtiqueta ? "Generando..." : "Generar Etiqueta"}
            </Button>
          ) : (
            <Button variant="default" onClick={handleGenerarPresupuesto} disabled={generandoPDF}>
              <FileText className="mr-2 h-4 w-4" />
              {generandoPDF ? "Generando..." : "Generar Presupuesto"}
            </Button>
          )}
        </div>
      </div>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{new Date(venta.fecha).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <Badge
                  variant={
                    venta.estado === "Pendiente"
                      ? "destructive"
                      : venta.estado === "Para embalar"
                        ? "secondary"
                        : venta.estado === "Despachado"
                          ? "success"
                          : "outline"
                  }
                >
                  {venta.estado}
                </Badge>
              </div>
              {venta.estado === "Pendiente" && (
                <div className="pt-2">
                  <Button className="w-full" onClick={() => router.push(`/ventas/${venta.id}/embalar`)}>
                    <Package className="mr-2 h-4 w-4" />
                    Preparar para embalar
                  </Button>
                </div>
              )}
              {venta.estado === "Para embalar" && (
                <div className="pt-2">
                  <Button className="w-full" onClick={() => router.push(`/ventas/${venta.id}/despachar`)}>
                    <Truck className="mr-2 h-4 w-4" />
                    Despachar Venta
                  </Button>
                </div>
              )}
              {venta.estado === "Despachado" && (
                <div className="pt-2">
                  <Button className="w-full" onClick={() => router.push(`/ventas/${venta.id}/completar`)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completar Venta
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {venta.cliente ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Nombre:</span>
                  <span>{venta.cliente.nombre}</span>
                </div>
                {venta.cliente.email && (
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{venta.cliente.email}</span>
                  </div>
                )}
                {venta.cliente.telefono && (
                  <div className="flex justify-between">
                    <span className="font-medium">Teléfono:</span>
                    <span>{venta.cliente.telefono}</span>
                  </div>
                )}
                {venta.cliente.direccion && (
                  <div className="flex justify-between">
                    <span className="font-medium">Dirección:</span>
                    <span>{venta.cliente.direccion}</span>
                  </div>
                )}
                {clienteCompleto?.ciudad && (
                  <div className="flex justify-between">
                    <span className="font-medium">Ciudad:</span>
                    <span>{clienteCompleto.ciudad}</span>
                  </div>
                )}
                {clienteCompleto?.provincia && (
                  <div className="flex justify-between">
                    <span className="font-medium">Provincia:</span>
                    <span>{clienteCompleto.provincia}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Cliente no registrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Cantidad de productos:</span>
                <span>{venta.detalles?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mostrar información adicional si está disponible */}
      {(venta.medio_comunicacion ||
        venta.dato_comunicacion ||
        venta.correo_usado ||
        venta.pago_envio ||
        venta.cuenta_transferencia ||
        venta.comprobante_pago ||
        venta.requiere_factura ||
        venta.numero_factura ||
        venta.numero_seguimiento) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Información adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venta.medio_comunicacion && (
                <div className="space-y-1">
                  <span className="font-medium">Medio de comunicación:</span>
                  <p>{venta.medio_comunicacion}</p>
                </div>
              )}
              {venta.dato_comunicacion && (
                <div className="space-y-1">
                  <span className="font-medium">Dato de contacto:</span>
                  <p>{venta.dato_comunicacion}</p>
                </div>
              )}
              {venta.correo_usado && (
                <div className="space-y-1">
                  <span className="font-medium">Servicio de correo postal:</span>
                  <p>{venta.correo_usado}</p>
                </div>
              )}
              {venta.pago_envio && (
                <div className="space-y-1">
                  <span className="font-medium">Método de pago:</span>
                  <p>{venta.pago_envio}</p>
                </div>
              )}
              {venta.cuenta_transferencia && (
                <div className="space-y-1">
                  <span className="font-medium">Cuenta de transferencia:</span>
                  <p>{venta.cuenta_transferencia}</p>
                </div>
              )}
              {venta.comprobante_pago && (
                <div className="space-y-1">
                  <span className="font-medium">Comprobante de pago:</span>
                  <p>{venta.comprobante_pago}</p>
                </div>
              )}
              {venta.requiere_factura && (
                <div className="space-y-1">
                  <span className="font-medium">Requiere factura:</span>
                  <p>Sí</p>
                </div>
              )}
              {venta.numero_factura && (
                <div className="space-y-1">
                  <span className="font-medium">Número de factura:</span>
                  <p>{venta.numero_factura}</p>
                </div>
              )}
              {venta.numero_seguimiento && (
                <div className="space-y-1">
                  <span className="font-medium">Número de seguimiento:</span>
                  <p>{venta.numero_seguimiento}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detalle de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Producto</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2 text-right">Cantidad</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles?.map((detalle) => {
                  // Asegurarse de que el precio no sea null antes de usar toFixed
                  const precio = detalle.precio || 0
                  const cantidad = detalle.cantidad || 0
                  const subtotal = precio * cantidad
                  const isCombo = detalle.es_combo
                  const isModifiedCombo = isCombo && detalle.datos_combo_modificado
                  const comboExpanded = expandedCombos[detalle.id] || false
                  const comboProductos = combosDetalles[isModifiedCombo ? detalle.id : detalle.id_producto] || []

                  return (
                    <React.Fragment key={`detalle-${detalle.id}`}>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="flex items-center">
                            {isCombo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6 mr-1"
                                onClick={() => toggleComboExpand(detalle.id)}
                              >
                                {comboExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <div>
                              <span className="font-medium">
                                {isCombo ? "[Combo] " : ""}
                                {detalle.producto?.nombre || `Producto #${detalle.id_producto}`}
                              </span>
                              {isModifiedCombo && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-orange-100 text-orange-800 border-orange-300"
                                >
                                  Modificado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-right">${precio.toFixed(2)}</td>
                        <td className="py-2 text-right">{cantidad}</td>
                        <td className="py-2 text-right">${subtotal.toFixed(2)}</td>
                      </tr>
                      {isCombo && comboExpanded && comboProductos.length > 0 && (
                        <tr key={`detalle-${detalle.id}-expanded`}>
                          <td colSpan={4} className="py-0">
                            <div className="bg-muted/30 rounded-md p-2 my-1">
                              <p className="text-sm font-medium mb-1">Productos en este combo:</p>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-muted">
                                    <th className="py-1 text-left">Producto</th>
                                    <th className="py-1 text-right">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {comboProductos.map((producto) => (
                                    <tr
                                      key={`combo-${detalle.id}-producto-${producto.id}`}
                                      className="border-b border-muted/50"
                                    >
                                      <td className="py-1">{producto.nombre}</td>
                                      <td className="py-1 text-right">
                                        {producto.cantidad * (isModifiedCombo ? 1 : cantidad)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-bold">
                    Total:
                  </td>
                  <td className="py-2 text-right font-bold">${venta.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
