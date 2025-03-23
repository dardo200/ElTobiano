import type { Venta, DetalleVenta } from "@/types"

// Esta función se ejecutará en el cliente, por lo que importamos jspdf dinámicamente
export const generarPresupuestoPDF = async (venta: Venta): Promise<Blob> => {
  // Importar dinámicamente jspdf y jspdf-autotable
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  // Crear un nuevo documento PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Añadir logo
  try {
    const img = new Image()
    img.crossOrigin = "anonymous" // Evitar problemas CORS
    img.src = "/images/logo-empresa.png"
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      // Timeout para evitar esperar indefinidamente
      setTimeout(resolve, 3000)
    })
    doc.addImage(img, "PNG", 15, 10, 30, 30)
  } catch (error) {
    console.error("Error al cargar el logo:", error)
    // Continuar sin el logo
  }

  // Título y fecha - Ajustado para evitar superposición
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("PRESUPUESTO", 105, 25, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Nº: ${venta.id}`, 105, 35, { align: "center" })
  doc.text(`Fecha: ${new Date(venta.fecha).toLocaleDateString()}`, 105, 42, { align: "center" })



  // Información del cliente
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("CLIENTE:", 15, 55)

  doc.setFont("helvetica", "normal")
  if (venta.cliente) {
    doc.text(`Nombre: ${venta.cliente.nombre}`, 15, 62)
    if (venta.cliente.dni) doc.text(`DNI/CUIT: ${venta.cliente.dni}`, 15, 69)
    if (venta.cliente.email) doc.text(`Email: ${venta.cliente.email}`, 15, 76)
    if (venta.cliente.telefono) doc.text(`Teléfono: ${venta.cliente.telefono}`, 15, 83)
    if (venta.cliente.direccion) doc.text(`Dirección: ${venta.cliente.direccion}`, 15, 90)
  } else {
    doc.text("Cliente no registrado", 15, 62)
  }

  // Tabla de productos
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("DETALLE DE PRODUCTOS:", 15, 105)

  const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"]
  const tableRows: any[] = []

  // Verificar que venta.detalles exista y tenga elementos
  if (venta.detalles && venta.detalles.length > 0) {
    // Añadir filas a la tabla
    venta.detalles.forEach((detalle: DetalleVenta) => {
      const precio = detalle.precio || 0
      const cantidad = detalle.cantidad || 0
      const subtotal = precio * cantidad

      // Obtener el nombre del producto
      let productoNombre = "Producto sin nombre"

      if (detalle.producto) {
        productoNombre = detalle.es_combo ? `[Combo] ${detalle.producto.nombre}` : detalle.producto.nombre
      } else if (detalle.id_producto) {
        productoNombre = detalle.es_combo ? `[Combo] #${detalle.id_producto}` : `Producto #${detalle.id_producto}`
      }

      tableRows.push([productoNombre, cantidad.toString(), `$${precio.toFixed(2)}`, `$${subtotal.toFixed(2)}`])
    })
  } else {
    // Si no hay detalles, agregar una fila indicándolo
    tableRows.push(["No hay productos en esta venta", "", "", ""])
  }

  // Añadir la tabla al documento
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 110,
    theme: "striped",
    headStyles: {
      fillColor: [240, 196, 74], // Color dorado similar al logo
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  })

  // Calcular la posición Y después de la tabla
  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Total
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL: $${venta.total.toFixed(2)}`, 195, finalY, { align: "right" })

  // Condiciones
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("CONDICIONES:", 15, finalY + 20)
  doc.text("- Este presupuesto tiene una validez de 15 días.", 15, finalY + 28)
  doc.text("- Los precios pueden variar sin previo aviso.", 15, finalY + 36)
  doc.text("- La entrega se realizará una vez confirmado el pago.", 15, finalY + 44)


  // Firma
  try {
    const firma = new Image()
    firma.crossOrigin = "anonymous" // Evitar problemas CORS
    firma.src = "/images/firma-empresa.png"
    await new Promise((resolve, reject) => {
      firma.onload = resolve
      firma.onerror = reject
      // Timeout para evitar esperar indefinidamente
      setTimeout(resolve, 3000)
    })
    doc.addImage(firma, "PNG", 65, finalY + 55, 70, 20)
  } catch (error) {
    console.error("Error al cargar la firma:", error)
    // Continuar sin la firma
  }
  // Información de la empresa - Ajustada para evitar superposición
  doc.setFontSize(10)
  doc.text("EL TOBIANO TALABARTERÍA", 190, finalY+60, { align: "right" })
  doc.text("Río Cuarto, Córdoba, Argentina", 190, finalY+65, { align: "right" })
  doc.text("Tel: +54 9 3586 00-0650", 190, finalY+70, { align: "right" })
  doc.text("Email: eltobianoventas@gmail.com", 190, finalY+75, { align: "right" })
  
  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      "El Tobiano Talabartería - Río Cuarto, Córdoba, Argentina - Tel: +54 9 3586 00-0650 - Email: eltobianoventas@gmail.com",
      105,
      285,
      { align: "center" },
    )
  }

  // Convertir el documento a Blob
  const pdfBlob = doc.output("blob")
  return pdfBlob
}

// Función para descargar el PDF
export const descargarPDF = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

