import { Pool } from "pg"

// Configuración de la conexión a la base de datos local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:2502@192.168.0.221:5432/comercio",
})

// Función para obtener un cliente de base de datos
export function getClient() {
  return pool.connect()
}

// Función para ejecutar consultas con timeout
export async function executeQuery(query: string, params: any[] = [], timeout = 5000) {
  const client = await pool.connect()
  let timeoutId: NodeJS.Timeout

  try {
    // Crear una promesa que se rechaza después del timeout
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`La consulta excedió el tiempo límite de ${timeout}ms`))
      }, timeout)
    })

    // Ejecutar la consulta con un timeout
    const queryPromise = client.query(query, params)
    const result = (await Promise.race([queryPromise, timeoutPromise])) as any

    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    console.error("Error ejecutando consulta:", error)
    throw error
  } finally {
    clearTimeout(timeoutId!)
    client.release()
  }
}

// Función para probar la conexión a la base de datos
export async function testConnection() {
  try {
    const result = await executeQuery("SELECT NOW()", [], 3000)
    return { success: true, timestamp: result.rows[0].now }
  } catch (error) {
    console.error("Error de conexión:", error)
    return { success: false, error: error.message }
  }
}

