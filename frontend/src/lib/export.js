// Client-side export utilities for Excel + PDF
import * as XLSX from 'xlsx';

/**
 * Export tabular data to an Excel file.
 * @param {string} filename - e.g. 'financial_report.xlsx'
 * @param {Array<Object>} rows - array of plain-object rows
 * @param {Array<{key: string, label: string}>} columns - optional column definitions
 * @param {string} sheetName
 */
export function exportToExcel(filename, rows, columns = null, sheetName = 'Report') {
  let data;
  let headers;
  if (columns && columns.length) {
    headers = columns.map((c) => c.label);
    data = rows.map((r) => columns.map((c) => (typeof c.value === 'function' ? c.value(r) : r[c.key])));
  } else {
    headers = Object.keys(rows[0] || {});
    data = rows.map((r) => headers.map((h) => r[h]));
  }
  const aoa = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Print a section as PDF via browser print dialog.
 * Uses window.print() so Arabic/RTL rendering is preserved.
 * @param {string} title
 * @param {string} htmlBody - inner HTML for the report body
 */
export function printReport(title, htmlBody, opts = {}) {
  const dir = opts.dir || document.documentElement.dir || 'rtl';
  const lang = opts.lang || document.documentElement.lang || 'ar';
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap');
      * { box-sizing: border-box; }
      body { font-family: 'Tajawal','Cairo',sans-serif; margin: 24px; color: #111827; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .subtitle { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: start; }
      thead th { background: #f9fafb; font-weight: 700; color: #374151; }
      tbody tr:nth-child(even) { background: #f9fafb; }
      .tot { font-weight: 700; }
      .stamp { display:flex; justify-content: space-between; align-items:center; margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; background: linear-gradient(135deg,#2563eb 0%,#4f46e5 100%); color:white; }
      .stamp .label { font-size: 11px; opacity: 0.85; }
      .stamp .value { font-size: 18px; font-weight: 800; }
      @media print { body { margin: 0; } .no-print { display: none !important; } }
    </style></head><body>
    <div class="no-print" style="margin-bottom:16px; text-align:end;">
      <button onclick="window.print()" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:8px; font-size:14px; cursor:pointer;">${lang === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</button>
    </div>
    ${htmlBody}
  </body></html>`);
  win.document.close();
  // Auto trigger print after content loads
  setTimeout(() => { try { win.focus(); } catch (e) {} }, 300);
}

/**
 * Helper: build an HTML table from rows + columns.
 */
export function buildTable(columns, rows) {
  const th = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const trs = rows.map((r) => {
    const tds = columns.map((c) => {
      const v = typeof c.value === 'function' ? c.value(r) : r[c.key];
      return `<td>${escapeHtml(v == null ? '' : String(v))}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
