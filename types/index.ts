export interface Usuario {
  id: number
  usuario: string
  password?: string
  rol: string
}

// En la interfaz Producto, agregar el campo id_proveedor
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
  id_proveedor?: number // Nuevo campo para relacionar con la tabla Proveedor
  proveedor?: Proveedor // Campo para almacenar los datos del proveedor relacionado
}

export interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string
  direccion: string
  dni?: string // Nuevo campo DNI
  provincia?: string // Nuevo campo Provincia
  ciudad?: string // Nuevo campo Ciudad
  cp?: string // Nuevo campo Código Postal
}

// Actualizar la interfaz Venta para incluir los nuevos campos
export interface Venta {
  id: number
  id_cliente: number
  fecha: string
  total: number
  cerrado: boolean
  estado: "Pendiente" | "Para embalar" | "Despachado" | "Completado"
  cliente?: Cliente
  detalles?: DetalleVenta[]
  // Nuevos campos
  medio_comunicacion?: string
  dato_comunicacion?: string
  correo_usado?: string
  pago_envio?: string
  cuenta_transferencia?: string
  comprobante_pago?: string
  requiere_factura?: boolean
  numero_factura?: string
  numero_seguimiento?: string
}

export interface DetalleVenta {
  id: number
  id_venta: number
  id_producto: number
  cantidad: number
  precio: number
  producto?: {
    id: number
    nombre: string
    precio: number
    descripcion?: string
    codigo?: string
  }
  es_combo?: boolean
  es_mayorista?: boolean
  datos_combo_modificado?: string // Campo para almacenar los detalles de un combo modificado
  combo_modificado?: boolean // Propiedad para indicar si el combo ha sido modificado
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

