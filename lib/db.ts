"use server"; // Asegura que este archivo solo se use en el backend

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // Aumenta el número máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Cierra las conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // Tiempo máximo para establecer una conexión
});

export async function executeQuery(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error; // Relanza el error para que lo maneje el llamador
  }
}

// Función para obtener un cliente del pool
export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Sobrescribimos la función query para añadir logs
  client.query = (...args: any[]) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  // Sobrescribimos la función release para añadir logs
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}