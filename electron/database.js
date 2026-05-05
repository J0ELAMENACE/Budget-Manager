const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const DB_DIR = path.join(app.getPath('userData'), 'BudgetManager');
const DB_PATH = path.join(DB_DIR, 'budget.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('revenus','depenses','epargne','projet')),
    is_default INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS budget_planning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    amount REAL DEFAULT 0,
    UNIQUE(category_id, year, month)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    value_date TEXT,
    type TEXT NOT NULL CHECK(type IN ('revenus','depenses','epargne','projet')),
    category_id INTEGER REFERENCES categories(id),
    amount REAL NOT NULL,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wallet_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'courant',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS wallet_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL DEFAULT 0,
    UNIQUE(account_id, year, month)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'etude',
    type TEXT DEFAULT 'appartement',
    operation TEXT DEFAULT 'achat',
    surface REAL,
    dpe TEXT,
    heating TEXT,
    price REAL,
    bank TEXT,
    loan_duration INTEGER DEFAULT 20,
    taeg REAL,
    insurance_rate REAL DEFAULT 0.36,
    apport REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pro_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Autre',
    amount REAL NOT NULL,
    detail TEXT,
    justificatif TEXT,
    status TEXT NOT NULL DEFAULT 'en_attente' CHECK(status IN ('en_attente','rembourse')),
    reimbursed_date TEXT,
    reimbursed_tx_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mortgage_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    duration INTEGER NOT NULL,
    rate REAL NOT NULL
  );
`);

// ─── Seeds ────────────────────────────────────────────────────────────────────

const seedCategories = db.prepare('SELECT COUNT(*) as c FROM categories').get();
if (seedCategories.c === 0) {
  const ins = db.prepare('INSERT INTO categories (name, type, is_default) VALUES (?, ?, 1)');
  const seeds = [
    ['Salaire', 'revenus'], ['Part revenus', 'revenus'], ['Parents', 'revenus'],
    ['CAF', 'revenus'], ['Autres revenus', 'revenus'],
    ['Prêt immobilier', 'depenses'], ['Loyer', 'depenses'], ['Assurance appart', 'depenses'],
    ['Frais bancaires', 'depenses'], ['Internet', 'depenses'], ['Forfait mobile', 'depenses'],
    ['EDF', 'depenses'], ['Eau', 'depenses'], ['Courses', 'depenses'],
    ['Transport', 'depenses'], ['Santé', 'depenses'], ['Loisirs', 'depenses'],
    ['Autres dépenses', 'depenses'],
    ['Livret A', 'epargne'], ['LEP', 'epargne'], ['Autres épargne', 'epargne'],
    ['Projet immobilier #1', 'projet'], ['Autres projets', 'projet'],
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) ins.run(r[0], r[1]); });
  insertMany(seeds);
}

const seedAccounts = db.prepare('SELECT COUNT(*) as c FROM wallet_accounts').get();
if (seedAccounts.c === 0) {
  const ins = db.prepare('INSERT INTO wallet_accounts (name, type, sort_order) VALUES (?, ?, ?)');
  [
    ['Crédit Agricole', 'courant', 0],
    ['Livret A', 'epargne', 1],
    ['LEP', 'epargne', 2],
    ['Livret Jeune', 'epargne', 3],
  ].forEach(r => ins.run(...r));
}

const seedRates = db.prepare('SELECT COUNT(*) as c FROM mortgage_rates').get();
if (seedRates.c === 0) {
  const ins = db.prepare('INSERT INTO mortgage_rates (region, duration, rate) VALUES (?, ?, ?)');
  const rates = [
    ['Île-de-France', 15, 3.40], ['Île-de-France', 20, 3.60], ['Île-de-France', 25, 3.80],
    ['Auvergne-Rhône-Alpes', 15, 3.45], ['Auvergne-Rhône-Alpes', 20, 3.65], ['Auvergne-Rhône-Alpes', 25, 3.85],
    ['Grand Est', 15, 3.50], ['Grand Est', 20, 3.66], ['Grand Est', 25, 3.90],
    ['Nouvelle-Aquitaine', 15, 3.48], ['Nouvelle-Aquitaine', 20, 3.68], ['Nouvelle-Aquitaine', 25, 3.88],
    ['Occitanie', 15, 3.47], ['Occitanie', 20, 3.67], ['Occitanie', 25, 3.87],
    ['PACA', 15, 3.42], ['PACA', 20, 3.62], ['PACA', 25, 3.82],
    ['Bretagne', 15, 3.52], ['Bretagne', 20, 3.72], ['Bretagne', 25, 3.92],
    ['Normandie', 15, 3.53], ['Normandie', 20, 3.73], ['Normandie', 25, 3.93],
    ['Hauts-de-France', 15, 3.55], ['Hauts-de-France', 20, 3.75], ['Hauts-de-France', 25, 3.95],
    ['Pays de la Loire', 15, 3.46], ['Pays de la Loire', 20, 3.66], ['Pays de la Loire', 25, 3.86],
    ['Centre-Val de Loire', 15, 3.51], ['Centre-Val de Loire', 20, 3.71], ['Centre-Val de Loire', 25, 3.91],
    ['Bourgogne-Franche-Comté', 15, 3.54], ['Bourgogne-Franche-Comté', 20, 3.74], ['Bourgogne-Franche-Comté', 25, 3.94],
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
  insertMany(rates);
}

const seedSettings = db.prepare('SELECT COUNT(*) as c FROM settings').get();
if (seedSettings.c === 0) {
  const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  [
    ['start_year', '2025'],
    ['savings_method', 'net'],
    ['currency', 'EUR'],
  ].forEach(r => ins.run(...r));
}

// ─── API ──────────────────────────────────────────────────────────────────────

// Settings
const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
};
const setSetting = (key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
};

// Categories
const getCategories = () => db.prepare('SELECT * FROM categories ORDER BY type, name').all();
const addCategory = (name, type) => {
  const r = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)').run(name, type);
  return r.lastInsertRowid;
};
const deleteCategory = (id) => db.prepare('DELETE FROM categories WHERE id = ? AND is_default = 0').run(id);

// Budget Planning
const getBudgetPlanning = (year) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY type, id').all();
  const rows = db.prepare('SELECT * FROM budget_planning WHERE year = ?').all(year);
  const map = {};
  for (const r of rows) map[`${r.category_id}_${r.month}`] = r.amount;
  return { categories: cats, data: map };
};
const setBudgetAmount = (categoryId, year, month, amount) => {
  db.prepare('INSERT OR REPLACE INTO budget_planning (category_id, year, month, amount) VALUES (?, ?, ?, ?)').run(categoryId, year, month, amount);
};
const saveBudgetPlan = (year, entries) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO budget_planning (category_id, year, month, amount) VALUES (?, ?, ?, ?)');
  const tx = db.transaction((items) => { for (const e of items) upsert.run(e.categoryId, year, e.month, e.amount); });
  tx(entries);
};

// Transactions
const getTransactions = ({ year, month, type } = {}) => {
  let q = `SELECT t.*, c.name as category_name, c.type as category_type
           FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1`;
  const params = [];
  if (year) { q += ` AND strftime('%Y', t.date) = ?`; params.push(String(year)); }
  if (month) { q += ` AND strftime('%m', t.date) = ?`; params.push(String(month).padStart(2, '0')); }
  if (type) { q += ` AND t.type = ?`; params.push(type); }
  q += ' ORDER BY t.date DESC, t.id DESC';
  return db.prepare(q).all(...params);
};
const addTransaction = (tx) => {
  const r = db.prepare(`INSERT INTO transactions (date, value_date, type, category_id, amount, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(tx.date, tx.value_date || null, tx.type, tx.category_id || null, tx.amount, tx.detail || null);
  return r.lastInsertRowid;
};
const updateTransaction = (id, tx) => {
  db.prepare(`UPDATE transactions SET date=?, value_date=?, type=?, category_id=?, amount=?, detail=? WHERE id=?`)
    .run(tx.date, tx.value_date || null, tx.type, tx.category_id || null, tx.amount, tx.detail || null, id);
};
const deleteTransaction = (id) => db.prepare('DELETE FROM transactions WHERE id = ?').run(id);

const getTransactionSummary = (year, month) => {
  const params = [];
  let dateFilter = '';
  if (year) { dateFilter += ` AND strftime('%Y', date) = ?`; params.push(String(year)); }
  if (month) { dateFilter += ` AND strftime('%m', date) = ?`; params.push(String(month).padStart(2, '0')); }
  return db.prepare(`
    SELECT type, SUM(amount) as total FROM transactions WHERE 1=1 ${dateFilter} GROUP BY type
  `).all(...params);
};

const getMonthlyTotals = (year) => {
  return db.prepare(`
    SELECT strftime('%m', date) as month, type, SUM(amount) as total
    FROM transactions WHERE strftime('%Y', date) = ?
    GROUP BY month, type ORDER BY month
  `).all(String(year));
};

// Wallet
const getWalletAccounts = () => db.prepare('SELECT * FROM wallet_accounts ORDER BY sort_order, id').all();
const addWalletAccount = (name, type) => {
  const r = db.prepare('INSERT INTO wallet_accounts (name, type) VALUES (?, ?)').run(name, type);
  return r.lastInsertRowid;
};
const deleteWalletAccount = (id) => db.prepare('DELETE FROM wallet_accounts WHERE id = ?').run(id);

const getWalletPositions = (year) => {
  return db.prepare('SELECT * FROM wallet_positions WHERE year = ?').all(year);
};
const setWalletPosition = (accountId, year, month, balance) => {
  db.prepare('INSERT OR REPLACE INTO wallet_positions (account_id, year, month, balance) VALUES (?, ?, ?, ?)').run(accountId, year, month, balance);
};
const getWalletEvolution = (year) => {
  return db.prepare(`
    SELECT wp.month, SUM(wp.balance) as total
    FROM wallet_positions wp WHERE wp.year = ?
    GROUP BY wp.month ORDER BY wp.month
  `).all(year);
};

// Projects
const getProjects = () => db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
const addProject = (p) => {
  const r = db.prepare(`INSERT INTO projects (name, status, type, operation, surface, dpe, heating, price, bank, loan_duration, taeg, insurance_rate, apport, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    p.name, p.status || 'etude', p.type || 'appartement', p.operation || 'achat',
    p.surface || null, p.dpe || null, p.heating || null, p.price || null,
    p.bank || null, p.loan_duration || 20, p.taeg || null, p.insurance_rate || 0.36,
    p.apport || 0, p.notes || null
  );
  return r.lastInsertRowid;
};
const updateProject = (id, p) => {
  db.prepare(`UPDATE projects SET name=?, status=?, type=?, operation=?, surface=?, dpe=?, heating=?, price=?, bank=?, loan_duration=?, taeg=?, insurance_rate=?, apport=?, notes=? WHERE id=?`).run(
    p.name, p.status, p.type, p.operation,
    p.surface || null, p.dpe || null, p.heating || null, p.price || null,
    p.bank || null, p.loan_duration || 20, p.taeg || null, p.insurance_rate || 0.36,
    p.apport || 0, p.notes || null, id
  );
};
const deleteProject = (id) => db.prepare('DELETE FROM projects WHERE id = ?').run(id);
const getMortgageRates = () => db.prepare('SELECT * FROM mortgage_rates ORDER BY region, duration').all();

module.exports = {
  getSettings, setSetting,
  getCategories, addCategory, deleteCategory,
  getBudgetPlanning, setBudgetAmount, saveBudgetPlan,
  getTransactions, addTransaction, updateTransaction, deleteTransaction,
  getTransactionSummary, getMonthlyTotals,
  getWalletAccounts, addWalletAccount, deleteWalletAccount,
  getWalletPositions, setWalletPosition, getWalletEvolution,
  getProjects, addProject, updateProject, deleteProject, getMortgageRates,
  getProExpenses, addProExpense, updateProExpense, deleteProExpense, reimburseProExpense, getProExpenseSummary,
};

// ─── Pro Expenses API ─────────────────────────────────────────────────────────

const getProExpenses = ({ year, month, status } = {}) => {
  let q = 'SELECT * FROM pro_expenses WHERE 1=1';
  const params = [];
  if (year)   { q += ` AND strftime('%Y', date) = ?`; params.push(String(year)); }
  if (month)  { q += ` AND strftime('%m', date) = ?`; params.push(String(month).padStart(2,'0')); }
  if (status) { q += ` AND status = ?`; params.push(status); }
  q += ' ORDER BY date DESC, id DESC';
  return db.prepare(q).all(...params);
};

const addProExpense = (p) => {
  const r = db.prepare(`INSERT INTO pro_expenses (date, category, amount, detail, justificatif, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    p.date, p.category || 'Autre', p.amount, p.detail || null,
    p.justificatif || null, p.status || 'en_attente', p.notes || null
  );
  return r.lastInsertRowid;
};

const updateProExpense = (id, p) => {
  db.prepare(`UPDATE pro_expenses SET date=?, category=?, amount=?, detail=?, justificatif=?, status=?, notes=? WHERE id=?`)
    .run(p.date, p.category || 'Autre', p.amount, p.detail || null, p.justificatif || null, p.status, p.notes || null, id);
};

const deleteProExpense = (id) => db.prepare('DELETE FROM pro_expenses WHERE id = ?').run(id);

// Mark as reimbursed + optionally create a revenus transaction
const reimburseProExpense = (id, reimburseDate, createTx) => {
  const pro = db.prepare('SELECT * FROM pro_expenses WHERE id = ?').get(id);
  if (!pro) return null;
  let txId = null;
  if (createTx) {
    const r = db.prepare(`INSERT INTO transactions (date, type, amount, detail) VALUES (?, 'revenus', ?, ?)`)
      .run(reimburseDate, pro.amount, `Remboursement frais pro : ${pro.detail || pro.category}`);
    txId = r.lastInsertRowid;
  }
  db.prepare(`UPDATE pro_expenses SET status='rembourse', reimbursed_date=?, reimbursed_tx_id=? WHERE id=?`)
    .run(reimburseDate, txId, id);
  return { success: true, txId };
};

const getProExpenseSummary = () => {
  return db.prepare(`
    SELECT status, COUNT(*) as count, SUM(amount) as total
    FROM pro_expenses GROUP BY status
  `).all();
};
