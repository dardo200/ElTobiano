import { executeQuery } from "./db"
import type { Combo, DetalleCombo } from "@/types"

export async function obtenerCombos(): Promise<Combo[]> {
  try {
    const result = await executeQuery("SELECT * FROM Combos ORDER BY nombre")
    return result.rows
  } catch (error) {
    console.error("Error al obtener combos:", error)
    throw error
  }
}

export async function obtenerComboPorId(id: number): Promise<Combo | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      // Obtener el combo
      const comboResult = await client.query("SELECT * FROM Combos WHERE id = $1", [id])

      if (comboResult.rows.length === 0) {
        return null
      }

      const combo = comboResult.rows[0]

      // Obtener los detalles del combo
      const detallesResult = await client.query(
        `
        SELECT dc.*, p.nombre as producto_nombre, p.descripcion as producto_descripcion, p.precio
        FROM DetalleCombos dc
        JOIN Productos p ON dc.id_producto = p.id
        WHERE dc.id_combo = $1
      `,
        [id],
      )

      const detalles = detallesResult.rows.map((row) => ({
        ...row,
        producto: {
          id: row.id_producto,
          nombre: row.producto_nombre,
          descripcion: row.producto_descripcion,
          precio: row.precio,
        },
      }))

      return {
        ...combo,
        detalles,
      }
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al obtener combo con id ${id}:`, error)
    throw error
  }
}

export async function obtenerComboPorCodigo(codigo: string): Promise<Combo | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      // Obtener el combo
      const comboResult = await client.query("SELECT * FROM Combos WHERE codigo = $1", [codigo])

      if (comboResult.rows.length === 0) {
        return null
      }

      const combo = comboResult.rows[0]

      // Obtener los detalles del combo
      const detallesResult = await client.query(
        `
        SELECT dc.*, p.nombre as producto_nombre, p.descripcion as producto_descripcion, p.precio
        FROM DetalleCombos dc
        JOIN Productos p ON dc.id_producto = p.id
        WHERE dc.id_combo = $1
      `,
        [combo.id],
      )

      const detalles = detallesResult.rows.map((row) => ({
        ...row,
        producto: {
          id: row.id_producto,
          nombre: row.producto_nombre,
          descripcion: row.producto_descripcion,
          precio: row.precio,
        },
      }))

      return {
        ...combo,
        detalles,
      }
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al obtener combo con código ${codigo}:`, error)
    throw error
  }
}

export async function crearCombo(
  combo: Omit<Combo, "id">,
  detalles: Omit<DetalleCombo, "id" | "id_combo">[],
): Promise<Combo> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      console.log("Creando combo con datos:", { combo, detalles })

      // Validar que los productos existan
      for (const detalle of detalles) {
        const productoResult = await client.query("SELECT id, nombre FROM Productos WHERE id = $1", [
          detalle.id_producto,
        ])

        if (productoResult.rows.length === 0) {
          throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
        }
      }

      // Verificar si el código ya existe
      if (combo.codigo) {
        const checkResult = await client.query("SELECT id FROM Combos WHERE codigo = $1", [combo.codigo])
        if (checkResult.rows.length > 0) {
          throw new Error(`Ya existe un combo con el código ${combo.codigo}`)
        }
      }

      // Insertar el combo
      const comboResult = await client.query(
        "INSERT INTO Combos (nombre, descripcion, precio_venta, codigo) VALUES ($1, $2, $3, $4) RETURNING *",
        [combo.nombre, combo.descripcion, combo.precio_venta, combo.codigo],
      )

      const nuevoCombo = comboResult.rows[0]
      console.log("Combo creado:", nuevoCombo)

      // Insertar los detalles del combo
      console.log("Insertando detalles del combo")
      for (const detalle of detalles) {
        await client.query("INSERT INTO DetalleCombos (id_combo, id_producto, cantidad) VALUES ($1, $2, $3)", [
          nuevoCombo.id,
          detalle.id_producto,
          detalle.cantidad,
        ])
      }

      await client.query("COMMIT")
      console.log("Transacción completada exitosamente")

      return nuevoCombo
    } catch (error) {
      console.error("Error en la transacción, haciendo ROLLBACK:", error)
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error al crear combo:", error)
    console.error("Detalles del error:", error.message)
    throw error
  }
}

export async function actualizarCombo(
  id: number,
  combo: Partial<Combo>,
  detalles?: Omit<DetalleCombo, "id" | "id_combo">[],
): Promise<Combo | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Actualizar el combo
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (combo.nombre !== undefined) {
        updateFields.push(`nombre = $${paramIndex}`)
        updateValues.push(combo.nombre)
        paramIndex++
      }

      if (combo.descripcion !== undefined) {
        updateFields.push(`descripcion = $${paramIndex}`)
        updateValues.push(combo.descripcion)
        paramIndex++
      }

      if (combo.precio_venta !== undefined) {
        updateFields.push(`precio_venta = $${paramIndex}`)
        updateValues.push(combo.precio_venta)
        paramIndex++
      }

      if (combo.codigo !== undefined) {
        updateFields.push(`codigo = $${paramIndex}`)
        updateValues.push(combo.codigo)
        paramIndex++
      }

      if (updateFields.length > 0) {
        updateValues.push(id)

        await client.query(`UPDATE Combos SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`, updateValues)
      }

      // Si se proporcionan detalles, actualizar los detalles del combo
      if (detalles) {
        // Eliminar los detalles existentes
        await client.query("DELETE FROM DetalleCombos WHERE id_combo = $1", [id])

        // Insertar los nuevos detalles
        for (const detalle of detalles) {
          await client.query("INSERT INTO DetalleCombos (id_combo, id_producto, cantidad) VALUES ($1, $2, $3)", [
            id,
            detalle.id_producto,
            detalle.cantidad,
          ])
        }
      }

      await client.query("COMMIT")

      // Obtener el combo actualizado
      return await obtenerComboPorId(id)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al actualizar combo con id ${id}:`, error)
    throw error
  }
}

export async function eliminarCombo(id: number): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM Combos WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al eliminar combo con id ${id}:`, error)
    throw error
  }
}

