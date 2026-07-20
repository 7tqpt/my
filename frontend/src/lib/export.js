// Client-side export utilities for Excel + PDF
// Uses xlsx-js-style (fork of SheetJS) to enable cell styling.
import XLSX from 'xlsx-js-style';

/**
 * Detect whether text is predominantly Arabic (for RTL sheet direction).
 */
function isArabicText(s) {
  return /[\u0600-\u06FF]/.test(String(s || ''));
}

/**
 * Export tabular data to a professional Excel file:
 *  - Branded title block
 *  - Colored header row with white bold text
 *  - Alternating row banding
 *  - Optional totals row (bold + colored fill)
 *  - Auto column widths
 *  - Frozen header, RTL sheet direction for Arabic titles
 *
 * @param {string} filename - e.g. 'financial_report.xlsx'
 * @param {Array<Object>} rows - array of plain-object rows
 * @param {Array<{key: string, label: string, value?: Function}>} columns - column defs
 * @param {string} sheetName
 * @param {Object} [opts]
 * @param {string} [opts.title] - Report title (defaults to sheetName)
 * @param {string} [opts.subtitle] - Optional subtitle line
 * @param {Array<{label: string, value: string|number}>} [opts.totals] - Totals row
 */
export function exportToExcel(filename, rows, columns = null, sheetName = 'Report', opts = {}) {
  // ---- Normalize columns ----
  const cols = (columns && columns.length)
    ? columns
    : Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k }));

  const headers = cols.map((c) => c.label);
  const bodyRows = rows.map((r) => cols.map((c) => (typeof c.value === 'function' ? c.value(r) : r[c.key])));

  const title = opts.title || sheetName;
  const subtitle = opts.subtitle
    || `${new Date().toLocaleDateString(isArabicText(title) ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}  •  ${rows.length} ${isArabicText(title) ? 'سجل' : 'records'}`;

  const nCols = cols.length;

  // ---- Compose worksheet AOA (array-of-arrays) ----
  // Row 0: Title (merged across all columns)
  // Row 1: Subtitle (merged)
  // Row 2: blank spacer
  // Row 3: Header
  // Row 4..: Body
  // Row N: Totals
  const aoa = [];
  aoa.push([title, ...Array(Math.max(0, nCols - 1)).fill('')]);
  aoa.push([subtitle, ...Array(Math.max(0, nCols - 1)).fill('')]);
  aoa.push(Array(nCols).fill(''));
  aoa.push(headers);
  bodyRows.forEach((r) => aoa.push(r));

  const totalsRowIndex = opts.totals && opts.totals.length ? aoa.length + 1 : -1; // +1 because we push a blank spacer
  if (opts.totals && opts.totals.length) {
    aoa.push(Array(nCols).fill('')); // spacer
    // build totals as label+value pairs across the row
    // Layout: [label, value, label, value, ...] fills from start; empties pad
    const totalsRow = [];
    opts.totals.forEach((t) => { totalsRow.push(t.label); totalsRow.push(t.value); });
    while (totalsRow.length < nCols) totalsRow.push('');
    aoa.push(totalsRow.slice(0, nCols));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ---- Merges ----
  const merges = [];
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: nCols - 1 } }); // title
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: nCols - 1 } }); // subtitle
  ws['!merges'] = merges;

  // ---- Freeze header (row index 3) ----
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 4, rightToLeft: isArabicText(title) }];

  // ---- Row heights ----
  ws['!rows'] = [
    { hpt: 34 }, // title
    { hpt: 20 }, // subtitle
    { hpt: 8 },  // spacer
    { hpt: 26 }, // header
  ];

  // ---- Auto column widths ----
  const widths = cols.map((c, ci) => {
    const bodyMax = bodyRows.reduce((m, r) => Math.max(m, String(r[ci] ?? '').length), 0);
    return { wch: Math.min(48, Math.max(14, Math.max(String(c.label).length, bodyMax) + 4)) };
  });
  ws['!cols'] = widths;

  // ---- Styles ----
  const BRAND = '2563EB';   // blue-600
  const BRAND_DARK = '1E40AF'; // blue-800
  const HEADER_FG = 'FFFFFF';
  const BAND_BG = 'F1F5F9'; // slate-100
  const BORDER = { style: 'thin', color: { rgb: 'CBD5E1' } };

  const titleStyle = {
    font: { name: 'Tajawal', bold: true, sz: 18, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: BRAND } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const subtitleStyle = {
    font: { name: 'Tajawal', bold: false, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: BRAND_DARK } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const headerStyle = {
    font: { name: 'Tajawal', bold: true, sz: 12, color: { rgb: HEADER_FG } },
    fill: { patternType: 'solid', fgColor: { rgb: '334155' } }, // slate-700
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
  };
  const bodyStyle = (banded) => ({
    font: { name: 'Tajawal', sz: 11, color: { rgb: '111827' } },
    fill: banded ? { patternType: 'solid', fgColor: { rgb: BAND_BG } } : undefined,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
  });
  const totalsLabelStyle = {
    font: { name: 'Tajawal', bold: true, sz: 12, color: { rgb: '111827' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } }, // amber-100
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
  };
  const totalsValueStyle = {
    font: { name: 'Tajawal', bold: true, sz: 12, color: { rgb: 'B45309' } }, // amber-700
    fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
  };

  const setCell = (r, c, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { v: '', t: 's' };
    ws[addr].s = style;
  };

  // Title/Subtitle across merged range: styling only on top-left cell affects the merge in most viewers
  for (let c = 0; c < nCols; c++) setCell(0, c, titleStyle);
  for (let c = 0; c < nCols; c++) setCell(1, c, subtitleStyle);

  // Header row (row index 3)
  for (let c = 0; c < nCols; c++) setCell(3, c, headerStyle);

  // Body rows start at index 4
  const bodyStart = 4;
  for (let i = 0; i < bodyRows.length; i++) {
    const rIdx = bodyStart + i;
    for (let c = 0; c < nCols; c++) setCell(rIdx, c, bodyStyle(i % 2 === 1));
  }

  // Totals row
  if (opts.totals && opts.totals.length) {
    // totals row is the LAST row in aoa
    const tRow = aoa.length - 1;
    for (let c = 0; c < nCols; c++) {
      // Even columns hold labels, odd columns hold values (based on our push pattern)
      setCell(tRow, c, c % 2 === 0 ? totalsLabelStyle : totalsValueStyle);
    }
  }

  const wb = XLSX.utils.book_new();
  // Set workbook direction for RTL locales
  if (!wb.Workbook) wb.Workbook = {};
  wb.Workbook.Views = [{ RTL: isArabicText(title) }];

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30) || 'Report');
  XLSX.writeFile(wb, filename);
}

/**
 * Print a section as PDF via browser print dialog.
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
      thead th { background: #334155; color: #fff; font-weight: 700; }
      tbody tr:nth-child(even) { background: #f1f5f9; }
      .tot { font-weight: 700; background: #fef3c7; color: #b45309; }
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
  setTimeout(() => { try { win.focus(); } catch (e) {} }, 300);
}

/**
 * Helper: build an HTML table from rows + columns.
 */
export function buildTable(columns, rows) {
  const th = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');

  const trs = rows.map((r) => {
    const tds = columns.map((c) => {

      let v = typeof c.value === 'function' ? c.value(r) : r[c.key];

      if (
        (c.key === 'due_date' || c.key === 'payment_date') &&
        typeof v === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(v)
      ) {
        const d = new Date(v);
        v = `شهر ${d.getMonth() + 1} - ${d.getFullYear()}`;
      }

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
