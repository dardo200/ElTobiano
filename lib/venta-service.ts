import { executeQuery } from "./db"
import type { Venta, DetalleVenta } from "@/types"

// Asegurarse de que la función obtenerVentas devuelva correctamente los datos del cliente

export async function obtenerVentas(): Promise<Venta[]> {
  try {
    const result = await executeQuery(`
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
    `)

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error("Error al obtener ventas:", error)
    throw error
  }
}

// Actualizar la función obtenerVentaPorId para incluir el nuevo campo
export async function obtenerVentaPorId(id: number): Promise<Venta | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())

    try {
      // Obtener la venta
      const ventaResult = await client.query(
        `
        SELECT v.*, c.nombre as cliente_nombre, c.email, c.telefono, c.direccion, v.medio_comunicacion, v.dato_comunicacion, v.correo_usado, v.pago_envio, v.cuenta_transferencia, v.comprobante_pago, v.requiere_factura, v.numero_factura, v.numero_seguimiento, v.pago_en_destino
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
        medio_comunicacion: venta.medio_comunicacion,
        dato_comunicacion: venta.dato_comunicacion,
        correo_usado: venta.correo_usado,
        pago_envio: venta.pago_envio,
        cuenta_transferencia: venta.cuenta_transferencia,
        comprobante_pago: venta.comprobante_pago,
        requiere_factura: venta.requiere_factura,
        numero_factura: venta.numero_factura,
        numero_seguimiento: venta.numero_seguimiento,
        pago_en_destino: venta.pago_en_destino,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(`Error al obtener venta con id ${id}:`, error)
    throw error
  }
}

// Actualizar la función crearVenta para incluir el nuevo campo
export async function crearVenta(
  venta: Omit<Venta, "id">,
  detalles: Array<
    Omit<DetalleVenta, "id" | "id_venta"> & {
      es_combo?: boolean
      combo_modificado?: boolean
      items?: { id_producto: number; cantidad: number }[]
    }
  >,
): Promise<Venta> {
  try {
    const client = await import("./db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      console.log("Creando venta con datos:", { venta, detalles })

      // Variable para controlar si hay stock suficiente para todos los productos
      let hayStockSuficiente = true
      // Array para almacenar información sobre productos sin stock suficiente
      const productosSinStockSuficiente = []

      // Validar que los productos existan y verificar si hay stock suficiente
      for (const detalle of detalles) {
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

            // Obtener información del producto
            const productoInfo = await client.query("SELECT nombre, codigo FROM Productos WHERE id = $1", [
              detalle.id_producto,
            ])

            productosSinStockSuficiente.push({
              id: detalle.id_producto,
              nombre: productoInfo.rows[0]?.nombre || `Producto #${detalle.id_producto}`,
              codigo: productoInfo.rows[0]?.codigo || "N/A",
              stockActual,
              cantidadSolicitada: detalle.cantidad,
            })

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
            `SELECT dc.id_producto, dc.cantidad, p.nombre, p.stock, p.codigo
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

              // Obtener información del combo
              const comboInfo = await client.query("SELECT nombre FROM Combos WHERE id = $1", [detalle.id_producto])

              productosSinStockSuficiente.push({
                id: comboDetalle.id_producto,
                nombre: comboDetalle.nombre,
                codigo: comboDetalle.codigo || "N/A",
                stockActual,
                cantidadSolicitada: cantidadNecesaria,
                combo: comboInfo.rows[0]?.nombre || `Combo #${detalle.id_producto}`,
              })

              console.log(
                `Stock insuficiente para el producto "${comboDetalle.nombre}" (ID: ${comboDetalle.id_producto}) del combo. Disponible: ${stockActual}, Necesario: ${cantidadNecesaria}`,
              )
            }
          }
        }
      }

      // Insertar la venta
      console.log("Insertando venta en la base de datos")

      // Siempre establecer el estado inicial como "Pendiente"
      const estadoInicial = "Pendiente"
      console.log(`Estado inicial de la venta: ${estadoInicial} (Hay stock suficiente: ${hayStockSuficiente})`)

      // En la parte donde se inserta la venta, establecer el estado como "Pendiente"
      const ventaResult = await client.query(
        "INSERT INTO Ventas (id_cliente, fecha, total, cerrado, estado, medio_comunicacion, dato_comunicacion, correo_usado, pago_envio, cuenta_transferencia, comprobante_pago, requiere_factura, numero_factura, numero_seguimiento, pago_en_destino) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
        [
          venta.id_cliente || null,
          venta.fecha || new Date(),
          venta.total,
          venta.cerrado || false,
          estadoInicial,
          venta.medio_comunicacion || null,
          venta.dato_comunicacion || null,
          venta.correo_usado || null,
          venta.pago_envio || null,
          venta.cuenta_transferencia || null,
          venta.comprobante_pago || null,
          venta.requiere_factura || false,
          venta.numero_factura || null,
          venta.numero_seguimiento || null,
          venta.pago_en_destino || false,
        ],
      )

      const nuevaVenta = ventaResult.rows[0]
      console.log("Venta creada:", nuevaVenta)

      // Insertar los detalles de la venta
      console.log("Insertando detalles de la venta")
      for (const detalle of detalles) {
        console.log("Procesando detalle:", detalle)

        // Check if this is a modified combo
        if (detalle.es_combo && detalle.combo_modificado && detalle.items) {
          console.log("Procesando combo modificado:", detalle)

          // Insert the detail as a combo and store the modified combo information
          const detalleVentaResult = await client.query(
            "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo, datos_combo_modificado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [
              nuevaVenta.id,
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

          // Ya no actualizamos el stock aquí, se hará cuando cambie a "Para embalar"
        } else if (detalle.es_combo) {
          // Original code for handling combos
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
            [nuevaVenta.id, detalle.id_producto, detalle.cantidad, detalle.precio, true],
          )

          // Ya no actualizamos el stock aquí, se hará cuando cambie a "Para embalar"
        } else {
          // Original code for handling products
          // Verificar que el producto exista
          const productoCheck = await client.query("SELECT id FROM Productos WHERE id = $1", [detalle.id_producto])
          if (productoCheck.rows.length === 0) {
            throw new Error(`El producto con ID ${detalle.id_producto} no existe`)
          }

          // Insertar el detalle de venta con el producto
          await client.query(
            "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
            [nuevaVenta.id, detalle.id_producto, detalle.cantidad, detalle.precio, false],
          )

          // Ya no actualizamos el stock aquí, se hará cuando cambie a "Para embalar"
        }
      }

      await client.query("COMMIT")
      console.log("Transacción completada exitosamente")

      return {
        ...nuevaVenta,
        hayStockSuficiente,
        productosSinStockSuficiente,
      }
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

// Modificar la función actualizarEstadoVenta para descontar stock cuando se cambia a "Para embalar"
export async function actualizarEstadoVenta(id: number, estado: string): Promise<Venta | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())

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
          } else if (detalle.datos_combo_modificado) {
            // Verificar stock para combos modificados
            try {
              const items = JSON.parse(detalle.datos_combo_modificado)

              for (const item of items) {
                const stockResult = await client.query(
                  "SELECT id, nombre, codigo, stock FROM Productos WHERE id = $1",
                  [item.id_producto],
                )

                if (stockResult.rows.length === 0) {
                  throw new Error(`El producto con ID ${item.id_producto} no existe`)
                }

                const producto = stockResult.rows[0]
                const stockActual = producto.stock
                const cantidadNecesaria = item.cantidad * detalle.cantidad

                if (stockActual < cantidadNecesaria) {
                  // Obtener información del combo
                  const comboResult = await client.query("SELECT nombre FROM Combos WHERE id = $1", [
                    detalle.id_producto,
                  ])

                  productosConStockInsuficiente.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    codigo: producto.codigo,
                    stockActual,
                    cantidadNecesaria,
                    combo: `${comboResult.rows[0]?.nombre || `Combo #${detalle.id_producto}`} (Modificado)`,
                  })
                }
              }
            } catch (error) {
              console.error("Error al procesar datos de combo modificado:", error)
              throw error
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

        // Si hay stock suficiente, actualizar el stock de los productos
        for (const detalle of detallesResult.rows) {
          if (!detalle.es_combo) {
            // Actualizar stock para productos normales
            await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
              detalle.cantidad,
              detalle.id_producto,
            ])
          } else if (detalle.datos_combo_modificado) {
            // Actualizar stock para combos modificados
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
            // Actualizar stock para combos normales
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

export async function obtenerVentasPorEstado(estado: string): Promise<Venta[]> {
  try {
    const result = await executeQuery(
      `
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      WHERE v.estado = $1
      ORDER BY v.fecha DESC
    `,
      [estado],
    )

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error(`Error al obtener ventas con estado ${estado}:`, error)
    throw error
  }
}

export async function obtenerVentasRecientes(limite = 5): Promise<Venta[]> {
  try {
    const result = await executeQuery(
      `
      SELECT v.*, c.nombre as cliente_nombre
      FROM Ventas v
      LEFT JOIN Clientes c ON v.id_cliente = c.id
      ORDER BY v.fecha DESC
      LIMIT $1
    `,
      [limite],
    )

    return result.rows.map((row) => ({
      ...row,
      cliente: row.cliente_nombre ? { id: row.id_cliente, nombre: row.cliente_nombre } : undefined,
    }))
  } catch (error) {
    console.error(`Error al obtener ventas recientes:`, error)
    throw error
  }
}

export async function contarVentasPendientes(): Promise<number> {
  try {
    const result = await executeQuery(
      `
      SELECT COUNT(*) as count
      FROM Ventas
      WHERE estado IN ('Pendiente', 'Para embalar')
    `,
    )
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error("Error al contar ventas pendientes:", error)
    throw error
  }
}

// Agregar estas funciones al archivo

// Actualizar la función actualizarVenta para incluir el nuevo campo
export async function actualizarVenta(id: number, venta: Partial<Venta>): Promise<Venta | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())

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

      // Nuevos campos
      if (venta.medio_comunicacion !== undefined) {
        updateFields.push(`medio_comunicacion = $${paramIndex}`)
        updateValues.push(venta.medio_comunicacion)
        paramIndex++
      }

      if (venta.dato_comunicacion !== undefined) {
        updateFields.push(`dato_comunicacion = $${paramIndex}`)
        updateValues.push(venta.dato_comunicacion)
        paramIndex++
      }

      if (venta.correo_usado !== undefined) {
        updateFields.push(`correo_usado = $${paramIndex}`)
        updateValues.push(venta.correo_usado)
        paramIndex++
      }

      if (venta.pago_envio !== undefined) {
        updateFields.push(`pago_envio = $${paramIndex}`)
        updateValues.push(venta.pago_envio)
        paramIndex++
      }

      if (venta.cuenta_transferencia !== undefined) {
        updateFields.push(`cuenta_transferencia = $${paramIndex}`)
        updateValues.push(venta.cuenta_transferencia)
        paramIndex++
      }

      if (venta.comprobante_pago !== undefined) {
        updateFields.push(`comprobante_pago = $${paramIndex}`)
        updateValues.push(venta.comprobante_pago)
        paramIndex++
      }

      if (venta.requiere_factura !== undefined) {
        updateFields.push(`requiere_factura = $${paramIndex}`)
        updateValues.push(venta.requiere_factura)
        paramIndex++
      }

      if (venta.numero_factura !== undefined) {
        updateFields.push(`numero_factura = $${paramIndex}`)
        updateValues.push(venta.numero_factura)
        paramIndex++
      }

      if (venta.numero_seguimiento !== undefined) {
        updateFields.push(`numero_seguimiento = $${paramIndex}`)
        updateValues.push(venta.numero_seguimiento)
        paramIndex++
      }

      if (venta.pago_en_destino !== undefined) {
        updateFields.push(`pago_en_destino = $${paramIndex}`)
        updateValues.push(venta.pago_en_destino)
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

export async function eliminarVenta(id: number): Promise<boolean> {
  try {
    const client = await import("./db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Obtener los detalles de la venta y su estado actual
      const ventaResult = await client.query("SELECT estado FROM Ventas WHERE id = $1", [id])

      if (ventaResult.rows.length === 0) {
        throw new Error(`La venta con ID ${id} no existe`)
      }

      const estadoVenta = ventaResult.rows[0].estado
      const detallesResult = await client.query("SELECT * FROM DetalleVentas WHERE id_venta = $1", [id])

      // Restaurar el stock de los productos solo si la venta estaba en estado "Para embalar" o posterior
      // ya que solo en esos estados se ha descontado el stock
      if (estadoVenta !== "Pendiente") {
        for (const detalle of detallesResult.rows) {
          if (!detalle.es_combo) {
            // Si es un producto normal, restaurar su stock directamente en la tabla Productos
            await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
              detalle.cantidad,
              detalle.id_producto,
            ])
          } else if (detalle.datos_combo_modificado) {
            // Si es un combo modificado, restaurar el stock de cada producto según los datos modificados
            try {
              const items = JSON.parse(detalle.datos_combo_modificado)
              for (const item of items) {
                await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
                  item.cantidad * detalle.cantidad,
                  item.id_producto,
                ])
              }
            } catch (error) {
              console.error("Error al procesar datos de combo modificado:", error)
              throw error
            }
          } else {
            // Si es un combo normal, obtener sus productos y restaurar el stock de cada uno
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

// Modificar esta función para que no descuente stock al actualizar detalles
export async function actualizarDetallesVenta(
  id: number,
  detalles: Array<DetalleVenta & { es_combo?: boolean; datos_combo_modificado?: string }>,
): Promise<Venta | null> {
  try {
    const client = await import("./db").then((module) => module.getClient())

    try {
      await client.query("BEGIN")

      // Obtener el estado actual de la venta
      const ventaResult = await client.query("SELECT estado FROM Ventas WHERE id = $1", [id])

      if (ventaResult.rows.length === 0) {
        throw new Error(`La venta con ID ${id} no existe`)
      }

      const estadoVenta = ventaResult.rows[0].estado

      // Obtener los detalles actuales
      const detallesActualesResult = await client.query("SELECT * FROM DetalleVentas WHERE id_venta = $1", [id])

      // Restaurar el stock de los productos actuales solo si la venta estaba en estado "Para embalar" o posterior
      if (estadoVenta !== "Pendiente") {
        for (const detalle of detallesActualesResult.rows) {
          if (!detalle.es_combo) {
            // Si es un producto normal, restaurar su stock directamente en la tabla Productos
            await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
              detalle.cantidad,
              detalle.id_producto,
            ])
          } else if (detalle.datos_combo_modificado) {
            // Si es un combo modificado, restaurar el stock de cada producto según los datos modificados
            try {
              const items = JSON.parse(detalle.datos_combo_modificado)
              for (const item of items) {
                await client.query("UPDATE Productos SET stock = stock + $1 WHERE id = $2", [
                  item.cantidad * detalle.cantidad,
                  item.id_producto,
                ])
              }
            } catch (error) {
              console.error("Error al procesar datos de combo modificado:", error)
              throw error
            }
          } else {
            // Si es un combo normal, obtener sus productos y restaurar el stock de cada uno
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

            // Para combos modificados, actualizar el stock basado en los datos modificados solo si la venta está en estado "Para embalar" o posterior
            if (estadoVenta !== "Pendiente") {
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
            }
          } else {
            // Si es un combo normal, insertar sin datos de modificación
            await client.query(
              "INSERT INTO DetalleVentas (id_venta, id_producto, cantidad, precio, es_combo) VALUES ($1, $2, $3, $4, $5)",
              [id, detalle.id_producto, detalle.cantidad, detalle.precio, true],
            )

            // Si es un combo normal, obtener sus productos y actualizar el stock de cada uno solo si la venta está en estado "Para embalar" o posterior
            if (estadoVenta !== "Pendiente") {
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

          // Si es un producto normal, actualizar su stock directamente en la tabla Productos solo si la venta está en estado "Para embalar" o posterior
          if (estadoVenta !== "Pendiente") {
            await client.query("UPDATE Productos SET stock = stock - $1 WHERE id = $2", [
              detalle.cantidad,
              detalle.id_producto,
            ])
          }
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

// Agregar al final del archivo
export async function obtenerDetallesComboModificado(detalle: DetalleVenta): Promise<any[]> {
  if (!detalle.es_combo || !detalle.datos_combo_modificado) {
    return []
  }

  try {
    // Parsear los datos del combo modificado
    const items = JSON.parse(detalle.datos_combo_modificado)

    // Obtener información adicional de cada producto
    const productosCompletos = []
    const client = await import("./db").then((module) => module.getClient())

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

// Función para verificar el stock sin crear la venta
export async function verificarStockVenta(
  detalles: Array<
    Omit<DetalleVenta, "id" | "id_venta"> & {
      es_combo?: boolean
      combo_modificado?: boolean
      items?: { id_producto: number; cantidad: number }[]
    }
  >,
): Promise<{ hayStockSuficiente: boolean; productosSinStockSuficiente: any[] }> {
  try {
    const client = await import("./db").then((module) => module.getClient())

    try {
      // Variable para controlar si hay stock suficiente para todos los productos
      let hayStockSuficiente = true
      // Array para almacenar información sobre productos sin stock suficiente
      const productosSinStockSuficiente = []

      // Validar que los productos existan y verificar si hay stock suficiente
      for (const detalle of detalles) {
        console.log("Verificando stock para detalle:", detalle)

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

          // Verificar si hay stock suficiente
          if (stockActual < detalle.cantidad) {
            hayStockSuficiente = false

            productosSinStockSuficiente.push({
              id: detalle.id_producto,
              nombre: producto.nombre,
              codigo: producto.codigo || "N/A",
              stockActual,
              cantidadSolicitada: detalle.cantidad,
            })

            console.log(
              `Stock insuficiente para el producto "${producto.nombre}" (ID: ${detalle.id_producto}). Disponible: ${stockActual}, Solicitado: ${detalle.cantidad}`,
            )
          }
        } else if (detalle.combo_modificado && detalle.items) {
          // Verificar stock para combos modificados
          for (const item of detalle.items) {
            const stockResult = await client.query("SELECT id, nombre, codigo, stock FROM Productos WHERE id = $1", [
              item.id_producto,
            ])

            if (stockResult.rows.length === 0) {
              throw new Error(`El producto con ID ${item.id_producto} no existe`)
            }

            const producto = stockResult.rows[0]
            const stockActual = producto.stock
            const cantidadNecesaria = item.cantidad

            // Verificar si hay stock suficiente
            if (stockActual < cantidadNecesaria) {
              hayStockSuficiente = false

              productosSinStockSuficiente.push({
                id: item.id_producto,
                nombre: producto.nombre,
                codigo: producto.codigo || "N/A",
                stockActual,
                cantidadSolicitada: cantidadNecesaria,
                combo: "Combo modificado",
              })

              console.log(
                `Stock insuficiente para el producto "${producto.nombre}" (ID: ${item.id_producto}) del combo modificado. Disponible: ${stockActual}, Necesario: ${cantidadNecesaria}`,
              )
            }
          }
        } else {
          // Verificar stock para combos normales
          const comboResult = await client.query("SELECT id, nombre FROM Combos WHERE id = $1", [detalle.id_producto])

          if (comboResult.rows.length === 0) {
            throw new Error(`El combo con ID ${detalle.id_producto} no existe`)
          }

          const combo = comboResult.rows[0]

          // Verificar stock para cada producto del combo
          const comboDetallesResult = await client.query(
            `SELECT dc.id_producto, dc.cantidad, p.nombre, p.codigo, p.stock
             FROM DetalleCombos dc
             JOIN Productos p ON dc.id_producto = p.id
             WHERE dc.id_combo = $1`,
            [detalle.id_producto],
          )

          for (const comboDetalle of comboDetallesResult.rows) {
            const stockActual = comboDetalle.stock
            const cantidadNecesaria = comboDetalle.cantidad * detalle.cantidad

            // Verificar si hay stock suficiente
            if (stockActual < cantidadNecesaria) {
              hayStockSuficiente = false

              productosSinStockSuficiente.push({
                id: comboDetalle.id_producto,
                nombre: comboDetalle.nombre,
                codigo: comboDetalle.codigo || "N/A",
                stockActual,
                cantidadSolicitada: cantidadNecesaria,
                combo: combo.nombre,
              })

              console.log(
                `Stock insuficiente para el producto "${comboDetalle.nombre}" (ID: ${comboDetalle.id_producto}) del combo "${combo.nombre}". Disponible: ${stockActual}, Necesario: ${cantidadNecesaria}`,
              )
            }
          }
        }
      }

      return {
        hayStockSuficiente,
        productosSinStockSuficiente,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al verificar stock:", error)
    throw error
  }
}
