import React, { useEffect, useState, useCallback } from 'react';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const fmtCompact = (n) => {
  if (!n) return '—';
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k€`;
  return `${n.toFixed(0)}€`;
};

function MonthCard({ monthIndex, year, data, isSelected, isCurrent, onClick }) {
  const monthNum = monthIndex + 1;
  const monthData = data[monthNum] || {};
  const revenus = monthData.revenus || 0;
  const depenses = monthData.depenses || 0;
  const epargne = monthData.epargne || 0;
  const solde = revenus - depenses - epargne;
  const hasTx = monthData.txCount > 0;
  const hasBudget = monthData.hasBudget;

  return (
    <button
      onClick={() => onClick(monthNum)}
      className={`
        relative p-4 rounded-xl border text-left transition-all duration-150
        ${isSelected
          ? 'border-[var(--c-accent)] bg-[color:var(--c-accent)]/10 shadow-lg shadow-[color:var(--c-accent)]/10'
          : 'border-[color:var(--c-border)] bg-[color:var(--c-surface)] hover:border-[color:var(--c-border2)] hover:bg-[color:var(--c-surface2)]'
        }
        ${isCurrent ? 'ring-1 ring-[var(--c-accent)]/40' : ''}
      `}
    >
      {/* Month name */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`text-sm font-bold ${isSelected ? 't-accent' : 't-text'}`}>{MONTHS_SHORT[monthIndex]}</div>
          {isCurrent && (
            <div className="text-[10px] t-accent mt-0.5 font-medium">Ce mois</div>
          )}
        </div>
        <div className="flex gap-1">
          {hasTx && <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: 'var(--c-green)' }} title="Transactions" />}
          {hasBudget && <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: 'var(--c-accent)' }} title="Budget planifié" />}
        </div>
      </div>

      {hasTx ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] t-muted">Revenus</span>
            <span className="text-[11px] font-medium t-green">{fmtCompact(revenus)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] t-muted">Dépenses</span>
            <span className="text-[11px] font-medium t-red">{fmtCompact(depenses)}</span>
          </div>
          <div className="pt-1.5 mt-1.5 border-t border-[color:var(--c-border)]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] t-muted">Solde</span>
              <span className={`text-[11px] font-bold ${solde >= 0 ? 't-green' : 't-red'}`}>{fmtCompact(solde)}</span>
            </div>
          </div>
          {/* Mini bar */}
          {revenus > 0 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-surface2)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (depenses / revenus) * 100)}%`,
                  background: depenses > revenus ? 'var(--c-red)' : 'var(--c-orange)',
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-14 t-muted text-xs">
          Aucune donnée
        </div>
      )}
    </button>
  );
}

export default function CalendarView({ year, month, onNavigate }) {
  const [yearData, setYearData] = useState({});
  const [budgetData, setBudgetData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [monthDetail, setMonthDetail] = useState(null);
  const [categories, setCategories] = useState([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const load = useCallback(async () => {
    const [totals, planResult, cats] = await Promise.all([
      window.api.getMonthlyTotals(year),
      window.api.getBudgetPlanning(year),
      window.api.getCategories(),
    ]);

    // Build month map: { [month]: { revenus, depenses, epargne, projet, txCount } }
    const map = {};
    for (const row of totals) {
      const m = parseInt(row.month);
      if (!map[m]) map[m] = { txCount: 0 };
      map[m][row.type] = row.total;
      map[m].txCount = (map[m].txCount || 0) + 1;
    }

    // Check which months have budget planning
    const budgetMonths = {};
    if (planResult?.data) {
      for (const key of Object.keys(planResult.data)) {
        const [, m] = key.split('_');
        const val = planResult.data[key];
        if (val > 0) budgetMonths[parseInt(m)] = true;
      }
    }
    for (const m of Object.keys(budgetMonths)) {
      if (!map[m]) map[m] = { txCount: 0 };
      map[m].hasBudget = true;
    }

    setYearData(map);
    setBudgetData(planResult || {});
    setCategories(cats);
  }, [year]);

  const loadMonthDetail = useCallback(async (m) => {
    const [txs, summary] = await Promise.all([
      window.api.getTransactions({ year, month: m }),
      window.api.getTransactionSummary(year, m),
    ]);
    setMonthDetail({ month: m, transactions: txs, summary });
  }, [year]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setSelectedMonth(month);
    loadMonthDetail(month);
  }, [month, loadMonthDetail]);

  const handleMonthClick = (m) => {
    setSelectedMonth(m);
    loadMonthDetail(m);
  };

  // Annual totals
  const annualTotals = { revenus: 0, depenses: 0, epargne: 0, projet: 0 };
  for (const m of Object.values(yearData)) {
    annualTotals.revenus += m.revenus || 0;
    annualTotals.depenses += m.depenses || 0;
    annualTotals.epargne += m.epargne || 0;
    annualTotals.projet += m.projet || 0;
  }
  const annualSolde = annualTotals.revenus - annualTotals.depenses - annualTotals.epargne - annualTotals.projet;

  // Category breakdown for selected month
  const catBreakdown = {};
  if (monthDetail?.transactions) {
    for (const tx of monthDetail.transactions) {
      if (tx.type === 'depenses') {
        const cat = tx.category_name || 'Non catégorisé';
        catBreakdown[cat] = (catBreakdown[cat] || 0) + tx.amount;
      }
    }
  }
  const catEntries = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      {/* Annual KPIs */}
      <div className="flex items-center justify-between">
        <h2 className="t-text font-semibold">Calendrier budgétaire {year}</h2>
        <div className="flex items-center gap-2 text-xs t-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-green)' }} />Transactions</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--c-accent)' }} />Budget planifié</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          ['💰 Revenus annuels', fmt(annualTotals.revenus), 'var(--c-green)'],
          ['💸 Dépenses annuelles', fmt(annualTotals.depenses), 'var(--c-red)'],
          ['🏦 Épargne annuelle', fmt(annualTotals.epargne), 'var(--c-accent)'],
          ['📊 Solde annuel', fmt(annualSolde), annualSolde >= 0 ? 'var(--c-green)' : 'var(--c-red)'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <div className="text-[11px] t-muted mb-1">{label}</div>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Main content: calendar + detail */}
      <div className="grid grid-cols-3 gap-4">
        {/* Month grid */}
        <div className="col-span-2">
          <div className="grid grid-cols-3 gap-3">
            {MONTHS.map((_, i) => (
              <MonthCard
                key={i}
                monthIndex={i}
                year={year}
                data={yearData}
                isSelected={selectedMonth === i + 1}
                isCurrent={year === currentYear && i + 1 === currentMonth}
                onClick={handleMonthClick}
              />
            ))}
          </div>
        </div>

        {/* Month detail panel */}
        <div className="space-y-3">
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h3 className="text-sm font-bold t-text mb-3">
              {MONTHS[selectedMonth - 1]} {year}
            </h3>

            {monthDetail ? (
              <>
                {/* Summary */}
                <div className="space-y-2 mb-4">
                  {[
                    ['Revenus', monthDetail.summary?.find(s => s.type === 'revenus')?.total, 'var(--c-green)', '+'],
                    ['Dépenses', monthDetail.summary?.find(s => s.type === 'depenses')?.total, 'var(--c-red)', '-'],
                    ['Épargne', monthDetail.summary?.find(s => s.type === 'epargne')?.total, 'var(--c-accent)', '-'],
                    ['Projets', monthDetail.summary?.find(s => s.type === 'projet')?.total, 'var(--c-purple)', '-'],
                  ].map(([label, val, color, sign]) => val > 0 && (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-xs t-muted">{label}</span>
                      <span className="text-xs font-semibold" style={{ color }}>{sign}{fmt(val)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-1 border-t border-[color:var(--c-border)] flex justify-between">
                    <span className="text-xs font-semibold t-text">Solde</span>
                    <span className="text-sm font-bold" style={{
                      color: (() => {
                        const r = monthDetail.summary?.find(s => s.type === 'revenus')?.total || 0;
                        const d = monthDetail.summary?.find(s => s.type === 'depenses')?.total || 0;
                        const e = monthDetail.summary?.find(s => s.type === 'epargne')?.total || 0;
                        return (r - d - e) >= 0 ? 'var(--c-green)' : 'var(--c-red)';
                      })()
                    }}>
                      {(() => {
                        const r = monthDetail.summary?.find(s => s.type === 'revenus')?.total || 0;
                        const d = monthDetail.summary?.find(s => s.type === 'depenses')?.total || 0;
                        const e = monthDetail.summary?.find(s => s.type === 'epargne')?.total || 0;
                        return fmt(r - d - e);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Dépenses par catégorie */}
                {catEntries.length > 0 && (
                  <>
                    <h4 className="text-[11px] font-semibold t-muted uppercase mb-2">Dépenses par catégorie</h4>
                    <div className="space-y-2">
                      {catEntries.slice(0, 8).map(([cat, total]) => {
                        const depTotal = monthDetail.summary?.find(s => s.type === 'depenses')?.total || 1;
                        const pct = Math.min(100, (total / depTotal) * 100);
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="t-text truncate max-w-[120px]">{cat}</span>
                              <span className="t-muted">{fmt(total)}</span>
                            </div>
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-surface2)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--c-red)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Navigate button */}
                <button
                  onClick={() => onNavigate?.(selectedMonth)}
                  className="w-full mt-4 text-xs py-2 rounded-lg font-medium transition-colors"
                  style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}
                >
                  Aller à ce mois →
                </button>
              </>
            ) : (
              <div className="text-xs t-muted text-center py-6">Chargement...</div>
            )}
          </div>

          {/* Tx count */}
          <div className="bg-[color:var(--c-surface)] rounded-xl border border-[color:var(--c-border)] p-4">
            <h4 className="text-[11px] font-semibold t-muted uppercase mb-2">Activité {year}</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const d = yearData[m];
                const hasTx = d?.txCount > 0;
                return (
                  <button
                    key={m}
                    onClick={() => handleMonthClick(m)}
                    className="w-8 h-8 rounded text-[10px] font-medium transition-all"
                    style={{
                      background: selectedMonth === m
                        ? 'var(--c-accent)'
                        : hasTx ? 'color-mix(in srgb, var(--c-green) 20%, var(--c-surface2))'
                        : 'var(--c-surface2)',
                      color: selectedMonth === m
                        ? 'var(--c-bg)'
                        : hasTx ? 'var(--c-green)'
                        : 'var(--c-muted)',
                    }}
                    title={MONTHS[i]}
                  >
                    {MONTHS[i].slice(0, 1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
