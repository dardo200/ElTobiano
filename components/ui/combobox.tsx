"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  searchTerms?: string // Términos adicionales para búsqueda (DNI, código, etc.)
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  searchPlaceholder?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opción",
  emptyMessage = "No se encontraron resultados",
  className,
  disabled = false,
  searchPlaceholder,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Encontrar la etiqueta correspondiente al valor actual
  const selectedOption = options.find((option) => option.value === value)

  // Función personalizada para filtrar opciones
  const filterOptions = React.useCallback(
    (inputValue: string) => {
      if (!inputValue) return options

      const lowerCaseInput = inputValue.toLowerCase()

      return options.filter((option) => {
        const labelMatch = option.label.toLowerCase().includes(lowerCaseInput)
        const searchTermsMatch = option.searchTerms?.toLowerCase().includes(lowerCaseInput)

        return labelMatch || searchTermsMatch
      })
    },
    [options],
  )

  const [filteredOptions, setFilteredOptions] = React.useState(options)
  const [inputValue, setInputValue] = React.useState("")

  // Actualizar opciones filtradas cuando cambia el input
  React.useEffect(() => {
    setFilteredOptions(filterOptions(inputValue))
  }, [inputValue, filterOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          type="button" // Asegurarse de que no se envíe el formulario al hacer clic
        >
          {value && selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="border-none outline-none">
          <div className="flex items-center border-b px-3">
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={searchPlaceholder || `Buscar ${placeholder.toLowerCase()}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

