import pandas as pd
import psycopg2
from psycopg2 import sql

def actualizar_proveedores_desde_excel(archivo_excel):
    """
    Actualiza los proveedores de los productos basado en un archivo Excel.
    
    Args:
        archivo_excel (str): Ruta del archivo Excel con las columnas:
                             - codigo_producto: Código del producto (TEXT)
                             - proveedor_nombre: Nombre del proveedor
    """
    # Configuración de la conexión a la base de datos
    conexion_db = {
        'host': '192.168.0.221',
        'database': 'comercio',
        'user': 'postgres',
        'password': '2502',
        'port': '5432'
    }
    
    try:
        # Leer el archivo Excel
        df = pd.read_excel(archivo_excel)
        
        # Convertir código_producto a string (por si viene como número en el Excel)
        df['codigo_producto'] = df['codigo_producto'].astype(str).str.strip()
        
        # Verificar que tenga las columnas necesarias
        if not all(col in df.columns for col in ['codigo_producto', 'proveedor_nombre']):
            raise ValueError("El archivo Excel debe contener las columnas 'codigo_producto' y 'proveedor_nombre'")
        
        # Conectar a la base de datos
        conn = psycopg2.connect(**conexion_db)
        cursor = conn.cursor()
        
        # Iniciar transacción
        conn.autocommit = False
        
        # Procesar cada fila del Excel
        for _, fila in df.iterrows():
            codigo = str(fila['codigo_producto']).strip()  # Asegurar que es string
            proveedor_nombre = fila['proveedor_nombre'].strip()
            
            try:
                # 1. Obtener el ID del proveedor basado en el nombre
                cursor.execute(
                    "SELECT id FROM Proveedor WHERE LOWER(TRIM(nombre)) = LOWER(%s)",
                    (proveedor_nombre.lower().strip(),)
                )
                resultado = cursor.fetchone()
                
                if not resultado:
                    print(f"⚠️ Proveedor no encontrado: '{proveedor_nombre}'. Saltando producto '{codigo}'")
                    continue
                    
                id_proveedor = resultado[0]
                
                # 2. Actualizar el producto con el id_proveedor
                cursor.execute(
                    "UPDATE Productos SET id_proveedor = %s WHERE TRIM(codigo) = %s",
                    (id_proveedor, codigo)
                )
                
                if cursor.rowcount == 0:
                    print(f"⚠️ Producto no encontrado con código: '{codigo}'")
                else:
                    print(f"✓ Actualizado: Producto '{codigo}' -> Proveedor '{proveedor_nombre}' (ID: {id_proveedor})")
                    
            except Exception as error:
                print(f"❌ Error procesando producto '{codigo}': {error}")
                conn.rollback()
                raise
        
        # Confirmar cambios
        conn.commit()
        print("✅ Todos los cambios se han guardado correctamente")
        
    except Exception as error:
        print(f"❌ Error general: {error}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        # Cerrar conexión
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# Ejemplo de uso
if __name__ == "__main__":
    archivo_excel = "codigo_proveedor.xlsx"  # Cambia esto por tu ruta real
    actualizar_proveedores_desde_excel(archivo_excel)