# 💰 Budget Manager

Application de gestion budgétaire personnelle, cross-platform Windows & Linux.

Construite avec Electron, React 18, Tailwind CSS et SQLite — 100% locale, aucune donnée envoyée en ligne.

---

## Fonctionnalités

| Module | Description |
|---|---|
| 📊 **Dashboard** | KPIs mensuels, budget vs réel, répartition par catégorie, tendance annuelle |
| 🗓️ **Calendrier** | Vue annuelle 12 mois avec soldes et activité par mois |
| 📅 **Budget Planning** | Matrice éditable catégories × 12 mois |
| 📋 **Transactions** | CRUD complet, filtres par type, onglet dépenses pro |
| 💼 **Dépenses pro** | Frais avancés avec statut remboursement, exclus du budget courant |
| 💼 **Patrimoine** | Suivi mensuel des comptes + courbe d'évolution |
| 🏠 **Projets immobiliers** | Simulateur de crédit, taux par région, calculateur d'apport |
| ⚙️ **Paramètres** | Catégories personnalisées, année de démarrage |
| 📥 **Import Excel** | Import automatique depuis .xlsx / .xls / .csv |
| 📤 **Export Excel** | Export 4 feuilles : Résumé, Transactions, Planning, Patrimoine |
| 🌗 **Thème** | Mode clair et mode sombre |

---

## Stack technique

- **Frontend** — React 18, Tailwind CSS, Recharts
- **Desktop** — Electron 29
- **Base de données** — SQLite via `better-sqlite3` (stockage local)
- **Build** — Vite 5, electron-builder
- **Export/Import** — ExcelJS

---

## Prérequis

- Node.js 18 ou supérieur
- npm 9+

---

## Installation

```bash
git clone https://github.com/TON_USERNAME/budget-manager.git
cd budget-manager
npm install
```

---

## Développement

```bash
npm run dev
```

Lance Vite (port 5173) et Electron en parallèle avec hot-reload.

---

## Build

```bash
# Windows — génère un installeur .exe (NSIS)
npm run dist:win

# Linux — génère une AppImage
npm run dist:linux

# Les deux en une commande
npm run dist:all
```

Les fichiers de sortie sont dans `dist-electron/`.

---

## Données

Les données sont stockées localement dans la base SQLite suivante :

| Système | Chemin |
|---|---|
| Windows | `%APPDATA%\BudgetManager\budget.db` |
| Linux | `~/.config/BudgetManager/budget.db` |

Aucune donnée n'est envoyée à un serveur externe.

---

## Structure du projet

```
budget-manager/
├── electron/
│   ├── main.js          # Main process Electron + IPC handlers
│   ├── preload.js       # Bridge contextIsolation → renderer
│   ├── database.js      # API SQLite (better-sqlite3)
│   ├── export.js        # Export Excel (ExcelJS)
│   └── importer.js      # Import Excel/CSV
├── src/
│   ├── App.jsx           # Layout principal + routing
│   ├── context/
│   │   └── ThemeContext.jsx
│   ├── components/
│   │   └── ThreeDotMenu.jsx
│   └── views/
│       ├── Dashboard.jsx
│       ├── CalendarView.jsx
│       ├── BudgetPlanning.jsx
│       ├── BudgetTracking.jsx
│       ├── ProExpenses.jsx
│       ├── Wallet.jsx
│       ├── Projects.jsx
│       └── Settings.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Licence

Propriétaire — voir [LICENSE](./LICENSE).
