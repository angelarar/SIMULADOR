// CONFIGURACIÓN DE GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6A_9E6yHSmVw7m9pRswPXh5Pv5ofAOa0_zt5nWLnORehp8D_PTpdCXP3dmaAQm-ip/exec";

// Asegúrate de registrar el plugin de etiquetas para la gráfica
Chart.register(ChartDataLabels);

document.addEventListener("DOMContentLoaded", () => {
    const formInputs = document.querySelectorAll("#cotizadorForm input");
    
    const ctx = document.getElementById("graficaComision").getContext("2d");
    
    // Configuración de alta resolución para evitar que se vea borroso
    const grafica = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Comisión', 'Neto Cliente'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#e74c3c', '#27ae60'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2, // Duplica la resolución para máxima nitidez
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 } }
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 13
                    },
                    formatter: (value, context) => {
                        if (value === 0) return '';
                        return value.toFixed(1) + '%';
                    }
                }
            }
        }
    });

    function calcularYActualizar() {
        const nombre = document.getElementById("nombre").value || "-";
        const anos = parseFloat(document.getElementById("anos").value) || 0;
        const plazoMeses = parseFloat(document.getElementById("plazoMeses").value) || 0;
        const montoCredito = parseFloat(document.getElementById("montoCredito").value) || 0;
        const comisionPct = parseFloat(document.getElementById("comisionPct").value) || 0;
        const descuentoMensual = parseFloat(document.getElementById("descuentoMensual").value) || 0;
        const asesor = document.getElementById("asesor").value || "-";

        // Cálculos solicitados
        const comisionTotal = montoCredito * (comisionPct / 100);
        const netoEfectivo = montoCredito - comisionTotal;
        const montoTotalPagar = descuentoMensual * plazoMeses;

        // Actualizar vista previa
        document.getElementById("resCliente").innerText = nombre;
        document.getElementById("resAsesor").innerText = asesor;
        document.getElementById("resMontoCredito").innerText = formatCurrency(montoCredito);
        document.getElementById("resComisionPctLabel").innerText = comisionPct;
        document.getElementById("resComisionTotal").innerText = formatCurrency(comisionTotal);
        document.getElementById("resNetoEfectivo").innerText = formatCurrency(netoEfectivo);
        document.getElementById("resPlazoMeses").innerText = plazoMeses;
        document.getElementById("resDescuentoMensual").innerText = formatCurrency(descuentoMensual);
        document.getElementById("resMontoTotal").innerText = formatCurrency(montoTotalPagar);

        // Actualizar gráfica
        const restoPct = Math.max(0, 100 - comisionPct);
        grafica.data.datasets[0].data = [comisionPct, restoPct];
        grafica.update();

        return {
            nombre, anos, plazoMeses, montoCredito, comisionPct, comisionTotal, 
            netoEfectivo, descuentoMensual, montoTotalPagar, asesor, fecha: new Date().toLocaleString()
        };
    }

    formInputs.forEach(input => {
        input.addEventListener("input", calcularYActualizar);
    });

    // Botón único para guardar en base de datos y descargar PDF optimizado para móviles y PC
    document.getElementById("btnDescargar").addEventListener("click", async () => {
        const datos = calcularYActualizar();

        if (!document.getElementById("nombre").value || !document.getElementById("montoCredito").value) {
            alert("Por favor completa al menos el nombre y el monto del crédito antes de descargar.");
            return;
        }

        // 1. Guardar en Base de Datos (Google Apps Script) de forma transparente
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "AQUÍ_PEGAS_TU_URL_DE_APPS_SCRIPT") {
            try {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datos)
                });
            } catch (error) {
                console.error("Error al guardar en la base de datos:", error);
            }
        }

        // 2. Generar y descargar el PDF adaptado
        const { jsPDF } = window.jspdf;
        const element = document.getElementById("pdfContent");

        const options = {
            scale: 3, // Mayor resolución para los textos
            useCORS: true,
            logging: false,
            windowWidth: 800 // Ancho virtual de escritorio para que en móviles no se rompa el diseño
        };

        html2canvas(element, options).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const margin = 15;
            const usableWidth = pageWidth - (margin * 2);
            
            const imgHeight = (canvas.height * usableWidth) / canvas.width;

            let finalHeight = imgHeight;
            let finalWidth = usableWidth;

            if (finalHeight > (pageHeight - (margin * 2))) {
                finalHeight = pageHeight - (margin * 2);
                finalWidth = (canvas.width * finalHeight) / canvas.height;
            }

            const xOffset = margin + (usableWidth - finalWidth) / 2;
            const yOffset = margin;

            pdf.addImage(imgData, "PNG", xOffset, yOffset, finalWidth, finalHeight);
            pdf.save(`Cotizacion_${datos.nombre.replace(/\s+/g, '_')}.pdf`);
        });
    });

    function formatCurrency(amount) {
        return "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
});
