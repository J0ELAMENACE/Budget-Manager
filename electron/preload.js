const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('api', {
  // Settings
  getSettings: () => invoke('get-settings'),
  setSetting: (key, value) => invoke('set-setting', key, value),

  // Categories
  getCategories: () => invoke('get-categories'),
  addCategory: (name, type) => invoke('add-category', name, type),
  deleteCategory: (id) => invoke('delete-category', id),

  // Budget Planning
  getBudgetPlanning: (year) => invoke('get-budget-planning', year),
  saveBudgetPlan: (year, entries) => invoke('save-budget-plan', year, entries),

  // Transactions
  getTransactions: (filters) => invoke('get-transactions', filters),
  addTransaction: (tx) => invoke('add-transaction', tx),
  updateTransaction: (id, tx) => invoke('update-transaction', id, tx),
  deleteTransaction: (id) => invoke('delete-transaction', id),
  getTransactionSummary: (year, month) => invoke('get-transaction-summary', year, month),
  getMonthlyTotals: (year) => invoke('get-monthly-totals', year),

  // Wallet
  getWalletAccounts: () => invoke('get-wallet-accounts'),
  addWalletAccount: (name, type) => invoke('add-wallet-account', name, type),
  deleteWalletAccount: (id) => invoke('delete-wallet-account', id),
  getWalletPositions: (year) => invoke('get-wallet-positions', year),
  setWalletPosition: (accountId, year, month, balance) => invoke('set-wallet-position', accountId, year, month, balance),
  getWalletEvolution: (year) => invoke('get-wallet-evolution', year),

  // Projects
  getProjects: () => invoke('get-projects'),
  addProject: (p) => invoke('add-project', p),
  updateProject: (id, p) => invoke('update-project', id, p),
  deleteProject: (id) => invoke('delete-project', id),
  getMortgageRates: () => invoke('get-mortgage-rates'),

  // Export
  exportExcel: (params) => invoke('export-excel', params),
  showSaveDialog: (options) => invoke('show-save-dialog', options),
  showOpenDialog: (options) => invoke('show-open-dialog', options),
  importExcel: (filePath) => invoke('import-excel', filePath),

  // Pro Expenses
  getProExpenses: (filters) => invoke('get-pro-expenses', filters),
  addProExpense: (p) => invoke('add-pro-expense', p),
  updateProExpense: (id, p) => invoke('update-pro-expense', id, p),
  deleteProExpense: (id) => invoke('delete-pro-expense', id),
  reimburseProExpense: (id, date, createTx) => invoke('reimburse-pro-expense', id, date, createTx),
  getProExpenseSummary: () => invoke('get-pro-expense-summary'),
});
