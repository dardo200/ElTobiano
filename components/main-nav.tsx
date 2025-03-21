"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  ShoppingBag,
  Gift,
  BarChart,
  Settings,
  Truck,
  Layers,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface MainNavProps {
  className?: string
}

interface User {
  id: number
  usuario: string
  rol: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ventasPendientes, setVentasPendientes] = useState(0)
  const [productosSinStock, setProductosSinStock] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchCounts = async () => {
      try {
        // Obtener conteo de ventas pendientes
        const ventasResponse = await fetch("/api/ventas/pendientes/count")
        if (ventasResponse.ok) {
          const ventasData = await ventasResponse.json()
          setVentasPendientes(ventasData.count)
        }

        // Obtener conteo de productos sin stock
        const productosResponse = await fetch("/api/productos/sin-stock/count")
        if (productosResponse.ok) {
          const productosData = await productosResponse.json()
          setProductosSinStock(productosData.count)
        }
      } catch (error) {
        console.error("Error al obtener conteos:", error)
      }
    }

    fetchUser()
    fetchCounts()

    // Actualizar cada 60 segundos
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  // Definir los enlaces según el rol
  const getNavLinks = () => {
    const adminLinks = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        active: pathname === "/dashboard",
        badge: null,
      },
      {
        href: "/productos",
        label: "Productos",
        icon: Package,
        active: pathname === "/productos" || pathname.startsWith("/productos/"),
        badge: productosSinStock > 0 ? { text: productosSinStock.toString(), variant: "destructive" as const } : null,
      },
      {
        href: "/stock",
        label: "Stock",
        icon: Layers,
        active: pathname === "/stock",
        badge: null,
      },
      {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
        active: pathname === "/clientes" || pathname.startsWith("/clientes/"),
        badge: null,
      },
      {
        href: "/ventas",
        label: "Ventas",
        icon: ShoppingCart,
        active: pathname === "/ventas" || pathname.startsWith("/ventas/"),
        badge: ventasPendientes > 0 ? { text: ventasPendientes.toString(), variant: "destructive" as const } : null,
      },
      {
        href: "/compras",
        label: "Compras",
        icon: ShoppingBag,
        active: pathname === "/compras" || pathname.startsWith("/compras/"),
        badge: null,
      },
      {
        href: "/proveedores",
        label: "Proveedores",
        icon: Truck,
        active: pathname === "/proveedores" || pathname.startsWith("/proveedores/"),
        badge: null,
      },
      {
        href: "/combos",
        label: "Combos",
        icon: Gift,
        active: pathname === "/combos" || pathname.startsWith("/combos/"),
        badge: null,
      },
      {
        href: "/reportes",
        label: "Reportes",
        icon: BarChart,
        active: pathname === "/reportes" || pathname.startsWith("/reportes/"),
        badge: null,
      },
      {
        href: "/perfil",
        label: "Perfil",
        icon: Settings,
        active: pathname === "/perfil",
        badge: null,
      },
    ]

    const despachoLinks = [
      {
        href: "/ventas",
        label: "Ventas",
        icon: ShoppingCart,
        active: pathname === "/ventas" || pathname.startsWith("/ventas/"),
        badge: ventasPendientes > 0 ? { text: ventasPendientes.toString(), variant: "destructive" as const } : null,
      },
      {
        href: "/stock",
        label: "Stock",
        icon: Layers,
        active: pathname === "/stock",
        badge: null,
      },
      {
        href: "/perfil",
        label: "Perfil",
        icon: Settings,
        active: pathname === "/perfil",
        badge: null,
      },
    ]

    if (isLoading) return []
    return user?.rol === "admin" ? adminLinks : despachoLinks
  }

  const navLinks = getNavLinks()

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "text-black dark:text-white"
              : "text-muted-foreground",
          )}
        >
          <link.icon className="mr-2 h-4 w-4" />
          {link.label}
          {link.badge && (
            <Badge variant={link.badge.variant} className="ml-2">
              {link.badge.text}
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  )
}

