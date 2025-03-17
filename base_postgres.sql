-- Creación de la tabla de Proveedores
CREATE TABLE IF NOT EXISTS Proveedor (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT
);

-- Creación de la tabla de Productos
CREATE TABLE IF NOT EXISTS Productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    codigo TEXT
);

-- Creación de la tabla de Compras con relación a Proveedor
CREATE TABLE IF NOT EXISTS Compras (
    id SERIAL PRIMARY KEY,
    id_proveedor INTEGER,
    fecha DATE NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id) ON DELETE SET NULL
);

-- Creación de la tabla de DetalleCompras para registrar los productos comprados
CREATE TABLE IF NOT EXISTS DetalleCompras (
    id SERIAL PRIMARY KEY,
    id_compra INTEGER,
    id_producto INTEGER,
    cantidad INTEGER NOT NULL,
    precio REAL NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES Compras(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

-- Creación de la tabla de Clientes
CREATE TABLE IF NOT EXISTS Clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT
);

-- Creación de la tabla de Ventas con relación a Clientes
CREATE TABLE IF NOT EXISTS Ventas (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER,
    fecha DATE NOT NULL,
    total REAL NOT NULL,
    cerrado BOOLEAN,
    estado TEXT DEFAULT 'Pendiente',
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id) ON DELETE SET NULL
);

-- Creación de la tabla de DetalleVentas para registrar los productos vendidos
CREATE TABLE IF NOT EXISTS DetalleVentas (
    id SERIAL PRIMARY KEY,
    id_venta INTEGER,
    id_producto INTEGER,
    cantidad INTEGER NOT NULL,
    precio REAL NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE,
    es_combo BOOLEAN
); 

-- Creación de la tabla de Cierres del Día para control financiero
CREATE TABLE IF NOT EXISTS CierresDia (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    total_ventas REAL NOT NULL,
    total_compras REAL NOT NULL,
    ganancias REAL NOT NULL
);

-- Creación de la tabla de Combos
CREATE TABLE IF NOT EXISTS Combos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta REAL NOT NULL,
    codigo TEXT
);

-- Creación de la tabla de DetalleCombos para registrar los productos en cada combo
CREATE TABLE IF NOT EXISTS DetalleCombos (
    id SERIAL PRIMARY KEY,
    id_combo INTEGER,
    id_producto INTEGER,
    cantidad INTEGER NOT NULL,
    FOREIGN KEY (id_combo) REFERENCES Combos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

-- Creación de la tabla de Usuarios para el sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL
);

-- Creación de la tabla de Stock para registrar la cantidad disponible de cada producto
CREATE TABLE IF NOT EXISTS Stock (
    id_producto INTEGER PRIMARY KEY,
    cantidad INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

-- Creación de índices para mejorar la performance en búsquedas
CREATE INDEX idx_productos_nombre ON Productos(nombre);
CREATE INDEX idx_ventas_fecha ON Ventas(fecha);
CREATE INDEX idx_compras_fecha ON Compras(fecha);

-- Índice para buscar productos por código
CREATE INDEX idx_productos_codigo ON Productos(codigo);

-- Índices en claves foráneas para acelerar joins y búsquedas
CREATE INDEX idx_compras_proveedor ON Compras(id_proveedor);
CREATE INDEX idx_detallecompras_compra ON DetalleCompras(id_compra);
CREATE INDEX idx_detallecompras_producto ON DetalleCompras(id_producto);
CREATE INDEX idx_detalleventas_venta ON DetalleVentas(id_venta);
CREATE INDEX idx_detalleventas_producto ON DetalleVentas(id_producto);

-- Índice en fecha de cierres para consultas por rango de tiempo
CREATE INDEX idx_cierresdia_fecha ON CierresDia(fecha);

-- Índices para acelerar búsquedas de clientes por nombre, email y teléfono
CREATE INDEX idx_clientes_nombre ON Clientes(nombre);
CREATE INDEX idx_clientes_email ON Clientes(email);
CREATE INDEX idx_clientes_telefono ON Clientes(telefono);

-- Índices para acelerar búsquedas de proveedores por nombre, email y teléfono
CREATE INDEX idx_proveedores_nombre ON Proveedor(nombre);
CREATE INDEX idx_proveedores_email ON Proveedor(email);
CREATE INDEX idx_proveedores_telefono ON Proveedor(telefono);

-- Índice en usuario para optimizar autenticación
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
Corrección de Restricciones de Clave Foránea
Ejecuta el siguiente script para corregir las restricciones de clave foránea en la tabla DetalleVentas:


-- 1. Eliminar la restricción de clave foránea existente
ALTER TABLE DetalleVentas DROP CONSTRAINT IF EXISTS detalleventas_id_producto_fkey;

-- 2. Asegurarse de que la columna es_combo existe
ALTER TABLE DetalleVentas ADD COLUMN IF NOT EXISTS es_combo BOOLEAN DEFAULT FALSE;

-- 3. Crear un trigger que valide las referencias según es_combo
CREATE OR REPLACE FUNCTION validate_detalle_venta_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_combo THEN
    -- Verificar referencia a Combos
    IF NOT EXISTS (SELECT 1 FROM Combos WHERE id = NEW.id_producto) THEN
      RAISE EXCEPTION 'El combo con ID % no existe', NEW.id_producto;
    END IF;
  ELSE
    -- Verificar referencia a Productos
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = NEW.id_producto) THEN
      RAISE EXCEPTION 'El producto con ID % no existe', NEW.id_producto;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS validate_detalle_venta_reference_trigger ON DetalleVentas;
CREATE TRIGGER validate_detalle_venta_reference_trigger
BEFORE INSERT OR UPDATE ON DetalleVentas
FOR EACH ROW EXECUTE FUNCTION validate_detalle_venta_reference();