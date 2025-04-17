import type { Venta, Cliente } from "@/types"

export const generarEtiquetaEnvio = async (venta: Venta, clienteCompleto: Cliente | null) => {
  if (!venta || !clienteCompleto) {
    throw new Error("No se puede generar la etiqueta sin datos del cliente")
  }

  try {
    // Crear un elemento div para la etiqueta
    const etiquetaDiv = document.createElement("div")
    etiquetaDiv.className = "etiqueta-envio"
    etiquetaDiv.style.width = "400px"
    etiquetaDiv.style.padding = "20px"
    etiquetaDiv.style.border = "2px solid black"
    etiquetaDiv.style.fontFamily = "Arial, sans-serif"

    // Encabezado con número de venta
    const header = document.createElement("div")
    header.style.display = "flex"
    header.style.justifyContent = "flex-end"
    header.style.alignItems = "center"
    header.style.marginBottom = "15px"

    // Número de venta
    const ventaNumero = document.createElement("div")
    ventaNumero.style.fontSize = "18px"
    ventaNumero.style.fontWeight = "bold"
    ventaNumero.style.padding = "5px 10px"
    ventaNumero.style.border = "1px solid #000"
    ventaNumero.style.borderRadius = "4px"
    ventaNumero.innerHTML = `#${venta.id}`

    header.appendChild(ventaNumero)
    etiquetaDiv.appendChild(header)

    // Título con logo
    const titulo = document.createElement("div")
    titulo.style.textAlign = "center"
    titulo.style.marginBottom = "20px"
    titulo.style.display = "flex"
    titulo.style.justifyContent = "center"
    titulo.style.alignItems = "center"

    // Crear un elemento img para el logo
    const logoImg = document.createElement("img")
    logoImg.src = "/images/logo-empresa.png" // Ruta a la imagen del logo
    logoImg.style.height = "60px"
    logoImg.style.marginBottom = "10px"
    titulo.appendChild(logoImg)

    etiquetaDiv.appendChild(titulo)

    // Datos del cliente (destinatario)
    const datosCliente = document.createElement("div")
    datosCliente.style.marginBottom = "20px"

    datosCliente.innerHTML = `
      <h2 style="font-size: 18px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">DESTINATARIO:</h2>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Nombre:</strong> ${clienteCompleto.nombre}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>DNI:</strong> ${clienteCompleto.dni || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Dirección:</strong> ${clienteCompleto.direccion || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Ciudad:</strong> ${clienteCompleto.ciudad || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Provincia:</strong> ${clienteCompleto.provincia || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>CP:</strong> ${clienteCompleto.cp || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Teléfono:</strong> ${clienteCompleto.telefono || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Email:</strong> ${clienteCompleto.email || " "}</p>
    `
    etiquetaDiv.appendChild(datosCliente)

    // Datos de la empresa (remitente)
    const datosEmpresa = document.createElement("div")
    datosEmpresa.style.marginBottom = "20px"
    datosEmpresa.innerHTML = `
      <h2 style="font-size: 18px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">REMITENTE:</h2>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Empresa:</strong> El Tobiano Talabarteria</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Ciudad:</strong> Río Cuarto, Córdoba</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>CP:</strong> 5800</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Teléfono:</strong> +54 9 (358) 600-9786</p>
    `
    etiquetaDiv.appendChild(datosEmpresa)

    // Datos del envío
    const datosEnvio = document.createElement("div")
    datosEnvio.style.marginBottom = "20px"
    datosEnvio.innerHTML = `
      <h2 style="font-size: 16px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">DATOS DEL ENVÍO:</h2>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Servicio de correo:</strong> ${venta.correo_usado || " "}</p>
      <p style="margin: 2px 0; font-size: 14px;"><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleDateString()}</p>
      ${venta.numero_seguimiento ? `<p style="margin: 2px 0; font-size: 14px;"><strong>Número de seguimiento:</strong> ${venta.numero_seguimiento}</p>` : ""}
    `
    etiquetaDiv.appendChild(datosEnvio)

    // Crear una ventana emergente para imprimir
    const ventanaImpresion = window.open("", "_blank")
    if (!ventanaImpresion) {
      throw new Error("No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.")
    }

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Etiqueta de Envío - Venta #${venta.id}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <h1>Etiqueta de Envío - Venta #${venta.id}</h1>
            <button class="print-button" onclick="window.print(); setTimeout(() => window.close(), 500);">Imprimir Etiqueta</button>
          </div>
          ${etiquetaDiv.outerHTML}
        </body>
      </html>
    `)

    ventanaImpresion.document.close()
    return true
  } catch (error) {
    console.error("Error al generar la etiqueta:", error)
    throw error
  }
}
