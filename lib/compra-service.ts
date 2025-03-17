import { executeQuery } from "./db"
import type { Compra } from "@/types"

export async function obtenerCompras(): Promise<Compra[]> {
  try {
    // Modificar la consulta para obtener el nombre real del proveedor
    const result = await executeQuery(`
      SELECT c.*, p.nombre as proveedor_nombre
      FROM Compras c
      LEFT JOIN Proveedor p ON c.id_proveedor = p.id
      ORDER BY c.fecha DESC
    `)

    return result.rows.map((row) => ({
      ...row,
      proveedor: row.proveedor_nombre ? { id: row.id_proveedor, nombre: row.proveedor_nombre } : undefined,
    }))
  } catch (error) {
    console.error("Error al obtener compras:", error)
    throw error
  }
}

export async function obtenerCompraPorId(id: number): Promise<Compra | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      // Obtener la compra
      const compraResult = await client.query(
        `
        SELECT c.*, p.nombre as proveedor_nombre, p.telefono, p.email, p.direccion
        FROM Compras c
        LEFT JOIN Proveedor p ON c.id_proveedor = p.id
        WHERE c.id = $1
      `,
        [id],
      )

      if (compraResult.rows.length === 0) {
        return null
      }

      const compra = compraResult.rows[0]

      // Obtener los detalles de la compra
      const detallesResult = await client.query(
        `
        SELECT dc.*, p.nombre as producto_nombre, p.descripcion as producto_descripcion
        FROM DetalleCompras dc
        JOIN Productos p ON dc.id_producto = p.id
        WHERE dc.id_compra = $1
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
        ...compra,
        proveedor: compra.proveedor_nombre
          ? {
              id: compra.id_proveedor,
              nombre: compra.proveedor_nombre,
              telefono: compra.telefono,
              email: compra.email,
              direccion: compra.direccion,
            }
          : undefined,
        detalles,
      }
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al obtener compra con id ${id}:`, error)
    throw error
  }
}

export async function crearCompra(
  compra: Omit<Compra, "id">,
  detalles: { id_producto: number; cantidad: number; precio: number }[],
): Promise<Compra> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Insertar la compra
      const compraResult = await client.query(
        "INSERT INTO Compras (id_proveedor, fecha, total) VALUES ($1, $2, $3) RETURNING *",
        [compra.id_proveedor, compra.fecha || new Date(), compra.total],
      )

      const nuevaCompra = compraResult.rows[0]

      // Insertar los detalles de la compra y actualizar el stock
      for (const detalle of detalles) {
        // Insertar detalle de compra
        await client.query(
          "INSERT INTO DetalleCompras (id_compra, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)",
          [nuevaCompra.id, detalle.id_producto, detalle.cantidad, detalle.precio],
        )

        // Actualizar el stock
        await client.query(
          `
          INSERT INTO Stock (id_producto, cantidad) 
          VALUES ($1, $2) 
          ON CONFLICT (id_producto) 
          DO UPDATE SET cantidad = Stock.cantidad + $2
        `,
          [detalle.id_producto, detalle.cantidad],
        )
      }

      await client.query("COMMIT")

      return nuevaCompra
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error al crear compra:", error)
    throw error
  }
}

export async function actualizarCompra(id: number, compra: Partial<Compra>): Promise<Compra | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Actualizar la compra
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (compra.id_proveedor !== undefined) {
        updateFields.push(`id_proveedor = $${paramIndex}`)
        updateValues.push(compra.id_proveedor)
        paramIndex++
      }

      if (compra.fecha !== undefined) {
        updateFields.push(`fecha = $${paramIndex}`)
        updateValues.push(compra.fecha)
        paramIndex++
      }

      if (compra.total !== undefined) {
        updateFields.push(`total = $${paramIndex}`)
        updateValues.push(compra.total)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return null
      }

      updateValues.push(id)

      const result = await client.query(
        `UPDATE Compras SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        updateValues,
      )

      if (result.rows.length === 0) {
        await client.query("ROLLBACK")
        return null
      }

      await client.query("COMMIT")

      // Obtener la compra actualizada con sus detalles
      return await obtenerCompraPorId(id)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al actualizar compra con id ${id}:`, error)
    throw error
  }
}

export async function eliminarCompra(id: number): Promise<boolean> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Obtener los detalles de la compra
      const detallesResult = await client.query("SELECT * FROM DetalleCompras WHERE id_compra = $1", [id])

      // Actualizar el stock de los productos
      for (const detalle of detallesResult.rows) {
        // Reducir el stock (ya que estamos eliminando una compra)
        await client.query("UPDATE Stock SET cantidad = cantidad - $1 WHERE id_producto = $2", [
          detalle.cantidad,
          detalle.id_producto,
        ])
      }

      // Eliminar los detalles de la compra
      await client.query("DELETE FROM DetalleCompras WHERE id_compra = $1", [id])

      // Eliminar la compra
      const result = await client.query("DELETE FROM Compras WHERE id = $1 RETURNING id", [id])

      await client.query("COMMIT")

      return result.rows.length > 0
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al eliminar compra con id ${id}:`, error)
    throw error
  }
}

