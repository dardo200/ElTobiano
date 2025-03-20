import { testConnection } from "../lib/db"

async function main() {
  console.log("Probando conexión a la base de datos...")
  const result = await testConnection()

  if (result.success) {
    console.log("Conexión exitosa!")
    console.log("Timestamp del servidor:", result.timestamp)
  } else {
    console.error("Error de conexión:", result.error)
  }
}

main().catch(console.error)

