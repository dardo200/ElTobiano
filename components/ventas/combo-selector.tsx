"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { Combo } from "@/types"

interface ComboSelectorProps {
  combos: Combo[]
  onSelect: (combo: Combo, cantidad: number) => void
  onCancel: () => void
}

export function ComboSelector({ combos, onSelect, onCancel }: ComboSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([])
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCombos([])
    } else {
      const filtered = combos.filter(
        (combo) =>
          combo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (combo.codigo && combo.codigo.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredCombos(filtered)
    }
  }, [searchTerm, combos])

  const handleAddCombo = () => {
    if (!selectedCombo) return
    onSelect(selectedCombo, cantidad)
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

      <div className="max-h-60 overflow-y-auto border rounded-md">
        {filteredCombos.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {searchTerm ? "No se encontraron combos" : "Ingrese un término de búsqueda"}
          </p>
        ) : (
          filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className={`p-2 cursor-pointer hover:bg-muted ${selectedCombo?.id === combo.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedCombo(combo)}
            >
              <p className="font-medium">{combo.nombre}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Código: {combo.codigo || "N/A"}</span>
                <span>Precio: ${combo.precio_venta.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCombo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedCombo.nombre}</p>
                <p className="text-sm text-muted-foreground">Precio: ${selectedCombo.precio_venta.toFixed(2)}</p>
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
        <Button type="button" onClick={handleAddCombo} disabled={!selectedCombo}>
          Agregar
        </Button>
      </div>
    </div>
  )
}

