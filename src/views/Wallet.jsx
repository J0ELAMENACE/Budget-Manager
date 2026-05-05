import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

const ACCOUNT_COLORS = ['#58A6FF','#3FB950','#BC8CFF','#D29922','#F85149','#79C0FF','#56D364'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-text font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text text-lg">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Wallet({ year, month }) {
  const [accounts, setAccounts] = useState([]);
  const [positions, setPositions] = useState({});
  const [evolution, setEvolution] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('epargne');
  const [editing, setEditing] = useState(null); // { accountId, month }

  const load = useCallback(async () => {
    const [accs, pos, evo] = await Promise.all([
      window.api.getWalletAccounts(),
      window.api.getWalletPositions(year),
      window.api.getWalletEvolution(year),
    ]);
    setAccounts(accs);
    const posMap = {};
    for (const p of pos) posMap[`${p.account_id}_${p.month}`] = p.balance;
    setPositions(posMap);
    setEvolution(evo);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const handleCellChange = async (accountId, m, value) => {
    const balance = parseFloat(value) || 0;
    await window.api.setWalletPosition(accountId, year, m, balance);
    load();
  };

  const handleAddAccount = async () => {
    if (!newName.trim()) return;
    await window.api.addWalletAccount(newName.trim(), newType);
    setNewName(''); setShowAdd(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce compte ?')) {
      await window.api.deleteWalletAccount(id);
      load();
    }
  };

  // Evolution chart data
  const chartData = MONTHS.map((m, i) => {
    const row = evolution.find(e => e.month === i + 1);
    return { month: m, total: row ? row.total : null };
  });

  // Totals
  const monthlyTotals = MONTHS.map((_, i) =>
    accounts.reduce((acc, a) => acc + (positions[`${a.id}_${i + 1}`] || 0), 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-text font-semibold">Patrimoine {year}</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-bg text-xs px-4 py-2 rounded font-medium transition-colors">
          + Compte
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-2 text-muted sticky top-0 z-10">
              <th className="text-left px-4 py-3 font-medium w-40 sticky left-0 bg-surface-2 border-r border-border">Compte</th>
              {MONTHS.map((m, i) => (
                <th key={i} className={`px-2 py-3 text-center font-medium min-w-[80px] ${i + 1 === month ? 'text-accent' : ''}`}>{m}</th>
              ))}
              <th className="px-3 py-3 text-center font-medium text-text min-w-[80px]">Variation</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, ai) => {
              const vals = MONTHS.map((_, i) => positions[`${acc.id}_${i + 1}`] || 0);
              const nonZero = vals.filter(v => v !== 0);
              const variation = nonZero.length > 0 ? vals[vals.length - 1] - nonZero[0] : 0;
              return (
                <tr key={acc.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                  <td className="px-4 py-2 sticky left-0 bg-bg border-r border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ACCOUNT_COLORS[ai % ACCOUNT_COLORS.length] }} />
                      <span className="text-text truncate">{acc.name}</span>
                    </div>
                  </td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className={`px-1 py-1 ${i + 1 === month ? 'bg-accent/5' : ''}`}>
                      <input
                        type="number"
                        step="0.01"
                        value={positions[`${acc.id}_${i + 1}`] || ''}
                        onChange={() => {}}
                        onBlur={e => handleCellChange(acc.id, i + 1, e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-center text-text focus:outline-none focus:bg-surface-2 rounded px-1 py-0.5 placeholder-border text-xs"
                      />
                    </td>
                  ))}
                  <td className={`px-3 py-2 text-center font-semibold ${variation >= 0 ? 'text-green' : 'text-red'}`}>
                    {variation >= 0 ? '+' : ''}{fmt(variation)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => handleDelete(acc.id)} className="text-muted hover:text-red transition-colors text-xs">🗑️</button>
                  </td>
                </tr>
              );
            })}
            {/* Totals */}
            <tr className="bg-surface border-t border-border">
              <td className="px-4 py-2 sticky left-0 bg-surface border-r border-border font-bold text-text">TOTAL</td>
              {monthlyTotals.map((t, i) => (
                <td key={i} className={`px-2 py-2 text-center font-bold text-accent ${i + 1 === month ? 'bg-accent/5' : ''}`}>
                  {t ? fmt(t) : '—'}
                </td>
              ))}
              <td className={`px-3 py-2 text-center font-bold ${(monthlyTotals[11] - monthlyTotals[0]) >= 0 ? 'text-green' : 'text-red'}`}>
                {fmt(monthlyTotals[11] - monthlyTotals[0])}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Evolution chart */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-text mb-4">Évolution du patrimoine {year}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="month" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={v => fmt(v)}
              contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#E6EDF3' }}
            />
            <Line type="monotone" dataKey="total" name="Total patrimoine" stroke="#58A6FF" strokeWidth={2.5} dot={{ fill: '#58A6FF', r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Add account modal */}
      {showAdd && (
        <Modal title="Nouveau compte" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-muted text-xs block mb-1">Nom du compte</label>
              <input type="text" placeholder="ex: Livret B" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-accent">
                <option value="courant">Compte courant</option>
                <option value="epargne">Livret / Épargne</option>
                <option value="placement">Placement</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-surface-2 text-muted py-2 rounded text-sm hover:bg-border transition-colors">Annuler</button>
              <button onClick={handleAddAccount} disabled={!newName.trim()}
                className="flex-1 bg-accent text-bg py-2 rounded text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40">Ajouter</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
