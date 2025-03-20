-- Creación de la base de datos
CREATE DATABASE comercio;

-- Conectar a la base de datos recién creada
\c comercio;

-- Creación de tablas principales
CREATE TABLE IF NOT EXISTS Proveedor (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT
);

CREATE TABLE IF NOT EXISTS Productos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    codigo TEXT,
    precio_compra REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT
);

CREATE TABLE IF NOT EXISTS Combos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta REAL NOT NULL,
    codigo TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL
);

-- Creación de tablas de transacciones
CREATE TABLE IF NOT EXISTS Compras (
    id SERIAL PRIMARY KEY,
    id_proveedor INTEGER,
    fecha DATE NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (id_proveedor) REFERENCES Proveedor(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS DetalleCompras (
    id SERIAL PRIMARY KEY,
    id_compra INTEGER,
    id_producto INTEGER,
    cantidad INTEGER NOT NULL,
    precio REAL NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES Compras(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Ventas (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER,
    fecha DATE NOT NULL,
    total REAL NOT NULL,
    cerrado BOOLEAN,
    estado TEXT DEFAULT 'Pendiente',
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id) ON DELETE SET NULL
);

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

CREATE TABLE IF NOT EXISTS CierresDia (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    total_ventas REAL NOT NULL,
    total_compras REAL NOT NULL,
    ganancias REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS DetalleCombos (
    id SERIAL PRIMARY KEY,
    id_combo INTEGER,
    id_producto INTEGER,
    cantidad INTEGER NOT NULL,
    FOREIGN KEY (id_combo) REFERENCES Combos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Stock (
    id_producto INTEGER PRIMARY KEY,
    cantidad INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

-- Creación de índices
CREATE INDEX idx_productos_nombre ON Productos(nombre);
CREATE INDEX idx_ventas_fecha ON Ventas(fecha);
CREATE INDEX idx_compras_fecha ON Compras(fecha);
CREATE INDEX idx_productos_codigo ON Productos(codigo);
CREATE INDEX idx_compras_proveedor ON Compras(id_proveedor);
CREATE INDEX idx_detallecompras_compra ON DetalleCompras(id_compra);
CREATE INDEX idx_detallecompras_producto ON DetalleCompras(id_producto);
CREATE INDEX idx_detalleventas_venta ON DetalleVentas(id_venta);
CREATE INDEX idx_detalleventas_producto ON DetalleVentas(id_producto);
CREATE INDEX idx_cierresdia_fecha ON CierresDia(fecha);
CREATE INDEX idx_clientes_nombre ON Clientes(nombre);
CREATE INDEX idx_clientes_email ON Clientes(email);
CREATE INDEX idx_clientes_telefono ON Clientes(telefono);
CREATE INDEX idx_proveedores_nombre ON Proveedor(nombre);
CREATE INDEX idx_proveedores_email ON Proveedor(email);
CREATE INDEX idx_proveedores_telefono ON Proveedor(telefono);
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);

-- Corrección de restricciones de clave foránea en DetalleVentas
ALTER TABLE DetalleVentas DROP CONSTRAINT IF EXISTS detalleventas_id_producto_fkey;
ALTER TABLE DetalleVentas ADD COLUMN IF NOT EXISTS es_combo BOOLEAN DEFAULT FALSE;

-- Creación de función y trigger para validar referencias en DetalleVentas
CREATE OR REPLACE FUNCTION validate_detalle_venta_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_combo THEN
    IF NOT EXISTS (SELECT 1 FROM Combos WHERE id = NEW.id_producto) THEN
      RAISE EXCEPTION 'El combo con ID % no existe', NEW.id_producto;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM Productos WHERE id = NEW.id_producto) THEN
      RAISE EXCEPTION 'El producto con ID % no existe', NEW.id_producto;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_detalle_venta_reference_trigger ON DetalleVentas;
CREATE TRIGGER validate_detalle_venta_reference_trigger
BEFORE INSERT OR UPDATE ON DetalleVentas
FOR EACH ROW EXECUTE FUNCTION validate_detalle_venta_reference();



INSERT INTO usuarios (usuario, password,   rol)
VALUES ('despacho', '$2b$10$zrsQMbH9MrWizGvN1uoKGOV1CVwQcJaAw8IAnjK3M4.WSjzn1V9Mu', 'despacho')
ON CONFLICT (usuario) DO NOTHING;

-- Crear usuario con rol administracion
INSERT INTO usuarios (usuario, password, rol)
VALUES ('administracion', '$2b$10$kE.zqrJ8r/czRADHSLQanePVnVizi.n8JdAyRTsasf/g22/16AZt.', 'administracion')
ON CONFLICT (usuario) DO NOTHING;