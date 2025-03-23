import type { Venta, DetalleVenta } from "@/types"
import { formatCurrency } from "@/lib/utils"

// Esta función se ejecutará en el cliente
export async function generarPresupuestoPDF(venta: Venta) {
  // Importamos jspdf y jspdf-autotable dinámicamente para evitar problemas con SSR
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  // Crear un nuevo documento PDF
  const doc = new jsPDF()

  // Configuración de la página
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // Añadir logo de la empresa
  try {
    const img = new Image()
    img.src = "/images/logo-empresa.png"
    await new Promise((resolve) => {
      img.onload = resolve
    })

    // Añadir logo en la esquina superior izquierda
    doc.addImage(img, "PNG", margin, margin, 30, 30)
  } catch (error) {
    console.error("Error al cargar el logo:", error)
  }

  // Título del documento
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("PRESUPUESTO", pageWidth / 2, margin + 10, { align: "center" })

  // Información de la empresa
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("EL TOBIANO - TALABARTERÍA", pageWidth - margin, margin + 5, { align: "right" })
  doc.setFontSize(10)
  doc.text("Tel: +54 9 5586 00-0650", pageWidth - margin, margin + 10, { align: "right" })
  doc.text("Email: eltobianoventas@gmail.com", pageWidth - margin, margin + 15, { align: "right" })
  doc.text("Río Cuarto, Cba, Argentina", pageWidth - margin, margin + 20, { align: "right" })

  // Número de presupuesto y fecha
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(`Presupuesto N°: ${venta.id}`, margin, margin + 40)

  // Formatear la fecha
  const fecha = new Date(venta.fecha)
  const fechaFormateada = fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  doc.text(`Fecha: ${fechaFormateada}`, margin, margin + 47)

  // Información del cliente
  if (venta.cliente) {
    doc.setFontSize(12)
    doc.text("Datos del Cliente:", margin, margin + 60)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nombre: ${venta.cliente.nombre || ""}`, margin, margin + 67)

    if (venta.cliente.email) {
      doc.text(`Email: ${venta.cliente.email}`, margin, margin + 74)
    }

    if (venta.cliente.telefono) {
      doc.text(`Teléfono: ${venta.cliente.telefono}`, margin, margin + 81)
    }

    if (venta.cliente.direccion) {
      doc.text(`Dirección: ${venta.cliente.direccion}`, margin, margin + 88)
    }
  }

  // Tabla de productos
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Detalle de Productos:", margin, margin + 105)

  // Preparar datos para la tabla
  const tableHeaders = [["Cant.", "Descripción", "Precio Unit.", "Subtotal"]]

  const tableData = venta.detalles.map((detalle: DetalleVenta) => {
    let descripcion = detalle.producto?.nombre || `Producto #${detalle.id_producto}`

    // Si es un combo modificado, añadir detalle
    if (detalle.es_combo && detalle.datos_combo_modificado) {
      try {
        const items = JSON.parse(detalle.datos_combo_modificado)
        descripcion += " (Modificado)\n"
        items.forEach((item: any) => {
          descripcion += `  - ${item.cantidad}x ${item.nombre || `Producto #${item.id_producto}`}\n`
        })
      } catch (error) {
        console.error("Error al procesar datos de combo modificado:", error)
      }
    }

    return [
      detalle.cantidad.toString(),
      descripcion,
      formatCurrency(detalle.precio),
      formatCurrency(detalle.precio * detalle.cantidad),
    ]
  })

  // Añadir la tabla al documento
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: margin + 110,
    margin: { left: margin, right: margin },
    styles: { overflow: "linebreak", cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
  })

  // Obtener la posición Y después de la tabla
  const finalY = (doc as any).lastAutoTable.finalY || margin + 200

  // Total
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL: ${formatCurrency(venta.total)}`, pageWidth - margin, finalY + 15, { align: "right" })

  // Estado del presupuesto
  doc.setFontSize(11)
  doc.text(`Estado: ${venta.estado}`, margin, finalY + 15)

  // Notas y condiciones
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Notas:", margin, finalY + 30)
  doc.text("- Este presupuesto tiene una validez de 15 días.", margin, finalY + 37)
  doc.text("- Los precios pueden variar según disponibilidad de stock.", margin, finalY + 44)
  doc.text("- Consulte por métodos de pago disponibles.", margin, finalY + 51)

  // Firma y pie de página
  try {
    const firma = new Image()
    firma.src = "/images/firma-empresa.png"
    await new Promise((resolve) => {
      firma.onload = resolve
    })

    // Añadir firma en el pie de página
    const firmaWidth = 100
    const firmaHeight = 20
    doc.addImage(
      firma,
      "PNG",
      pageWidth - margin - firmaWidth,
      pageHeight - margin - firmaHeight,
      firmaWidth,
      firmaHeight,
    )
  } catch (error) {
    console.error("Error al cargar la firma:", error)
  }

  // Pie de página
  doc.setFontSize(8)
  doc.text(
    "EL TOBIANO - TALABARTERÍA | Tel: +54 9 5586 00-0650 | Email: eltobianoventas@gmail.com",
    pageWidth / 2,
    pageHeight - margin,
    { align: "center" },
  )

  // Generar el PDF y devolverlo como blob
  const pdfBlob = doc.output("blob")
  return pdfBlob
}

// Esta función se ejecutará en el cliente para descargar el PDF
export async function descargarPresupuestoPDF(venta: Venta) {
  try {
    const pdfBlob = await generarPresupuestoPDF(venta)

    // Crear un enlace para descargar el PDF
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Presupuesto_${venta.id}_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)

    return true
  } catch (error) {
    console.error("Error al generar el PDF:", error)
    return false
  }
}

