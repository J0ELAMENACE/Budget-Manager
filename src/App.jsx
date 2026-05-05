import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Dashboard from './views/Dashboard';
import BudgetPlanning from './views/BudgetPlanning';
import BudgetTracking from './views/BudgetTracking';
import Wallet from './views/Wallet';
import Projects from './views/Projects';
import Settings from './views/Settings';
import CalendarView from './views/CalendarView';
import ThreeDotMenu from './components/ThreeDotMenu';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '📊' },
  { id: 'calendar',   label: 'Calendrier',      icon: '🗓️' },
  { id: 'planning',   label: 'Budget Planning', icon: '📅' },
  { id: 'tracking',   label: 'Transactions',    icon: '📋' },
  { id: 'wallet',     label: 'Patrimoine',      icon: '💼' },
  { id: 'projects',   label: 'Projets',         icon: '🏠' },
  { id: 'settings',   label: 'Paramètres',      icon: '⚙️' },
];

const VIEWS = {
  dashboard: Dashboard,
  calendar: CalendarView,
  planning: BudgetPlanning,
  tracking: BudgetTracking,
  wallet: Wallet,
  projects: Projects,
  settings: Settings,
};

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function AppInner() {
  const [view, setView] = useState('dashboard');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [collapsed, setCollapsed] = useState(false);
  const [importKey, setImportKey] = useState(0); // force re-render after import
  const { theme, toggle } = useTheme();

  const ActiveView = VIEWS[view];

  // Calendar navigates to a month → switch to tracking view
  const handleCalendarNavigate = (m) => {
    setMonth(m);
    setView('tracking');
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r transition-all duration-200 shrink-0 ${collapsed ? 'w-14' : 'w-52'}`}
        style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4 h-14 titlebar-drag"
          style={{ borderBottom: '1px solid var(--c-border)' }}
        >
          <span className="text-xl shrink-0">💰</span>
          {!collapsed && (
            <span className="font-bold text-sm titlebar-no-drag" style={{ color: 'var(--c-text)' }}>
              Budget Manager
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{
                  color: active ? 'var(--c-accent)' : 'var(--c-muted)',
                  background: active ? 'color-mix(in srgb, var(--c-accent) 10%, transparent)' : 'transparent',
                  borderRight: active ? '2px solid var(--c-accent)' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-surface2)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle + collapse */}
        <div className="p-2 space-y-1" style={{ borderTop: '1px solid var(--c-border)' }}>
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center p-2 rounded text-sm transition-colors"
            style={{ color: 'var(--c-muted)' }}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
            {!collapsed && <span className="ml-2 text-xs">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded transition-colors text-sm"
            style={{ color: 'var(--c-muted)' }}
            title={collapsed ? 'Agrandir' : 'Réduire'}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-5 shrink-0 titlebar-drag"
          style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
        >
          {/* Left: view title */}
          <div className="titlebar-no-drag flex items-center gap-2">
            <span className="text-base">{NAV.find(n => n.id === view)?.icon}</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>
              {NAV.find(n => n.id === view)?.label}
            </span>
          </div>

          {/* Right: year/month + 3-dot menu */}
          <div className="titlebar-no-drag flex items-center gap-2">
            {/* Year */}
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-xs rounded px-2 py-1.5 focus:outline-none"
              style={{
                background: 'var(--c-surface2)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-text)',
              }}
            >
              {Array.from({ length: 6 }, (_, i) => 2023 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Month */}
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="text-xs rounded px-2 py-1.5 focus:outline-none"
              style={{
                background: 'var(--c-surface2)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-text)',
              }}
            >
              {MONTHS_SHORT.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            {/* 3-dot menu */}
            <ThreeDotMenu
              year={year}
              month={month}
              onImportDone={() => setImportKey(k => k + 1)}
            />
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-auto p-5" key={importKey}>
          {view === 'calendar' ? (
            <ActiveView year={year} month={month} onNavigate={handleCalendarNavigate} />
          ) : (
            <ActiveView year={year} month={month} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
