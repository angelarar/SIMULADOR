// CONFIGURACIÓN DE GOOGLE APPS SCRIPT
// Reemplaza esta variable con la URL de implementación web de tu Apps Script cuando lo tengas listo.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6A_9E6yHSmVw7m9pRswPXh5Pv5ofAOa0_zt5nWLnORehp8D_PTpdCXP3dmaAQm-ip/exec";

document.addEventListener("DOMContentLoaded", () => {
    const formInputs = document.querySelectorAll("#cotizadorForm input");
    
    // Inicializar gráfica de pastel
    const ctx = document.getElementById("graficaComision").getContext("2d");
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
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 } }
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
        grafica.data.datasets[0].data = [comisionPct, Math.max(0, 100 - comisionPct)];
        grafica.update();

        return {
            nombre, anos, plazoMeses, montoCredito, comisionPct, comisionTotal, 
            netoEfectivo, descuentoMensual, montoTotalPagar, asesor, fecha: new Date().toLocaleString()
        };
    }

    formInputs.forEach(input => {
        input.addEventListener("input", calcularYActualizar);
    });

    // Botón único para descargar PDF y guardar en base de datos
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

        // 2. Generar y descargar el PDF
        const { jsPDF } = window.jspdf;
        const element = document.getElementById("pdfContent");

        html2canvas(element, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 190; 
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            pdf.save(`Cotizacion_${datos.nombre.replace(/\s+/g, '_')}.pdf`);
        });
    });

    function formatCurrency(amount) {
        return "$" + amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
});