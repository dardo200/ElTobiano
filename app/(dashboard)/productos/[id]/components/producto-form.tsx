"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Barcode, RefreshCw, Printer, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Producto } from "@/types"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precio: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  precio_compra: z.coerce.number().min(0, "El precio de compra debe ser mayor o igual a 0"),
  precio_mayorista: z.coerce.number().min(0, "El precio mayorista debe ser mayor o igual a 0"),
  codigo_proveedor: z.string().optional(),
  stock: z.coerce.number().int().min(0, "El stock debe ser mayor o igual a 0"),
  codigo: z.string().min(1, "El código de barras es requerido"),
})

type ProductoFormValues = z.infer<typeof formSchema>

interface ProductoFormProps {
  initialData: Producto | null
}

export const ProductoForm: React.FC<ProductoFormProps> = ({ initialData }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false)
  const [showPriceWarning, setShowPriceWarning] = useState(false)
  const [showMayoristaWarning, setShowMayoristaWarning] = useState(false)
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null)

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: "",
      descripcion: "",
      precio: 0,
      precio_compra: 0,
      precio_mayorista: 0,
      codigo_proveedor: "",
      stock: 0,
      codigo: "",
    },
  })

  // Observar cambios en los precios para mostrar advertencia
  const precio = form.watch("precio")
  const precio_compra = form.watch("precio_compra")
  const precio_mayorista = form.watch("precio_mayorista")

  useEffect(() => {
    // Convertir los valores a números para asegurar una comparación correcta
    const precioNum = Number.parseFloat(precio) || 0
    const precioCNum = Number.parseFloat(precio_compra) || 0
    const precioMNum = Number.parseFloat(precio_mayorista) || 0

    if (precioNum > 0 && precioCNum > 0 && precioNum < precioCNum) {
      setShowPriceWarning(true)
    } else {
      setShowPriceWarning(false)
    }

    if (precioMNum > 0 && precioNum > 0 && precioMNum >= precioNum) {
      setShowMayoristaWarning(true)
    } else {
      setShowMayoristaWarning(false)
    }
  }, [precio, precio_compra, precio_mayorista])

  const onSubmit = async (data: ProductoFormValues) => {
    setIsLoading(true)
    try {
      const url = initialData ? `/api/productos/${initialData.id}` : "/api/productos"

      const method = initialData ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(initialData ? "Producto actualizado correctamente" : "Producto creado correctamente")
        router.push("/productos")
        router.refresh()
      } else {
        const errorData = await response.json()
        console.error("Error al guardar el producto:", errorData)
        toast.error(errorData.details || "Error al guardar el producto")
      }
    } catch (error) {
      console.error("Error al guardar el producto:", error)
      toast.error("Error al guardar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanBarcode = () => {
    const code = prompt("Escanee o ingrese el código de barras:")
    if (code) {
      form.setValue("codigo", code)
    }
  }

  const generateRandomCode = () => {
    // Generar un código aleatorio de 12 dígitos (formato EAN-13 sin el dígito de verificación)
    return Math.floor(100000000000 + Math.random() * 900000000000).toString()
  }

  const handleGenerateBarcode = async () => {
    setIsGeneratingCode(true)
    try {
      // Verificar si ya existe un código generado
      let newCode = generateRandomCode()

      // Verificar que el código no exista ya en la base de datos
      let isUnique = false
      let attempts = 0
      const maxAttempts = 5

      while (!isUnique && attempts < maxAttempts) {
        attempts++
        const response = await fetch(`/api/productos/codigo/${newCode}/check`)
        if (response.ok) {
          const data = await response.json()
          isUnique = !data.exists
          if (!isUnique) {
            newCode = generateRandomCode()
          }
        } else {
          // Si hay un error en la verificación, asumimos que el código es único
          isUnique = true
        }
      }

      if (!isUnique) {
        toast.error("No se pudo generar un código único. Intente nuevamente.")
        return
      }

      form.setValue("codigo", newCode)
      toast.success("Código de barras generado correctamente")
    } catch (error) {
      console.error("Error al generar código de barras:", error)
      toast.error("Error al generar código de barras")
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleShowBarcode = async () => {
    const codigo = form.getValues("codigo")
    if (!codigo) {
      toast.error("Debe ingresar un código de barras primero")
      return
    }

    setShowBarcodeDialog(true)

    // Renderizar el código de barras después de que el diálogo esté visible
    setTimeout(() => {
      renderBarcode(codigo)
    }, 100)
  }

  const renderBarcode = (code: string) => {
    if (!barcodeCanvasRef.current) return

    const canvas = barcodeCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Importar dinámicamente JsBarcode
    import("jsbarcode").then((JsBarcode) => {
      try {
        JsBarcode.default(canvas, code, {
          format: "CODE128",
          displayValue: true,
          fontSize: 18,
          height: 100,
          margin: 10,
        })
      } catch (error) {
        console.error("Error al renderizar código de barras:", error)
        ctx.font = "16px Arial"
        ctx.fillText("Error al generar el código de barras", 10, 50)
      }
    })
  }

  const handlePrintBarcode = () => {
    if (!barcodeCanvasRef.current) return

    const canvas = barcodeCanvasRef.current
    const dataUrl = canvas.toDataURL("image/png")

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.")
      return
    }

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Código de Barras</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              text-align: center;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              margin-bottom: 10px;
            }
            .product-name {
              font-size: 14px;
              margin-bottom: 5px;
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${form.getValues("nombre")}</div>
            <img src="${dataUrl}" alt="Código de barras" />
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="precio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Venta (Minorista)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={isLoading} placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="precio_mayorista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Venta (Mayorista)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={isLoading} placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="precio_compra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Compra</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={isLoading} placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={isLoading} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input disabled={isLoading || initialData !== null} placeholder="Código de barras" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleScanBarcode}
                      disabled={isLoading || initialData !== null}
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateBarcode}
                      disabled={isLoading || initialData !== null || isGeneratingCode}
                    >
                      {isGeneratingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleShowBarcode}
                      disabled={isLoading || !form.getValues("codigo")}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigo_proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Proveedor</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Código del producto en el proveedor"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isLoading}
                    placeholder="Descripción del producto"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showPriceWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencia de precio</AlertTitle>
              <AlertDescription>
                El precio de venta minorista (${precio}) es menor que el precio de compra (${precio_compra}). Esto
                resultará en pérdidas por cada venta.
              </AlertDescription>
            </Alert>
          )}

          {showMayoristaWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencia de precio mayorista</AlertTitle>
              <AlertDescription>
                El precio mayorista (${precio_mayorista}) es mayor o igual que el precio minorista (${precio}).
                Normalmente el precio mayorista debería ser menor que el precio minorista.
              </AlertDescription>
            </Alert>
          )}

          <Separator />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/productos")}
              className="mr-2"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showBarcodeDialog} onOpenChange={setShowBarcodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código de Barras</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <canvas ref={barcodeCanvasRef} width="300" height="150"></canvas>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handlePrintBarcode}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

