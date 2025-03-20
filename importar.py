import pandas as pd
import psycopg2
from psycopg2 import sql

# Configuración de la base de datos
DB_CONFIG = {
    "dbname": "comercio",  # Nombre de la base de datos
    "user": "postgres",    # Usuario de PostgreSQL
    "password": "2502",    # Contraseña de PostgreSQL
    "host": "192.168.0.221",  # Host de la base de datos
    "port": "5432"         # Puerto de PostgreSQL
}

# Ruta al archivo Excel
EXCEL_FILE = "datos.xlsx"

# Función para conectar a la base de datos
def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

# Función para cargar datos desde Excel a la base de datos
def cargar_datos_desde_excel():
    # Leer las hojas del Excel
    try:
        productos_df = pd.read_excel(EXCEL_FILE, sheet_name="productos")
        proveedor_df = pd.read_excel(EXCEL_FILE, sheet_name="proveedores")
    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        return

    # Conectar a la base de datos
    conn = connect_db()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        # Cargar datos de productos
        for _, row in productos_df.iterrows():
            query = sql.SQL("""
                INSERT INTO Productos (nombre, descripcion, precio, codigo, precio_compra, precio_mayorista, codigo_proveedor)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """)
            cursor.execute(query, (
                row["nombre"],
                row["descripcion"],
                row["precio"],
                row["codigo"],
                row["precio_compra"],
                row["precio_mayorista"],
                row["codigo_proveedor"]
            ))

        # Cargar datos de proveedor
        for _, row in proveedor_df.iterrows():
            query = sql.SQL("""
                INSERT INTO Proveedor (nombre, telefono, email, direccion, envio)
                VALUES (%s, %s, %s, %s, %s)
            """)
            cursor.execute(query, (
                row["nombre"],
                row["telefono"],
                row["email"],
                row["direccion"],
                row["envio"]
            ))

        # Confirmar los cambios en la base de datos
        conn.commit()
        print("Datos cargados exitosamente.")

    except Exception as e:
        print(f"Error al insertar datos: {e}")
        conn.rollback()  # Revertir cambios en caso de error

    finally:
        # Cerrar la conexión
        cursor.close()
        conn.close()

# Ejecutar la función para cargar datos
if __name__ == "__main__":
    cargar_datos_desde_excel()