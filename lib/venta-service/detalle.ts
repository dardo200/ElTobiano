import type { DetalleVenta } from "@/types"

// Función para obtener detalles de un combo modificado
export async function obtenerDetallesComboModificado(detalle: DetalleVenta): Promise<any[]> {
  if (!detalle.es_combo || !detalle.datos_combo_modificado) {
    return []
  }

  try {
    // Parsear los datos del combo modificado
    const items = JSON.parse(detalle.datos_combo_modificado)

    // Obtener información adicional de cada producto
    const productosCompletos = []
    const client = await import("../db").then((module) => module.getClient())

    try {
      for (const item of items) {
        const productoResult = await client.query(
          `SELECT id, nombre, codigo, descripcion FROM Productos WHERE id = $1`,
          [item.id_producto],
        )

        if (productoResult.rows.length > 0) {
          productosCompletos.push({
            ...item,
            ...productoResult.rows[0],
          })
        } else {
          productosCompletos.push(item) // Mantener al menos los datos básicos
        }
      }

      return productosCompletos
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al obtener detalles de combo modificado:", error)
    return []
  }
}

// Función para procesar un combo modificado
export async function procesarComboModificado(
  client: any,
  ventaId: number,
  detalle: any,
  esActualizacion = false,
): Promise<void> {
  console.log("Procesando combo modificado:", detalle)

  // Insert the detail as a combo and store the modified combo information
  const detalleVentaResult = await client.query(
    "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo, datos_combo_modificado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [
      ventaId,
      detalle.id_producto,
      detalle.cantidad,
      detalle.precio,
      true,
      JSON.stringify(
        detalle.items.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        })),
      ),
    ],
  )

  // Process each item in the modified combo
  for (const item of detalle.items) {
    // Update stock for each product in the modified combo
    if (!esActualizacion) {
      await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
        item.cantidad * detalle.cantidad,
        item.id_producto,
      ])
    }
  }
}

// Función para procesar un combo normal
export async function procesarComboNormal(
  client: any,
  ventaId: number,
  detalle: any,
  esActualizacion = false,
): Promise<void> {
  // Verificar que el combo exista
  const comboCheck = await client.query("SELECT id FROM Combos WHERE id = $1", [detalle.id_producto])
  if (comboCheck.rows.length === 0) {
    throw new Error(`El combo con ID ${detalle.id_producto} no existe`)
  }

  // Primero, eliminar la restricción de clave foránea si existe
  try {
    await client.query(`
      ALTER TABLE DetalleVentas 
      DROP CONSTRAINT IF EXISTS detalleventas_id_producto_fkey
    `)
  } catch (error) {
    console.error("Error al eliminar la restricción de clave foránea:", error)
    // Continuar incluso si hay un error, ya que la restricción podría no existir
  }

  // Insertar el detalle de venta con el combo
  await client.query(
    "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
    [ventaId, detalle.id_producto, detalle.cantidad, detalle.precio, true],
  )

  // Si es un combo, obtener los productos del combo y actualizar el stock
  if (!esActualizacion) {
    const comboDetallesResult = await client.query(
      "SELECT id_producto, cantidad FROM DetalleCombos WHERE id_combo = $1",
      [detalle.id_producto],
    )

    for (const comboDetalle of comboDetallesResult.rows) {
      await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
        comboDetalle.cantidad * detalle.cantidad,
        comboDetalle.id_producto,
      ])
    }
  }
}

// Función para procesar un producto normal
export async function procesarProductoNormal(
  client: any,
  ventaId: number,
  detalle: any,
  esActualizacion = false,
): Promise<void> {
  // Verificar que el producto exista
  const productoCheck = await client.query("SELECT id FROM Productos WHERE id = $1", [detalle.id_producto])
  if (productoCheck.rows.length === 0) {
    throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
  }

  // Insertar el detalle de venta con el producto
  await client.query(
    "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
    [ventaId, detalle.id_producto, detalle.cantidad, detalle.precio, false],
  )

  // Actualizar el stock directamente en la tabla Productos
  if (!esActualizacion) {
    await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [detalle.cantidad, detalle.id_producto])
  }
}

