export interface Usuario {
  id: number
  usuario: string
  password?: string
  rol: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  precio_compra?: number
  precio_mayorista?: number
  codigo_proveedor?: string
  stock?: number
  codigo?: string // Agregamos campo para código de barras
}

export interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string
  direccion: string
}

export interface Venta {
  id: number
  id_cliente: number
  fecha: string
  total: number
  cerrado: boolean
  estado: "Pendiente" | "Para embalar" | "Despachado"
  cliente?: Cliente
  detalles?: DetalleVenta[]
}

export interface DetalleVenta {
  id: number
  id_venta: number
  id_producto: number
  cantidad: number
  precio: number
  producto?: Producto
  es_combo?: boolean
  es_mayorista?: boolean
}

export interface Compra {
  id: number
  id_proveedor: number
  fecha: string
  total: number
  costo_envio?: number
  proveedor?: Proveedor
  detalles?: DetalleCompra[]
}

export interface DetalleCompra {
  id: number
  id_compra: number
  id_producto: number
  cantidad: number
  precio: number
  iva_porcentaje?: number
  precio_con_iva?: number
  producto?: Producto
}

export interface Combo {
  id: number
  nombre: string
  descripcion: string
  precio_venta: number
  codigo?: string // Agregamos campo para código de barras
  detalles?: DetalleCombo[]
}

export interface DetalleCombo {
  id: number
  id_combo: number
  id_producto: number
  cantidad: number
  producto?: Producto
}

export interface CierreDia {
  id: number
  fecha: string
  total_ventas: number
  total_compras: number
  ganancias: number
}

export interface Stock {
  id_producto: number
  cantidad: number
  producto?: Producto
}

export interface DashboardStats {
  totalVentas: number
  totalProductos: number
  totalClientes: number
  ventasRecientes: Venta[]
  productosPopulares: {
    nombre: string
    cantidad: number
  }[]
  ventasPorMes: {
    mes: string
    total: number
  }[]
}

export interface Proveedor {
  id: number
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  envio?: number
}

