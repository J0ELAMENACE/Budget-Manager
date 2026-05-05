const ExcelJS = require('exceljs');
const path = require('path');

const TYPE_MAP = {
  'revenus': 'revenus', 'revenu': 'revenus', 'income': 'revenus', 'salaire': 'revenus',
  'depenses': 'depenses', 'dépenses': 'depenses', 'dépense': 'depenses', 'expense': 'depenses', 'charges': 'depenses',
  'epargne': 'epargne', 'épargne': 'epargne', 'saving': 'epargne', 'savings': 'epargne',
  'projet': 'projet', 'project': 'projet',
};

function normalizeType(raw) {
  if (!raw) return 'depenses';
  const s = String(raw).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return TYPE_MAP[s] || 'depenses';
}

function parseDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) {
    const d = raw;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  // Try DD/MM/YYYY
  const fr = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
  // Try YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function detectColumns(header) {
  const map = {};
  header.forEach((cell, i) => {
    const val = (cell?.text || String(cell || '')).toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^date/.test(val) && !map.date) map.date = i;
    if (/valeur|value/.test(val)) map.value_date = i;
    if (/type|nature/.test(val)) map.type = i;
    if (/categ|catég/.test(val)) map.category = i;
    if (/montant|amount|somme/.test(val)) map.amount = i;
    if (/detail|détail|libelle|libellé|descr/.test(val)) map.detail = i;
  });
  return map;
}

async function importExcel(filePath, db) {
  const ext = path.extname(filePath).toLowerCase();
  const workbook = new ExcelJS.Workbook();

  if (ext === '.csv') {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }

  const categories = db.getCategories();
  const catMap = {};
  for (const c of categories) catMap[c.name.toLowerCase()] = c;

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const sheet of workbook.worksheets) {
    // Skip obvious non-transaction sheets
    const name = sheet.name.toLowerCase();
    if (/planning|budget|paramètre|setting|dashboard|taux|wallet|patrimoine|réglage|reglage/i.test(name)) continue;

    const rows = [];
    sheet.eachRow((row, rowNum) => {
      rows.push({ rowNum, values: row.values.slice(1) }); // slice(1) removes ExcelJS index
    });

    if (rows.length < 2) continue;

    // Detect header row
    const headerRow = rows[0].values;
    const colMap = detectColumns(headerRow);

    // If no amount column detected, skip
    if (colMap.amount === undefined) continue;

    for (let i = 1; i < rows.length; i++) {
      const vals = rows[i].values;
      const raw = (k) => {
        if (colMap[k] === undefined) return null;
        const v = vals[colMap[k]];
        if (v === null || v === undefined) return null;
        if (typeof v === 'object' && v.result !== undefined) return v.result;
        if (typeof v === 'object' && v.text !== undefined) return v.text;
        return v;
      };

      const amountRaw = raw('amount');
      const amount = parseFloat(String(amountRaw || '').replace(',', '.').replace(/[^\d.-]/g, ''));
      if (!amount || isNaN(amount) || Math.abs(amount) < 0.01) { skipped++; continue; }

      const dateStr = parseDate(raw('date'));
      if (!dateStr) { skipped++; continue; }

      const typeStr = normalizeType(raw('type'));
      const catName = raw('category');
      let categoryId = null;

      if (catName) {
        const catKey = String(catName).toLowerCase().trim();
        const matchedCat = catMap[catKey] || Object.values(catMap).find(c => c.name.toLowerCase().includes(catKey));
        if (matchedCat) categoryId = matchedCat.id;
      }

      try {
        db.addTransaction({
          date: dateStr,
          value_date: parseDate(raw('value_date')),
          type: typeStr,
          category_id: categoryId,
          amount: Math.abs(amount),
          detail: raw('detail') ? String(raw('detail')).slice(0, 200) : null,
        });
        imported++;
      } catch (e) {
        errors.push(`Ligne ${rows[i].rowNum}: ${e.message}`);
      }
    }
  }

  return { success: true, imported, skipped, errors: errors.slice(0, 10) };
}

module.exports = { importExcel };
