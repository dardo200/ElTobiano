import type { Venta } from "@/types"
import type { VentaCreateParams, VentaUpdateParams, DetalleVentaUpdateParams } from "./types"
import { obtenerVentas, obtenerVentasPorEstado, obtenerVentasRecientes, contarVentasPendientes } from "./queries"
import {
  obtenerDetallesComboModificado,
  procesarComboModificado,
  procesarComboNormal,
  procesarProductoNormal,
} from "./detalle"

// Exportar funciones de consulta
export {
  obtenerVentas,
  obtenerVentasPorEstado,
  obtenerVentasRecientes,
  contarVentasPendientes,
  obtenerDetallesComboModificado,
}

// Obtener una venta por ID
export async function obtenerVentaPorId(id: number): Promise<Venta | null> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      // Obtener la venta
      const ventaResult = await client.query(
        `
        SELECT v.*, c.nombre as cliente_nombre, c.email, c.telefono, c.direccion
        FROM Ventas v
        LEFT JOIN Clientes c ON v.id_cliente = c.id
        WHERE v.id = $1
      `,
        [id],
      )

      if (ventaResult.rows.length === 0) {
        return null
      }

      const venta = ventaResult.rows[0]

      // Obtener los detalles de la venta
      const detallesResult = await client.query(
        `
  SELECT 
    dv.*, 
    CASE 
      WHEN dv.es_combo = false THEN p.nombre 
      WHEN dv.es_combo = true THEN cb.nombre 
      ELSE NULL 
    END as producto_nombre,
    CASE 
      WHEN dv.es_combo = false THEN p.descripcion 
      WHEN dv.es_combo = true THEN cb.descripcion 
      ELSE NULL 
    END as producto_descripcion,
    CASE 
      WHEN dv.es_combo = false THEN p.codigo 
      WHEN dv.es_combo = true THEN cb.codigo 
      ELSE NULL 
    END as producto_codigo,
    dv.datos_combo_modificado
  FROM DetalleVentas dv
  LEFT JOIN Productos p ON dv.id_producto = p.id AND dv.es_combo = false
  LEFT JOIN Combos cb ON dv.id_producto = cb.id AND dv.es_combo = true
  WHERE dv.id_venta = $1
`,
        [id],
      )

      const detalles = detallesResult.rows.map((row) => ({
        ...row,
        producto: row.producto_nombre
          ? {
              id: row.id_producto,
              nombre: row.producto_nombre,
              descripcion: row.producto_descripcion,
              precio: row.precio,
              codigo: row.producto_codigo,
            }
          : undefined,
      }))

      return {
        ...venta,
        cliente: venta.cliente_nombre
          ? {
              id: venta.id_cliente,
              nombre: venta.cliente_nombre,
              email: venta.email,
              telefono: venta.telefono,
              direccion: venta.direccion,
            }
          : undefined,
        detalles,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al obtener venta con id ${id}:`, error)
    throw error
  }
}

// Crear una nueva venta
export async function crearVenta(ventaData: VentaCreateParams): Promise<Venta> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      console.log("Creando venta con datos:", ventaData)

      // Variable para controlar si hay stock suficiente para todos los productos
      let hayStockSuficiente = true

      // Validar que los productos existan y verificar si hay stock suficiente
      for (const detalle of ventaData.detalles) {
        console.log("Procesando detalle:", detalle)

        if (!detalle.es_combo) {
          // Verificar stock para productos normales
          const stockResult = await client.query("SELECT stock FROM Productos WHERE id = $1", [detalle.id_producto])

          if (stockResult.rows.length === 0) {
            throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
          }

          const stockActual = stockResult.rows[0].stock
          // Verificar si hay stock suficiente, pero permitir continuar si no lo hay
          if (stockActual < detalle.cantidad) {
            hayStockSuficiente = false
            console.log(
              `Stock insuficiente para el producto con ID ${detalle.id_producto}. Disponible: ${stockActual}, Solicitado: ${detalle.cantidad}`,
            )
          }
        } else {
          // Verificar que el combo exista
          const comboResult = await client.query("SELECT id FROM Combos WHERE id = $1", [detalle.id_producto])

          if (comboResult.rows.length === 0) {
            throw new Error(`El combo con ID ${detalle.id_producto} no existe`)
          }

          // Verificar stock para cada producto del combo
          const comboDetallesResult = await client.query(
            `SELECT dc.id_producto, dc.cantidad, p.nombre, p.stock
             FROM DetalleCombos dc
             JOIN Productos p ON dc.id_producto = p.id
             WHERE dc.id_combo = $1`,
            [detalle.id_producto],
          )

          for (const comboDetalle of comboDetallesResult.rows) {
            const stockActual = comboDetalle.stock
            const cantidadNecesaria = comboDetalle.cantidad * detalle.cantidad

            // Verificar si hay stock suficiente, pero permitir continuar si no lo hay
            if (stockActual < cantidadNecesaria) {
              hayStockSuficiente = false
              console.log(
                `Stock insuficiente para el producto "${comboDetalle.nombre}" (ID: ${comboDetalle.id_producto}) del combo. Disponible: ${stockActual}, Necesario: ${cantidadNecesaria}`,
              )
            }
          }
        }
      }

      // Insertar la venta
      console.log("Insertando venta en la base de datos")

      // Determinar el estado inicial según el stock
      const estadoInicial = hayStockSuficiente ? "Para embalar" : "Pendiente"
      console.log(`Estado inicial de la venta: ${estadoInicial} (Hay stock suficiente: ${hayStockSuficiente})`)

      // En la parte donde se inserta la venta, establecer el estado según el stock
      const ventaResult = await client.query(
        "INSERT INTO Ventas (id_cliente, fecha, total, cerrado, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          ventaData.id_cliente || null,
          ventaData.fecha || new Date(),
          ventaData.total,
          ventaData.cerrado || false,
          estadoInicial, // Estado según el stock
        ],
      )

      const nuevaVenta = ventaResult.rows[0]
      console.log("Venta creada:", nuevaVenta)

      // Insertar los detalles de la venta
      console.log("Insertando detalles de la venta")
      for (const detalle of ventaData.detalles) {
        console.log("Procesando detalle:", detalle)

        // Check if this is a modified combo
        if (detalle.es_combo && detalle.combo_modificado && detalle.items) {
          await procesarComboModificado(client, nuevaVenta.id, detalle)
        } else if (detalle.es_combo) {
          await procesarComboNormal(client, nuevaVenta.id, detalle)
        } else {
          await procesarProductoNormal(client, nuevaVenta.id, detalle)
        }
      }

      await client.query("COMMIT")
      console.log("Transacción completada exitosamente")

      return nuevaVenta
    } catch (error) {
      console.error("Error en la transacción, haciendo ROLLBACK:", error)
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al crear venta:", error)
    console.error("Detalles del error:", error.message)
    throw error
  }
}

// Actualizar el estado de una venta
export async function actualizarEstadoVenta(id: number, estado: string): Promise<Venta | null> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Si se está intentando cambiar a "Para embalar", verificar el stock
      if (estado === "Para embalar") {
        // Obtener los detalles de la venta
        const detallesResult = await client.query("SELECT * FROM DetalleVentas WHERE id_venta = $1", [id])

        // Array para almacenar productos con stock insuficiente
        const productosConStockInsuficiente = []

        // Verificar el stock para cada detalle
        for (const detalle of detallesResult.rows) {
          if (!detalle.es_combo) {
            // Verificar stock para productos normales
            const stockResult = await client.query("SELECT id, nombre, codigo, stock FROM Productos WHERE id = $1", [
              detalle.id_producto,
            ])

            if (stockResult.rows.length === 0) {
              throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
            }

            const producto = stockResult.rows[0]
            const stockActual = producto.stock

            if (stockActual < detalle.cantidad) {
              productosConStockInsuficiente.push({
                id: producto.id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                stockActual,
                cantidadNecesaria: detalle.cantidad,
              })
            }
          } else {
            // Verificar stock para cada producto del combo
            const comboDetallesResult = await client.query(
              `SELECT dc.id_producto, dc.cantidad, p.nombre, p.codigo, p.stock
             FROM DetalleCombos dc
             JOIN Productos p ON dc.id_producto = p.id
             WHERE dc.id_combo = $1`,
              [detalle.id_producto],
            )

            // Obtener el nombre del combo
            const comboResult = await client.query("SELECT nombre FROM Combos WHERE id = $1", [detalle.id_producto])
            const comboNombre =
              comboResult.rows.length > 0 ? comboResult.rows[0].nombre : `Combo #${detalle.id_producto}`

            for (const comboDetalle of comboDetallesResult.rows) {
              const stockActual = comboDetalle.stock
              const cantidadNecesaria = comboDetalle.cantidad * detalle.cantidad

              if (stockActual < cantidadNecesaria) {
                productosConStockInsuficiente.push({
                  id: comboDetalle.id_producto,
                  nombre: comboDetalle.nombre,
                  codigo: comboDetalle.codigo,
                  stockActual,
                  cantidadNecesaria,
                  combo: comboNombre,
                })
              }
            }
          }
        }

        // Si hay productos con stock insuficiente, lanzar un error con la lista completa
        if (productosConStockInsuficiente.length > 0) {
          let mensajeError = "Stock insuficiente para los siguientes productos:\n\n"

          productosConStockInsuficiente.forEach((producto) => {
            if (producto.combo) {
              mensajeError += `- ${producto.nombre} (Código: ${producto.codigo || "N/A"}, ID: ${producto.id}) del combo "${producto.combo}"\n`
            } else {
              mensajeError += `- ${producto.nombre} (Código: ${producto.codigo || "N/A"}, ID: ${producto.id})\n`
            }
            mensajeError += `  Disponible: ${producto.stockActual}, Necesario: ${producto.cantidadNecesaria}\n\n`
          })

          throw new Error(mensajeError)
        }
      }

      // Actualizar el estado de la venta
      const result = await client.query("UPDATE Ventas SET estado = $1 WHERE id = $2 RETURNING *", [estado, id])

      if (result.rows.length === 0) {
        await client.query("ROLLBACK")
        return null
      }

      await client.query("COMMIT")

      // Obtener la venta completa con sus detalles
      return await obtenerVentaPorId(id)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al actualizar estado de venta con id ${id}:`, error)
    throw error
  }
}

// Actualizar una venta
export async function actualizarVenta(id: number, venta: VentaUpdateParams): Promise<Venta | null> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Actualizar la venta
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (venta.id_cliente !== undefined) {
        updateFields.push(`id_cliente = $${paramIndex}`)
        updateValues.push(venta.id_cliente)
        paramIndex++
      }

      if (venta.estado !== undefined) {
        updateFields.push(`estado = $${paramIndex}`)
        updateValues.push(venta.estado)
        paramIndex++
      }

      if (venta.total !== undefined) {
        updateFields.push(`total = $${paramIndex}`)
        updateValues.push(venta.total)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return null
      }

      updateValues.push(id)

      const result = await client.query(
        `UPDATE Ventas SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        updateValues,
      )

      if (result.rows.length === 0) {
        await client.query("ROLLBACK")
        return null
      }

      await client.query("COMMIT")

      // Obtener la venta actualizada con sus detalles
      return await obtenerVentaPorId(id)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al actualizar venta con id ${id}:`, error)
    throw error
  }
}

// Eliminar una venta
export async function eliminarVenta(id: number): Promise<boolean> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Obtener los detalles de la venta
      const detallesResult = await client.query("SELECT * FROM DetalleVentas WHERE id_venta = $1", [id])

      // Restaurar el stock de los productos
      for (const detalle of detallesResult.rows) {
        if (!detalle.es_combo) {
          // Si es un producto normal, restaurar su stock directamente en la tabla Productos
          await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
            detalle.cantidad,
            detalle.id_producto,
          ])
        } else {
          // Si es un combo, obtener sus productos y restaurar el stock de cada uno
          const comboDetallesResult = await client.query(
            "SELECT id_producto, cantidad FROM DetalleCombos WHERE id_combo = $1",
            [detalle.id_producto],
          )

          for (const comboDetalle of comboDetallesResult.rows) {
            await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
              comboDetalle.cantidad * detalle.cantidad,
              comboDetalle.id_producto,
            ])
          }
        }
      }

      // Eliminar los detalles de la venta
      await client.query("DELETE FROM DetalleVentas WHERE id_venta = $1", [id])

      // Eliminar la venta
      const result = await client.query("DELETE FROM Ventas WHERE id = $1 RETURNING id", [id])

      await client.query("COMMIT")

      return result.rows.length > 0
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al eliminar venta con id ${id}:`, error)
    throw error
  }
}

// Actualizar los detalles de una venta
export async function actualizarDetallesVenta(
  id: number,
  detalles: Array<DetalleVentaUpdateParams>,
): Promise<Venta | null> {
  try {
    const client = await import("../db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Obtener los detalles actuales para restaurar el stock
      const detallesActualesResult = await client.query("SELECT * FROM DetalleVentas WHERE id_venta = $1", [id])

      // Restaurar el stock de los productos actuales
      for (const detalle of detallesActualesResult.rows) {
        if (!detalle.es_combo) {
          // Si es un producto normal, restaurar su stock directamente en la tabla Productos
          await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
            detalle.cantidad,
            detalle.id_producto,
          ])
        } else {
          // Si es un combo, obtener sus productos y restaurar el stock de cada uno
          const comboDetallesResult = await client.query(
            "SELECT id_producto, cantidad FROM DetalleCombos WHERE id_combo = $1",
            [detalle.id_producto],
          )

          for (const comboDetalle of comboDetallesResult.rows) {
            await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
              comboDetalle.cantidad * detalle.cantidad,
              comboDetalle.id_producto,
            ])
          }
        }
      }

      // Eliminar todos los detalles actuales
      await client.query("DELETE FROM DetalleVentas WHERE id_venta = $1", [id])

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

      // Insertar los nuevos detalles
      for (const detalle of detalles) {
        // Verificar si es un combo antes de insertar
        if (detalle.es_combo) {
          // Insertar el detalle de venta con el combo
          if (detalle.datos_combo_modificado) {
            // Si es un combo modificado, preservar los datos de modificación
            await client.query(
              "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo, datos_combo_modificado) VALUES ($1, $2, $3, $4, $5, $6)",
              [id, detalle.id_producto, detalle.cantidad, detalle.precio, true, detalle.datos_combo_modificado],
            )

            // Para combos modificados, actualizar el stock basado en los datos modificados
            try {
              const items = JSON.parse(detalle.datos_combo_modificado)
              for (const item of items) {
                await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
                  item.cantidad * detalle.cantidad,
                  item.id_producto,
                ])
              }
            } catch (error) {
              console.error("Error al procesar datos de combo modificado:", error)
              throw error
            }
          } else {
            // Si es un combo normal, insertar sin datos de modificación
            await client.query(
              "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
              [id, detalle.id_producto, detalle.cantidad, detalle.precio, true],
            )

            // Si es un combo normal, obtener sus productos y actualizar el stock de cada uno
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
        } else {
          // Verificar que el producto exista
          const productoCheck = await client.query("SELECT id FROM Productos WHERE id = $1", [detalle.id_producto])
          if (productoCheck.rows.length === 0) {
            throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
          }

          // Insertar el detalle de venta con el producto
          await client.query(
            "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
            [id, detalle.id_producto, detalle.cantidad, detalle.precio, false],
          )

          // Si es un producto normal, actualizar su stock directamente en la tabla Productos
          await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
            detalle.cantidad,
            detalle.id_producto,
          ])
        }
      }

      // Calcular el nuevo total
      const total = detalles.reduce((sum, detalle) => sum + detalle.precio * detalle.cantidad, 0)

      // Actualizar el total de la venta
      await client.query("UPDATE Ventas SET total = $1 WHERE id = $2", [total, id])

      await client.query("COMMIT")

      // Obtener la venta actualizada
      return await obtenerVentaPorId(id)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al actualizar detalles de venta con id ${id}:`, error)
    throw error
  }
}

