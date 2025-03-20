import { executeQuery } from "./db"
import type { Producto } from "@/types"

export async function obtenerProductos(): Promise<Producto[]> {
  try {
    const result = await executeQuery(`
      SELECT * FROM Productos
      ORDER BY nombre
    `)
    return result.rows
  } catch (error) {
    console.error("Error al obtener productos:", error)
    throw error
  }
}

export async function obtenerProductoPorId(id: number): Promise<Producto | null> {
  try {
    const result = await executeQuery(
      `
      SELECT * FROM Productos
      WHERE id = $1
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al obtener producto con id ${id}:`, error)
    throw error
  }
}

export async function obtenerProductoPorCodigo(codigo: string): Promise<Producto | null> {
  try {
    const result = await executeQuery(
      `
      SELECT * FROM Productos
      WHERE codigo = $1
    `,
      [codigo],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error(`Error al obtener producto con código ${codigo}:`, error)
    throw error
  }
}

export async function crearProducto(producto: Omit<Producto, "id">): Promise<Producto> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Verificar si el código ya existe
      if (producto.codigo) {
        const checkResult = await client.query("SELECT id FROM Productos WHERE codigo = $1", [producto.codigo])
        if (checkResult.rows.length > 0) {
          throw new Error(`Ya existe un producto con el código de barras ${producto.codigo}`)
        }
      } else {
        throw new Error("El código de barras es obligatorio")
      }

      // Insertar producto usando el código como ID
      const resultProducto = await client.query(
        `INSERT INTO Productos (
          nombre, 
          descripcion, 
          precio, 
          codigo, 
          precio_compra, 
          precio_mayorista, 
          codigo_proveedor,
          stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          producto.nombre,
          producto.descripcion,
          producto.precio,
          producto.codigo,
          producto.precio_compra || 0,
          producto.precio_mayorista || 0,
          producto.codigo_proveedor || "",
          producto.stock || 0,
        ],
      )

      const nuevoProducto = resultProducto.rows[0]

      await client.query("COMMIT")

      return nuevoProducto
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error al crear producto:", error)
    throw error
  }
}

export async function actualizarProducto(id: number, producto: Partial<Producto>): Promise<Producto | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())
    

    try {
      await client.query("BEGIN")

      // Verificar si el código ya existe en otro producto
      if (producto.codigo) {
        const checkResult = await client.query("SELECT id FROM Productos WHERE codigo = $1 AND id != $2", [
          producto.codigo,
          id,
        ])
        if (checkResult.rows.length > 0) {
          throw new Error(`Ya existe otro producto con el código de barras ${producto.codigo}`)
        }
      }

      // Actualizar producto
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (producto.nombre !== undefined) {
        updateFields.push(`nombre = $${paramIndex}`)
        updateValues.push(producto.nombre)
        paramIndex++
      }

      if (producto.descripcion !== undefined) {
        updateFields.push(`descripcion = $${paramIndex}`)
        updateValues.push(producto.descripcion)
        paramIndex++
      }

      if (producto.precio !== undefined) {
        updateFields.push(`precio = $${paramIndex}`)
        updateValues.push(producto.precio)
        paramIndex++
      }

      if (producto.precio_compra !== undefined) {
        updateFields.push(`precio_compra = $${paramIndex}`)
        updateValues.push(producto.precio_compra)
        paramIndex++
      }

      if (producto.precio_mayorista !== undefined) {
        updateFields.push(`precio_mayorista = $${paramIndex}`)
        updateValues.push(producto.precio_mayorista)
        paramIndex++
      }

      if (producto.codigo_proveedor !== undefined) {
        updateFields.push(`codigo_proveedor = $${paramIndex}`)
        updateValues.push(producto.codigo_proveedor)
        paramIndex++
      }

      if (producto.codigo !== undefined) {
        updateFields.push(`codigo = $${paramIndex}`)
        updateValues.push(producto.codigo)
        paramIndex++
      }

      if (producto.stock !== undefined) {
        updateFields.push(`stock = $${paramIndex}`)
        updateValues.push(producto.stock)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return null
      }

      updateValues.push(id)

      const resultProducto = await client.query(
        `UPDATE Productos SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        updateValues,
      )

      if (resultProducto.rows.length === 0) {
        await client.query("ROLLBACK")
        return null
      }

      await client.query("COMMIT")

      // Obtener el producto actualizado
      return resultProducto.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error(`Error al actualizar producto con id ${id}:`, error)
    throw error
  }
}

export async function actualizarPrecioCompra(id: number, precio_compra: number): Promise<boolean> {
  try {
    const result = await executeQuery("UPDATE Productos SET precio_compra = $1 WHERE id = $2 RETURNING id", [
      precio_compra,
      id,
    ])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al actualizar precio de compra del producto con id ${id}:`, error)
    throw error
  }
}

export async function actualizarStock(id: number, cantidad: number): Promise<boolean> {
  try {
    const result = await executeQuery("UPDATE Productos SET stock = stock + $1 WHERE id = $2 RETURNING id", [
      cantidad,
      id,
    ])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al actualizar stock del producto con id ${id}:`, error)
    throw error
  }
}

export async function eliminarProducto(id: number): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM Productos WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error al eliminar producto con id ${id}:`, error)
    throw error
  }
}

export async function buscarProductos(termino: string): Promise<Producto[]> {
  try {
    const result = await executeQuery(
      `
      SELECT * FROM Productos
      WHERE nombre ILIKE $1 OR descripcion ILIKE $1 OR codigo = $2 OR codigo_proveedor = $2
      ORDER BY nombre
    `,
      [`%${termino}%`, termino],
    )

    return result.rows
  } catch (error) {
    console.error(`Error al buscar productos con término "${termino}":`, error)
    throw error
  }
}

// Agregar esta función al final del archivo
export async function contarProductosSinStock(): Promise<number> {
  try {
    const result = await executeQuery(
      `
      SELECT COUNT(*) as count
      FROM Productos
      WHERE stock = 0 OR stock IS NULL
    `,
    )
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error("Error al contar productos sin stock:", error)
    throw error
  }
}

// Modificar esta función para soportar los nuevos parámetros
export async function obtenerProductosStockBajo(limite: number, exacto = false, minimo = 0): Promise<Producto[]> {
  try {
    let query = `
      SELECT * FROM Productos
    `

    const params = []

    if (exacto) {
      // Si exacto es true, buscar productos con stock exactamente igual a 'minimo'
      query += ` WHERE stock = $1`
      params.push(minimo)
    } else if (minimo > 0) {
      // Si hay un mínimo, buscar productos con stock entre minimo y limite
      query += ` WHERE stock >= $1 AND stock < $2`
      params.push(minimo, limite)
    } else {
      // Caso normal: buscar productos con stock menor que limite
      query += ` WHERE stock < $1`
      params.push(limite)
    }

    query += ` ORDER BY stock ASC`

    const result = await executeQuery(query, params)
    return result.rows
  } catch (error) {
    console.error(`Error al obtener productos con stock bajo:`, error)
    throw error
  }
}

// Agregar esta función al archivo existente
export async function verificarCodigoExiste(codigo: string): Promise<boolean> {
  try {
    const result = await executeQuery(
      `
      SELECT COUNT(*) as count
      FROM Productos
      WHERE codigo = $1
      UNION ALL
      SELECT COUNT(*) as count
      FROM Combos
      WHERE codigo = $1
      `,
      [codigo],
    )

    // Sumar los resultados de ambas consultas
    const totalCount = result.rows.reduce((sum, row) => sum + Number.parseInt(row.count), 0)

    return totalCount > 0
  } catch (error) {
    console.error(`Error al verificar si el código ${codigo} existe:`, error)
    throw error
  }
}

