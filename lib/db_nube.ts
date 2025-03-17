import { createClient } from "@vercel/postgres"

// Función para obtener un cliente de base de datos
export function getClient() {
  return createClient()
}

// Función para ejecutar consultas con timeout
export async function executeQuery(query: string, params: any[] = [], timeout = 5000) {
  const client = getClient()
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

    clearTimeout(timeoutId)
    return result
  } catch (error) {
    console.error("Error ejecutando consulta:", error)
    throw error
  } finally {
    clearTimeout(timeoutId!)
    await client.end()
  }
}

// Función para probar la conexión a la base de datos
export async function testConnection() {
  const client = getClient()
  try {
    
    const result = await client.query("SELECT NOW()", [], { timeout: 3000 })
    await client.end()
    return { success: true, timestamp: result.rows[0].now }
  } catch (error) {
    console.error("Error de conexión:", error)
    return { success: false, error: error.message }
  }
}

