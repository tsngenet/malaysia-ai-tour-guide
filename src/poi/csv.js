/** Minimal RFC-4180 CSV parser/serialiser. Unicode-safe; strips a UTF-8 BOM; handles quoted newlines. */

export function parseCsv(text) {
  const s = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''));
  if (!nonEmpty.length) return { headers: [], records: [] };
  const headers = nonEmpty[0].map((h) => h.trim());
  const records = nonEmpty.slice(1).map((r, idx) => {
    const rec = {};
    headers.forEach((h, j) => { rec[h] = (r[j] ?? '').trim(); });
    // Spreadsheet line number (header = line 1) for row-level reports.
    Object.defineProperty(rec, '__row', { value: idx + 2, enumerable: false });
    return rec;
  });
  return { headers, records };
}

export function toCsv(headers, rows) {
  const esc = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\r\n') + '\r\n';
}
