Sistema de Gestión de Comercio
Este proyecto es un sistema de gestión de comercio que permite administrar proveedores, productos, compras, ventas, clientes, combos y usuarios. Está construido con una base de datos PostgreSQL y una interfaz de usuario moderna.

Estructura de la Base de Datos
La base de datos está compuesta por las siguientes tablas:

Tablas Principales
Proveedor: Almacena información de los proveedores.

Productos: Registra los productos disponibles.

Compras: Registra las compras realizadas a los proveedores.

DetalleCompras: Detalla los productos comprados en cada compra.

Clientes: Almacena información de los clientes.

Ventas: Registra las ventas realizadas a los clientes.

DetalleVentas: Detalla los productos vendidos en cada venta.

CierresDia: Registra los cierres diarios con totales de ventas, compras y ganancias.

Combos: Almacena información de los combos disponibles.

DetalleCombos: Detalla los productos que componen cada combo.

usuarios: Gestiona los usuarios del sistema.

Stock: Registra la cantidad disponible de cada producto.

Índices
Se han creado índices para optimizar las búsquedas y consultas en las tablas, como:

Índices en nombres, códigos y fechas.

Índices en claves foráneas para acelerar JOINs.

0. instalaciones necesarias:
-postgresql-17.4-1-windows-x64  https://www.postgresql.org/download/
path: C:\Program Files\PostgreSQL\17\bin
psql --version

-node-v22.14.0-x64  https://nodejs.org/
node -v
path: 
npm -v

-vs_BuildTools (c++ con jdk win 10)
-configurar politica de Ejecución: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

npm install
env:
DATABASE_URL=postgresql://postgres:2502@192.168.0.221:5432/comercio
DATABASE_SSL=false

psql -U postgres -d comercio -f base_postgres.sql

agregar C:\Program Files\PostgreSQL\17\data\pg_hba.conf:
host    comercio    postgres    192.168.0.221/32    md5
host    comercio    postgres    0.0.0.0/24    md5

Reinicia el servicio de PostgreSQL
Abre el Firewall de Windows y permite el puerto 5432 para conexiones entrantes.

Instrucciones de Configuración
1. Configuración de la Base de Datos
Local
Conexión local:

Cadena de conexión: postgresql://postgres:2502@192.168.0.221:5432/comercio

SSL: false

Variables de entorno:

DATABASE_URL: postgresql://postgres:2502@192.168.0.221:5432/comercio

DATABASE_SSL: false

Neon (PostgreSQL en la nube)
Conexión a Neon:

Cadena de conexión: postgres://neondb_owner:npg_GI3QXEtBgYR8@plain-snow-78058276.us-west-2.aws.neon.tech/amused-porpoise-37_db_7696427?options=project%3Dplain-snow-78058276&sslmode=require

Variables de entorno:

DATABASE_URL: Usar la cadena de conexión de Neon.

DATABASE_SSL: true

JWT_SECRET: ElTobiano

2. Ejecución del Proyecto
Clonar el repositorio:

git clone <url-del-repositorio>
cd <nombre-del-repositorio>
Instalar dependencias:

npm install
Configurar variables de entorno:

Crear un archivo .env en la raíz del proyecto con las siguientes variables:

DATABASE_URL=postgresql://postgres:2502@192.168.0.221:5432/comercio
DATABASE_SSL=false
Ejecutar el proyecto:


npm run dev

npm run build (prod)
y luego 
npm start

Notas Adicionales
Login Page: Asegúrate de que la página de inicio de sesión esté configurada correctamente.

Hasura: Si utilizas Hasura, configura la conexión a la base de datos con la cadena proporcionada.

Contribuciones
Si deseas contribuir a este proyecto, sigue estos pasos:

Haz un fork del repositorio.

Crea una rama para tu contribución (git checkout -b feature/nueva-funcionalidad).

Realiza tus cambios y haz commit (git commit -m 'Añadir nueva funcionalidad').

Haz push a la rama (git push origin feature/nueva-funcionalidad).

Abre un Pull Request.

Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

¡Gracias por usar este sistema de gestión de comercio! Si tienes alguna pregunta, no dudes en contactarnos.
-- Agregar nuevos campos a la tabla Productos
ALTER TABLE Productos
ADD COLUMN IF NOT EXISTS precio_mayorista REAL,
ADD COLUMN IF NOT EXISTS codigo_proveedor TEXT,
ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Agregar nuevo campo a la tabla Proveedor
ALTER TABLE Proveedor
ADD COLUMN IF NOT EXISTS envio REAL;

-- Agregar nuevos campos a la tabla DetalleVentas
ALTER TABLE DetalleVentas
ADD COLUMN IF NOT EXISTS es_mayorista BOOLEAN DEFAULT FALSE;

-- Agregar nuevos campos a la tabla Compras
ALTER TABLE Compras
ADD COLUMN IF NOT EXISTS costo_envio REAL;

-- Agregar nuevos campos a la tabla DetalleCompras
ALTER TABLE DetalleCompras
ADD COLUMN IF NOT EXISTS iva_porcentaje REAL,
ADD COLUMN IF NOT EXISTS precio_con_iva REAL;

-- Agregar nuevo campo a la tabla Combos
ALTER TABLE Combos
ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Actualizar la tabla Ventas para incluir la restricción CHECK en el campo estado
ALTER TABLE Ventas
ADD CONSTRAINT check_estado 
CHECK (estado IN ('Pendiente', 'Para embalar', 'Despachado'));

-- Actualizar la tabla Stock para asegurar que la cantidad tenga un valor predeterminado
ALTER TABLE Stock
ALTER COLUMN cantidad SET DEFAULT 0;
