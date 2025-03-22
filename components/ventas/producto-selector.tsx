"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Producto } from "@/types"

interface ProductoSelectorProps {
  productos: Producto[]
  onSelect: (producto: Producto, cantidad: number, esMayorista: boolean) => void
  onCancel: () => void
  initialMayorista?: boolean
}

export function ProductoSelector({ productos, onSelect, onCancel, initialMayorista = false }: ProductoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [isMayorista, setIsMayorista] = useState(initialMayorista)

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos([])
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredProductos(filtered)
    }
  }, [searchTerm, productos])

  const handleAddProducto = () => {
    if (!selectedProducto) return
    onSelect(selectedProducto, cantidad, isMayorista)
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center space-x-2">
        <div className="grid flex-1 gap-2">
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="button" size="sm" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch id="precio-mayorista-dialog" checked={isMayorista} onCheckedChange={setIsMayorista} />
        <Label htmlFor="precio-mayorista-dialog">Usar precio mayorista</Label>
      </div>

      <div className="max-h-60 overflow-y-auto border rounded-md">
        {filteredProductos.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {searchTerm ? "No se encontraron productos" : "Ingrese un término de búsqueda"}
          </p>
        ) : (
          filteredProductos.map((producto) => (
            <div
              key={producto.id}
              className={`p-2 cursor-pointer hover:bg-muted ${selectedProducto?.id === producto.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedProducto(producto)}
            >
              <p className="font-medium">{producto.nombre}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Código: {producto.codigo || "N/A"}</span>
                <span>
                  Precio: $
                  {isMayorista && producto.precio_mayorista
                    ? producto.precio_mayorista.toFixed(2)
                    : producto.precio.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProducto && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedProducto.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Precio: $
                  {isMayorista && selectedProducto.precio_mayorista
                    ? selectedProducto.precio_mayorista.toFixed(2)
                    : selectedProducto.precio.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCantidad(cantidad + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleAddProducto} disabled={!selectedProducto}>
          Agregar
        </Button>
      </div>
    </div>
  )
}

