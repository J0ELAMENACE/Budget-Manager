const ExcelJS = require('exceljs');
const path = require('path');

const COLORS = {
  bg: '0D1117',
  surface: '161B22',
  accent: '58A6FF',
  green: '3FB950',
  red: 'F85149',
  orange: 'D29922',
  purple: 'BC8CFF',
  text: 'E6EDF3',
  muted: '8B949E',
  border: '30363D',
};

function styleHeader(cell, bgColor = COLORS.surface) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };
  cell.font = { color: { argb: 'FF' + COLORS.text }, bold: true, size: 10 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    bottom: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    left: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    right: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
  };
}

function styleCell(cell, bgColor = COLORS.bg, textColor = COLORS.text, bold = false) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };
  cell.font = { color: { argb: 'FF' + textColor }, bold, size: 10 };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    bottom: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    left: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    right: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
  };
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const fmt = (n) => n ? n.toFixed(2) : '0.00';

async function exportExcel({ year, month, filePath }, db) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Budget Manager';
  workbook.created = new Date();

  // ── Sheet 1: Résumé ──────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('📊 Résumé');
  summarySheet.properties.tabColor = { argb: 'FF58A6FF' };

  const summary = db.getTransactionSummary(year, month);
  const summaryMap = {};
  for (const s of summary) summaryMap[s.type] = s.total || 0;

  const revenus = summaryMap['revenus'] || 0;
  const depenses = summaryMap['depenses'] || 0;
  const epargne = summaryMap['epargne'] || 0;
  const projet = summaryMap['projet'] || 0;
  const solde = revenus - depenses - epargne - projet;
  const tauxEpargne = revenus > 0 ? ((epargne / revenus) * 100).toFixed(1) : '0.0';

  summarySheet.columns = [
    { width: 28 }, { width: 20 }, { width: 20 },
  ];

  const titleRow = summarySheet.addRow([`Budget Manager — ${month ? MONTHS[month - 1] + ' ' : ''}${year}`]);
  titleRow.height = 32;
  const titleCell = titleRow.getCell(1);
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.accent } };
  titleCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  summarySheet.mergeCells('A1:C1');

  summarySheet.addRow([]);

  const kpiHeaders = summarySheet.addRow(['Indicateur', 'Montant (€)', '']);
  styleHeader(kpiHeaders.getCell(1));
  styleHeader(kpiHeaders.getCell(2));

  const kpis = [
    ['💰 Revenus', revenus, COLORS.green],
    ['💸 Dépenses', depenses, COLORS.red],
    ['🏦 Épargne', epargne, COLORS.accent],
    ['🏠 Projets', projet, COLORS.purple],
    ['📊 Solde net', solde, solde >= 0 ? COLORS.green : COLORS.red],
    ['📈 Taux d\'épargne', tauxEpargne + '%', COLORS.orange],
  ];

  for (const [label, value, color] of kpis) {
    const row = summarySheet.addRow([label, typeof value === 'number' ? parseFloat(fmt(value)) : value]);
    styleCell(row.getCell(1), COLORS.surface);
    const valCell = row.getCell(2);
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.surface } };
    valCell.font = { color: { argb: 'FF' + color }, bold: true, size: 10 };
    valCell.border = {
      top: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
      bottom: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
      left: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
      right: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    };
    row.height = 22;
  }

  summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.accent } };

  // ── Sheet 2: Transactions ────────────────────────────────────────────────
  const txSheet = workbook.addWorksheet('📋 Transactions');
  txSheet.properties.tabColor = { argb: 'FF3FB950' };

  const transactions = db.getTransactions({ year, month });
  txSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Date valeur', key: 'value_date', width: 14 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Catégorie', key: 'category_name', width: 22 },
    { header: 'Montant (€)', key: 'amount', width: 16 },
    { header: 'Détail', key: 'detail', width: 36 },
  ];

  const txHeader = txSheet.getRow(1);
  txHeader.height = 26;
  txHeader.eachCell(cell => styleHeader(cell, COLORS.surface));

  const typeColors = { revenus: COLORS.green, depenses: COLORS.red, epargne: COLORS.accent, projet: COLORS.purple };
  for (const tx of transactions) {
    const row = txSheet.addRow({
      date: tx.date, value_date: tx.value_date || '',
      type: tx.type, category_name: tx.category_name || '',
      amount: parseFloat(tx.amount), detail: tx.detail || '',
    });
    row.height = 20;
    row.eachCell(cell => styleCell(cell));
    const typeCell = row.getCell('type');
    typeCell.font = { color: { argb: 'FF' + (typeColors[tx.type] || COLORS.muted) }, bold: true, size: 10 };
    const amtCell = row.getCell('amount');
    amtCell.numFmt = '#,##0.00 €';
    amtCell.font = { color: { argb: 'FF' + (tx.type === 'revenus' ? COLORS.green : COLORS.red) }, bold: true, size: 10 };
  }

  // ── Sheet 3: Planning ────────────────────────────────────────────────────
  const planSheet = workbook.addWorksheet('📅 Planning');
  planSheet.properties.tabColor = { argb: 'FFD29922' };

  const { categories, data: planData } = db.getBudgetPlanning(year);
  const monthHeaders = ['Catégorie', ...MONTHS, 'Total annuel'];
  planSheet.columns = monthHeaders.map((h, i) => ({ header: h, width: i === 0 ? 26 : i === 13 ? 14 : 10 }));

  const planHeader = planSheet.getRow(1);
  planHeader.height = 26;
  planHeader.eachCell(cell => styleHeader(cell, COLORS.surface));

  const typeLabels = { revenus: '💰 REVENUS', depenses: '💸 DÉPENSES', epargne: '🏦 ÉPARGNE', projet: '🏠 PROJETS' };
  const typeColorMap = { revenus: COLORS.green, depenses: COLORS.red, epargne: COLORS.accent, projet: COLORS.purple };
  let currentType = null;

  for (const cat of categories) {
    if (cat.type !== currentType) {
      currentType = cat.type;
      const sectionRow = planSheet.addRow([typeLabels[cat.type] || cat.type.toUpperCase()]);
      sectionRow.height = 24;
      sectionRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF161B22' } };
        cell.font = { color: { argb: 'FF' + (typeColorMap[cat.type] || COLORS.text) }, bold: true, size: 11 };
      });
    }

    const rowValues = [cat.name];
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const val = planData[`${cat.id}_${m}`] || 0;
      rowValues.push(val);
      total += val;
    }
    rowValues.push(total);
    const row = planSheet.addRow(rowValues);
    row.height = 20;
    row.eachCell((cell, i) => {
      styleCell(cell);
      if (i > 1) cell.numFmt = '#,##0.00';
      if (i === 14) cell.font = { bold: true, color: { argb: 'FF' + COLORS.text }, size: 10 };
    });

    if (month) {
      const monthCell = row.getCell(month + 1);
      monthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    }
  }

  // ── Sheet 4: Patrimoine ──────────────────────────────────────────────────
  const walletSheet = workbook.addWorksheet('💼 Patrimoine');
  walletSheet.properties.tabColor = { argb: 'FFBC8CFF' };

  const accounts = db.getWalletAccounts();
  const positions = db.getWalletPositions(year);
  const posMap = {};
  for (const p of positions) posMap[`${p.account_id}_${p.month}`] = p.balance;

  const walletHeaders = ['Compte', ...MONTHS, 'Variation'];
  walletSheet.columns = walletHeaders.map((h, i) => ({ header: h, width: i === 0 ? 22 : i === 13 ? 12 : 10 }));

  const walletHeader = walletSheet.getRow(1);
  walletHeader.height = 26;
  walletHeader.eachCell(cell => styleHeader(cell, COLORS.surface));

  let totalRow = ['TOTAL'];
  const totalsByMonth = new Array(12).fill(0);

  for (const acc of accounts) {
    const rowValues = [acc.name];
    let first = null, last = null;
    for (let m = 1; m <= 12; m++) {
      const val = posMap[`${acc.id}_${m}`] || 0;
      rowValues.push(val);
      totalsByMonth[m - 1] += val;
      if (val !== 0) { if (first === null) first = val; last = val; }
    }
    const variation = (last || 0) - (first || 0);
    rowValues.push(variation);
    const row = walletSheet.addRow(rowValues);
    row.height = 20;
    row.eachCell((cell, i) => {
      styleCell(cell);
      if (i > 1) {
        cell.numFmt = '#,##0.00 €';
        if (i === 14) {
          const v = parseFloat(cell.value || 0);
          cell.font = { color: { argb: 'FF' + (v >= 0 ? COLORS.green : COLORS.red) }, bold: true, size: 10 };
        }
      }
    });
  }

  let totalVariation = totalsByMonth[11] - totalsByMonth[0];
  const totRow = walletSheet.addRow(['TOTAL', ...totalsByMonth.map(v => parseFloat(v.toFixed(2))), parseFloat(totalVariation.toFixed(2))]);
  totRow.height = 24;
  totRow.eachCell((cell, i) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF161B22' } };
    cell.font = { color: { argb: 'FF' + COLORS.text }, bold: true, size: 10 };
    if (i > 1) cell.numFmt = '#,##0.00 €';
    if (i === 14) {
      const v = parseFloat(cell.value || 0);
      cell.font = { color: { argb: 'FF' + (v >= 0 ? COLORS.green : COLORS.red) }, bold: true, size: 10 };
    }
  });

  // Write file
  await workbook.xlsx.writeFile(filePath);
  return { success: true, filePath };
}

module.exports = { exportExcel };
