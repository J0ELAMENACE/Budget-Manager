import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from 'recharts';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (n) => `${(n || 0).toFixed(1)}%`;

const PIE_COLORS = [
  '#58A6FF','#3FB950','#BC8CFF','#D29922','#F85149',
  '#79C0FF','#56D364','#D2A8FF','#FFA657','#FF7B72',
];

function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="t-muted text-xs">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="t-muted text-xs">{sub}</div>}
    </div>
  );
}

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[color:var(--c-surface2)] border border-[color:var(--c-border)] rounded-lg p-3 text-xs shadow-xl">
      <p className="t-text font-semibold mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="mb-0.5" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard({ year, month }) {
  const [summary, setSummary] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [planning, setPlanning] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const load = useCallback(async () => {
    const [sum, mon, plan, txs] = await Promise.all([
      window.api.getTransactionSummary(year, month),
      window.api.getMonthlyTotals(year),
      window.api.getBudgetPlanning(year),
      window.api.getTransactions({ year, month }),
    ]);
    setSummary(sum);
    setMonthly(mon);
    setPlanning(plan);
    setTransactions(txs);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const sumMap = {};
  for (const s of summary) sumMap[s.type] = s.total || 0;
  const revenus = sumMap['revenus'] || 0;
  const depenses = sumMap['depenses'] || 0;
  const epargne = sumMap['epargne'] || 0;
  const projet = sumMap['projet'] || 0;
  const solde = revenus - depenses - epargne - projet;
  const tauxEpargne = revenus > 0 ? (epargne / revenus) * 100 : 0;

  const monthlyData = MONTHS.map((m, i) => {
    const mn = String(i + 1).padStart(2, '0');
    const rows = monthly.filter(r => r.month === mn);
    const obj = { month: m };
    for (const r of rows) obj[r.type] = r.total || 0;
    return obj;
  });

  // Category breakdown
  const catMap = {};
  for (const tx of transactions) {
    if (tx.type === 'depenses') {
      const cat = tx.category_name || 'Autre';
      catMap[cat] = (catMap[cat] || 0) + tx.amount;
    }
  }
  const catPieData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const catBarData = catPieData.slice(0, 10).map(d => ({ name: d.name, Dépenses: d.value }));

  // Budget vs Réel
  let budgetComparison = [];
  if (planning) {
    const { categories, data } = planning;
    const typeMap = {};
    for (const cat of categories) {
      if (!typeMap[cat.type]) typeMap[cat.type] = 0;
      typeMap[cat.type] += data[`${cat.id}_${month}`] || 0;
    }
    budgetComparison = [
      { label: 'Revenus', budget: typeMap.revenus || 0, reel: revenus },
      { label: 'Dépenses', budget: typeMap.depenses || 0, reel: depenses },
      { label: 'Épargne', budget: typeMap.epargne || 0, reel: epargne },
      { label: 'Projets', budget: typeMap.projet || 0, reel: projet },
    ];
  }

  const ax = { fill: 'var(--c-muted)', fontSize: 11 };
  const tabs = [
    { id: 'overview', label: 'Vue générale' },
    { id: 'categories', label: 'Catégories' },
    { id: 'annual', label: 'Tendance annuelle' },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Revenus" value={fmt(revenus)} icon="💰" color="var(--c-green)" />
        <KpiCard label="Dépenses" value={fmt(depenses)} icon="💸" color="var(--c-red)" />
        <KpiCard label="Épargne" value={fmt(epargne)} icon="🏦" color="var(--c-accent)" sub={fmtPct(tauxEpargne) + ' du revenu'} />
        <KpiCard label="Projets" value={fmt(projet)} icon="🏠" color="var(--c-purple)" />
        <KpiCard label="Solde net" value={fmt(solde)} icon="📊" color={solde >= 0 ? 'var(--c-green)' : 'var(--c-red)'} />
        <KpiCard label="Taux épargne" value={fmtPct(tauxEpargne)} icon="📈" color="var(--c-orange)" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: activeTab === t.id ? 'var(--c-accent)' : 'transparent', color: activeTab === t.id ? 'var(--c-bg)' : 'var(--c-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Budget vs Réel — {MONTHS[month - 1]} {year}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetComparison} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="label" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--c-muted)' }} />
                <Bar dataKey="budget" name="Budget" fill="var(--c-border)" radius={[3,3,0,0]} />
                <Bar dataKey="reel" name="Réel" fill="var(--c-accent)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Répartition dépenses</h3>
            {catPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={82} paddingAngle={2}
                    dataKey="value" labelLine={false} label={<PieLabel />}>
                    {catPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: 'var(--c-text)' }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: 'var(--c-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center t-muted text-sm">Aucune dépense</div>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Top dépenses par catégorie</h3>
            {catBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={catBarData} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false} />
                  <XAxis type="number" tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
                  <YAxis type="category" dataKey="name" tick={{ ...ax, fontSize: 10 }} axisLine={false} tickLine={false} width={86} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="Dépenses" fill="var(--c-red)" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center t-muted text-sm">Aucune dépense ce mois</div>
            )}
          </div>
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Détail par catégorie</h3>
            <div className="space-y-2.5 overflow-y-auto max-h-[320px]">
              {catPieData.length === 0 && <div className="t-muted text-sm text-center py-10">Aucune dépense</div>}
              {catPieData.map(({ name, value }, i) => {
                const pct = depenses > 0 ? (value / depenses) * 100 : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="t-text font-medium">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="t-muted">{pct.toFixed(1)}%</span>
                        <span className="font-semibold w-20 text-right" style={{ color: 'var(--c-red)' }}>{fmt(value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden ml-4" style={{ background: 'var(--c-surface2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
              {catPieData.length > 0 && (
                <div className="pt-2 border-t border-[color:var(--c-border)] flex justify-between text-xs">
                  <span className="t-muted font-semibold">Total dépenses</span>
                  <span className="font-bold" style={{ color: 'var(--c-red)' }}>{fmt(depenses)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Annual */}
      {activeTab === 'annual' && (
        <div className="space-y-4">
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Flux mensuels {year}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--c-muted)' }} />
                <Bar dataKey="revenus" name="Revenus" fill="var(--c-green)" radius={[3,3,0,0]} />
                <Bar dataKey="depenses" name="Dépenses" fill="var(--c-red)" radius={[3,3,0,0]} />
                <Bar dataKey="epargne" name="Épargne" fill="var(--c-accent)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-semibold t-text mb-4">Tendance {year}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--c-muted)' }} />
                <Line type="monotone" dataKey="revenus" name="Revenus" stroke="var(--c-green)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="var(--c-red)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="epargne" name="Épargne" stroke="var(--c-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
