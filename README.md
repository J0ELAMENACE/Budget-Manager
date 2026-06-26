# ðŸ’° Budget Manager

Application de gestion budgÃ©taire personnelle, cross-platform Windows & Linux.

Construite avec Electron, React 18, Tailwind CSS et SQLite â€” 100% locale, aucune donnÃ©e envoyÃ©e en ligne.

---

## FonctionnalitÃ©s

| Module | Description |
|---|---|
| ðŸ“Š **Dashboard** | KPIs mensuels, budget vs rÃ©el, rÃ©partition par catÃ©gorie, tendance annuelle |
| ðŸ—“ï¸ **Calendrier** | Vue annuelle 12 mois avec soldes et activitÃ© par mois |
| ðŸ“… **Budget Planning** | Matrice Ã©ditable catÃ©gories Ã— 12 mois |
| ðŸ“‹ **Transactions** | CRUD complet, filtres par type, onglet dÃ©penses pro |
| ðŸ’¼ **DÃ©penses pro** | Frais avancÃ©s avec statut remboursement, exclus du budget courant |
| ðŸ’¼ **Patrimoine** | Suivi mensuel des comptes + courbe d'Ã©volution |
| ðŸ  **Projets immobiliers** | Simulateur de crÃ©dit, taux par rÃ©gion, calculateur d'apport |
| âš™ï¸ **ParamÃ¨tres** | CatÃ©gories personnalisÃ©es, annÃ©e de dÃ©marrage |
| ðŸ“¥ **Import Excel** | Import automatique depuis .xlsx / .xls / .csv |
| ðŸ“¤ **Export Excel** | Export 4 feuilles : RÃ©sumÃ©, Transactions, Planning, Patrimoine |
| ðŸŒ— **ThÃ¨me** | Mode clair et mode sombre |

---

## Stack technique

- **Frontend** â€” React 18, Tailwind CSS, Recharts
- **Desktop** â€” Electron 29
- **Base de donnÃ©es** â€” SQLite via `better-sqlite3` (stockage local)
- **Build** â€” Vite 5, electron-builder
- **Export/Import** â€” ExcelJS

---

## PrÃ©requis

- Node.js 18 ou supÃ©rieur
- npm 9+

---

## Installation

```bash
git clone https://github.com/J0ELAMENACE/Budget-Manager.git
cd budget-manager
npm install
```

---

## DÃ©veloppement

```bash
npm run dev
```

Lance Vite (port 5173) et Electron en parallÃ¨le avec hot-reload.

---

## Build

```bash
# Windows â€” gÃ©nÃ¨re un installeur .exe (NSIS)
npm run dist:win

# Linux â€” gÃ©nÃ¨re une AppImage
npm run dist:linux

# Les deux en une commande
npm run dist:all
```

Les fichiers de sortie sont dans `dist-electron/`.

---

## DonnÃ©es

Les donnÃ©es sont stockÃ©es localement dans la base SQLite suivante :

| SystÃ¨me | Chemin |
|---|---|
| Windows | `%APPDATA%\BudgetManager\budget.db` |
| Linux | `~/.config/BudgetManager/budget.db` |

Aucune donnÃ©e n'est envoyÃ©e Ã  un serveur externe.

---

## Structure du projet

```
budget-manager/
â”œâ”€â”€ electron/
â”‚   â”œâ”€â”€ main.js          # Main process Electron + IPC handlers
â”‚   â”œâ”€â”€ preload.js       # Bridge contextIsolation â†’ renderer
â”‚   â”œâ”€â”€ database.js      # API SQLite (better-sqlite3)
â”‚   â”œâ”€â”€ export.js        # Export Excel (ExcelJS)
â”‚   â””â”€â”€ importer.js      # Import Excel/CSV
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.jsx           # Layout principal + routing
â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â””â”€â”€ ThemeContext.jsx
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â””â”€â”€ ThreeDotMenu.jsx
â”‚   â””â”€â”€ views/
â”‚       â”œâ”€â”€ Dashboard.jsx
â”‚       â”œâ”€â”€ CalendarView.jsx
â”‚       â”œâ”€â”€ BudgetPlanning.jsx
â”‚       â”œâ”€â”€ BudgetTracking.jsx
â”‚       â”œâ”€â”€ ProExpenses.jsx
â”‚       â”œâ”€â”€ Wallet.jsx
â”‚       â”œâ”€â”€ Projects.jsx
â”‚       â””â”€â”€ Settings.jsx
â”œâ”€â”€ index.html
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ tailwind.config.js
â””â”€â”€ package.json
```

---

## Licence

PropriÃ©taire â€” voir [LICENSE](./LICENSE).
