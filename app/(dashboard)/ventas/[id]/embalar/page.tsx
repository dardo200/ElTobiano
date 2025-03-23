"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package } from "lucide-react"
import { Heading } from "@/components/ui/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import type { Venta } from "@/types"

export default function EmbalarVentaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Estados para los nuevos campos
  const [medioComunicacion, setMedioComunicacion] = useState<string>("WhatsApp")
  const [datoComunicacion, setDatoComunicacion] = useState<string>("")
  const [correoUsado, setCorreoUsado] = useState<string>("Vía Cargo")
  const [otroCorreo, setOtroCorreo] = useState<string>("")
  const [pagoEnvio, setPagoEnvio] = useState<string>("Transferencia")
  const [cuentaTransferencia, setCuentaTransferencia] = useState<string>("")
  const [comprobantePago, setComprobantePago] = useState<string>("")
  const [requiereFactura, setRequiereFactura] = useState<boolean>(false)
  const [numeroFactura, setNumeroFactura] = useState<string>("")

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const response = await fetch(`/api/ventas/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setVenta(data)

          // Prellenar campos si ya existen
          if (data.medio_comunicacion) setMedioComunicacion(data.medio_comunicacion)
          if (data.dato_comunicacion) setDatoComunicacion(data.dato_comunicacion)

          // Manejar el correo usado y el campo "otro"
          if (data.correo_usado) {
            const correosEstándar = ["Vía Cargo", "Credifin", "LEP", "Correo Argentino", "Comisionista"]
            if (correosEstándar.includes(data.correo_usado)) {
              setCorreoUsado(data.correo_usado)
            } else {
              setCorreoUsado("Otro")
              setOtroCorreo(data.correo_usado)
            }
          }

          if (data.pago_envio) setPagoEnvio(data.pago_envio)
          if (data.cuenta_transferencia) setCuentaTransferencia(data.cuenta_transferencia)
          if (data.comprobante_pago) setComprobantePago(data.comprobante_pago)
          if (data.requiere_factura !== undefined) setRequiereFactura(data.requiere_factura)
          if (data.numero_factura) setNumeroFactura(data.numero_factura)

          // Si la venta no está en estado "Pendiente", redirigir
          if (data.estado !== "Pendiente") {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Esta venta ya no está en estado Pendiente",
            })
            router.push(`/ventas/${params.id}`)
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
  }, [params.id, router, toast])

  // Modificar la función handleSubmit para mostrar un mensaje de error más claro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!venta) return

    setIsSaving(true)

    // Determinar el valor final del correo usado
    const correoFinal = correoUsado === "Otro" ? otroCorreo : correoUsado

    try {
      // Primero actualizamos los datos adicionales
      const updateResponse = await fetch(`/api/ventas/${venta.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medio_comunicacion: medioComunicacion,
          dato_comunicacion: datoComunicacion,
          correo_usado: correoFinal,
          pago_envio: pagoEnvio,
          cuenta_transferencia: cuentaTransferencia,
          comprobante_pago: comprobantePago,
          requiere_factura: requiereFactura,
          numero_factura: numeroFactura,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || "Error al actualizar los datos de la venta")
      }

      // Luego cambiamos el estado a "Para embalar"
      const estadoResponse = await fetch(`/api/ventas/${venta.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "Para embalar" }),
      })

      if (!estadoResponse.ok) {
        const errorData = await estadoResponse.json()

        // Si es un error de stock, mostrar un mensaje más descriptivo
        if (errorData.stockError) {
          throw new Error(errorData.message || "No hay suficiente stock para completar esta venta")
        }

        throw new Error(errorData.error || "Error al cambiar el estado de la venta")
      }

      toast({
        title: "Éxito",
        description: "Venta actualizada a Para embalar correctamente",
      })

      // Añadimos un pequeño retraso antes de redirigir para asegurar que el toast se muestre
      setTimeout(() => {
        router.push(`/ventas/${venta.id}`)
      }, 1000)
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error de stock",
        description: error instanceof Error ? error.message : "Error al procesar la venta",
      })
    } finally {
      setIsSaving(false)
    }
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

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Preparar venta #${venta.id} para embalar`}
          description="Completa la información necesaria para procesar la venta"
        />
        <Button variant="outline" onClick={() => router.push(`/ventas/${venta.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
      <Separator />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Medio de comunicación</Label>
              <RadioGroup
                value={medioComunicacion}
                onValueChange={setMedioComunicacion}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="WhatsApp" id="whatsapp" />
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Teléfono" id="telefono" />
                  <Label htmlFor="telefono">Teléfono</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Email" id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Instagram" id="instagram" />
                  <Label htmlFor="instagram">Instagram</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Facebook" id="facebook" />
                  <Label htmlFor="facebook">Facebook</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Otro" id="otro" />
                  <Label htmlFor="otro">Otro</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="datoComunicacion">Dato de contacto</Label>
              <Input
                id="datoComunicacion"
                value={datoComunicacion}
                onChange={(e) => setDatoComunicacion(e.target.value)}
                placeholder="Número, usuario o dirección de contacto"
              />
            </div>

            <div className="space-y-2">
              <Label>Servicio de correo postal</Label>
              <RadioGroup value={correoUsado} onValueChange={setCorreoUsado} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Vía Cargo" id="via-cargo" />
                  <Label htmlFor="via-cargo">Vía Cargo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Credifin" id="credifin" />
                  <Label htmlFor="credifin">Credifin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LEP" id="lep" />
                  <Label htmlFor="lep">LEP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Correo Argentino" id="correo-argentino" />
                  <Label htmlFor="correo-argentino">Correo Argentino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Comisionista" id="comisionista" />
                  <Label htmlFor="comisionista">Comisionista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Otro" id="otro-correo" />
                  <Label htmlFor="otro-correo">Otro</Label>
                </div>
              </RadioGroup>

              {correoUsado === "Otro" && (
                <div className="mt-2">
                  <Input
                    id="otroCorreo"
                    value={otroCorreo}
                    onChange={(e) => setOtroCorreo(e.target.value)}
                    placeholder="Especifique el servicio de correo"
                    required={correoUsado === "Otro"}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Método de pago del envío</Label>
              <RadioGroup value={pagoEnvio} onValueChange={setPagoEnvio} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Transferencia" id="transferencia" />
                  <Label htmlFor="transferencia">Transferencia bancaria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MercadoPago" id="mercadopago" />
                  <Label htmlFor="mercadopago">MercadoPago</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Efectivo" id="efectivo" />
                  <Label htmlFor="efectivo">Efectivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Otro" id="otro-pago" />
                  <Label htmlFor="otro-pago">Otro</Label>
                </div>
              </RadioGroup>
            </div>

            {pagoEnvio === "Transferencia" && (
              <div className="space-y-2">
                <Label htmlFor="cuentaTransferencia">Cuenta de transferencia</Label>
                <Input
                  id="cuentaTransferencia"
                  value={cuentaTransferencia}
                  onChange={(e) => setCuentaTransferencia(e.target.value)}
                  placeholder="Últimos 4 dígitos o alias"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comprobantePago">Comprobante de pago</Label>
              <Input
                id="comprobantePago"
                value={comprobantePago}
                onChange={(e) => setComprobantePago(e.target.value)}
                placeholder="Número de comprobante o referencia"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiereFactura"
                checked={requiereFactura}
                onCheckedChange={(checked) => setRequiereFactura(checked as boolean)}
              />
              <Label htmlFor="requiereFactura">Requiere factura</Label>
            </div>

            {requiereFactura && (
              <div className="space-y-2">
                <Label htmlFor="numeroFactura">Número de factura</Label>
                <Input
                  id="numeroFactura"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Número de factura"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
            <Package className="mr-2 h-4 w-4" />
            {isSaving ? "Procesando..." : "Confirmar y pasar a embalar"}
          </Button>
        </div>
      </form>
    </>
  )
}

