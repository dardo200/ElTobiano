import { Pool, PoolClient } from "pg";

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 30, // Número máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Cierra las conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 10000, // Tiempo máximo para establecer una conexión (10 segundos)
});

// Función para ejecutar consultas
export async function executeQuery(text: string, params?: any[], client?: PoolClient, timeout?: number) {
  const start = Date.now();
  const queryClient = client || (await pool.connect()); // Usar el cliente proporcionado o obtener uno nuevo
  try {
    // Agregar timeout a la consulta si se proporciona
    if (timeout) {
      await queryClient.query(`SET statement_timeout = ${timeout}`); // Timeout en milisegundos
    }

    const res = await queryClient.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  } finally {
    if (!client) {
      queryClient.release(); // Liberar la conexión solo si no se proporcionó un cliente
      console.log("Conexión liberada. Conexiones activas:", pool.totalCount, "Inactivas:", pool.idleCount);
    }
  }
}

// Función para obtener un cliente del pool
export async function getClient() {
  const client = await pool.connect();
  console.log("Nueva conexión establecida. Conexiones activas:", pool.totalCount, "Inactivas:", pool.idleCount);
  return client;
}

// Función para ejecutar transacciones
export async function executeTransaction(queries: { text: string; params?: any[] }[], timeout?: number) {
  const client = await getClient();
  try {
    await client.query("BEGIN"); // Iniciar la transacción

    for (const query of queries) {
      await executeQuery(query.text, query.params, client, timeout); // Usar el mismo cliente para todas las consultas
    }

    await client.query("COMMIT"); // Confirmar la transacción
    console.log("Transacción completada correctamente.");
  } catch (error) {
    await client.query("ROLLBACK"); // Revertir la transacción en caso de error
    console.error("Error executing transaction:", error);
    throw error;
  } finally {
    client.release(); // Liberar la conexión
    console.log("Conexión liberada. Conexiones activas:", pool.totalCount, "Inactivas:", pool.idleCount);
  }
}

// Función para monitorear el estado del pool
export function monitorPool() {
  console.log("Estado del pool - Activas:", pool.totalCount, "Inactivas:", pool.idleCount);
}

// Cerrar el pool de conexiones al finalizar la aplicación
process.on("SIGINT", async () => {
  console.log("Cerrando el pool de conexiones...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Cerrando el pool de conexiones...");
  await pool.end();
  process.exit(0);
});

// Exportar el módulo completo
export default {
  executeQuery,
  getClient,
  executeTransaction,
  monitorPool,
};