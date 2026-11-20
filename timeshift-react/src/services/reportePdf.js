// src/services/reportePdf.js
// Genera el reporte AUX en PDF con el formato de la Oficina Jurídica:
// encabezado, filtros aplicados, resumen, gráficas y detalle de registros.

import { findState, stateColor, themeColor } from '../constants/states';
import { formatDuration } from '../utils/time';
import { formatClock, formatDay, summarizeByState } from './reportes';

const MARGIN = 40; // puntos (1 pt = 1/72 de pulgada)
const WHITE = '#FFFFFF';

/**
 * Crea y descarga el PDF.
 * @param {object} params
 * @param {Array} params.rows - filas ya filtradas (services/reportes.js)
 * @param {object} params.summary - totales de summarize()
 * @param {Array<[string, string]>} params.details - pares [etiqueta, valor] de los filtros
 * @param {string} params.generatedBy - nombre de quien descarga el reporte
 * @param {string[]} params.chartIds - ids de los <canvas> de las gráficas a incluir
 */
export async function downloadPdf({ rows, summary, details, generatedBy, chartIds }) {
  // Las librerías se cargan solo al exportar, así no pesan en la carga inicial de la app.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  // compress: true reduce el archivo (sobre todo por las imágenes de las gráficas).
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const primary = themeColor('primary');
  const tableStyle = {
    margin: { left: MARGIN, right: MARGIN },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: primary, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: themeColor('background') },
  };
  // Posición vertical donde va el siguiente bloque.
  let y = 90;

  // --- Encabezado ---
  doc.setFillColor(primary);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Oficina Jurídica Jovita Alvarado', MARGIN, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Reporte de estados AUX · TimeShift', MARGIN, 52);

  // --- Datos del reporte ---
  const generatedAt = new Date().toLocaleString('es-SV', { dateStyle: 'long', timeStyle: 'short' });
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    theme: 'plain',
    styles: { ...tableStyle.styles, fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 } },
    body: [...details, ['Generado por', generatedBy], ['Fecha de emisión', generatedAt]],
  });
  y = doc.lastAutoTable.finalY + 16;

  // --- Resumen ---
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Registros', 'Tiempo total', 'Duración promedio', 'Pausas (Lunch + Break)']],
    body: [[
      String(summary.count),
      formatDuration(summary.totalMs),
      formatDuration(summary.avgMs),
      formatDuration(summary.pauseMs),
    ]],
  });
  y = doc.lastAutoTable.finalY + 16;

  const byState = summarizeByState(rows);
  if (byState.length > 0) {
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      head: [['Estado AUX', 'Registros', 'Tiempo total', '% del tiempo']],
      body: byState.map((item) => [
        findState(item.stateId).label,
        String(item.count),
        formatDuration(item.totalMs),
        `${item.percent.toFixed(1)} %`,
      ]),
      // Punto de color del estado en la primera columna, igual que en la pantalla.
      didDrawCell(data) {
        if (data.section === 'body' && data.column.index === 0) {
          doc.setFillColor(stateColor(byState[data.row.index].stateId));
          doc.circle(data.cell.x + data.cell.width - 10, data.cell.y + data.cell.height / 2, 3.5, 'F');
        }
      },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Gráficas (una al lado de la otra; si no caben, en una página nueva) ---
  const canvases = chartIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (canvases.length > 0) {
    const gap = 16;
    const width = (contentWidth - gap * (canvases.length - 1)) / canvases.length;
    const heights = canvases.map((canvas) => (width * canvas.height) / canvas.width);
    if (y + Math.max(...heights) > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    canvases.forEach((canvas, index) => {
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', MARGIN + index * (width + gap), y, width, heights[index]);
    });
    y += Math.max(...heights) + 20;
  }

  // --- Detalle de registros ---
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Fecha', 'Empleado', 'Cargo', 'Estado AUX', 'Inicio', 'Fin', 'Duración']],
    body: rows.map((row) => [
      formatDay(row.day),
      row.name,
      row.cargo,
      findState(row.stateId).label,
      formatClock(row.startedAt),
      formatClock(row.endedAt),
      row.durationMs === null ? '—' : formatDuration(row.durationMs),
    ]),
    columnStyles: { 6: { halign: 'right' } },
  });

  // --- Pie de página con numeración ---
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(themeColor('text-muted'));
    doc.text('TimeShift · Oficina Jurídica Jovita Alvarado', MARGIN, pageHeight - 20);
    doc.text(`Página ${page} de ${pages}`, pageWidth - MARGIN, pageHeight - 20, { align: 'right' });
  }

  doc.save(`reporte-aux-${new Date().toLocaleDateString('en-CA')}.pdf`);
}