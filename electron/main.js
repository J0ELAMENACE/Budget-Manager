const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0D1117',
    titleBarStyle: process.platform === 'win32' ? 'default' : 'hidden',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#0D1117',
      symbolColor: '#E6EDF3',
      height: 32,
    } : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

const db = require('./database');

ipcMain.handle('get-settings', () => db.getSettings());
ipcMain.handle('set-setting', (_, key, value) => db.setSetting(key, value));

ipcMain.handle('get-categories', () => db.getCategories());
ipcMain.handle('add-category', (_, name, type) => db.addCategory(name, type));
ipcMain.handle('delete-category', (_, id) => db.deleteCategory(id));

ipcMain.handle('get-budget-planning', (_, year) => db.getBudgetPlanning(year));
ipcMain.handle('save-budget-plan', (_, year, entries) => db.saveBudgetPlan(year, entries));

ipcMain.handle('get-transactions', (_, filters) => db.getTransactions(filters));
ipcMain.handle('add-transaction', (_, tx) => db.addTransaction(tx));
ipcMain.handle('update-transaction', (_, id, tx) => db.updateTransaction(id, tx));
ipcMain.handle('delete-transaction', (_, id) => db.deleteTransaction(id));
ipcMain.handle('get-transaction-summary', (_, year, month) => db.getTransactionSummary(year, month));
ipcMain.handle('get-monthly-totals', (_, year) => db.getMonthlyTotals(year));

ipcMain.handle('get-wallet-accounts', () => db.getWalletAccounts());
ipcMain.handle('add-wallet-account', (_, name, type) => db.addWalletAccount(name, type));
ipcMain.handle('delete-wallet-account', (_, id) => db.deleteWalletAccount(id));
ipcMain.handle('get-wallet-positions', (_, year) => db.getWalletPositions(year));
ipcMain.handle('set-wallet-position', (_, accountId, year, month, balance) => db.setWalletPosition(accountId, year, month, balance));
ipcMain.handle('get-wallet-evolution', (_, year) => db.getWalletEvolution(year));

ipcMain.handle('get-projects', () => db.getProjects());
ipcMain.handle('add-project', (_, p) => db.addProject(p));
ipcMain.handle('update-project', (_, id, p) => db.updateProject(id, p));
ipcMain.handle('delete-project', (_, id) => db.deleteProject(id));
ipcMain.handle('get-mortgage-rates', () => db.getMortgageRates());

ipcMain.handle('show-save-dialog', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('export-excel', async (_, params) => {
  const exporter = require('./export');
  return exporter.exportExcel(params, db);
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Pro Expenses
ipcMain.handle('get-pro-expenses', (_, filters) => db.getProExpenses(filters));
ipcMain.handle('add-pro-expense', (_, p) => db.addProExpense(p));
ipcMain.handle('update-pro-expense', (_, id, p) => db.updateProExpense(id, p));
ipcMain.handle('delete-pro-expense', (_, id) => db.deleteProExpense(id));
ipcMain.handle('reimburse-pro-expense', (_, id, date, createTx) => db.reimburseProExpense(id, date, createTx));
ipcMain.handle('get-pro-expense-summary', () => db.getProExpenseSummary());

ipcMain.handle('import-excel', async (_, filePath) => {
  const importer = require('./importer');
  return importer.importExcel(filePath, db);
});
