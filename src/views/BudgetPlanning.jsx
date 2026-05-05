import React, { useEffect, useState, useCallback } from 'react';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const TYPE_LABELS = { revenus: '💰 Revenus', depenses: '💸 Dépenses', epargne: '🏦 Épargne', projet: '🏠 Projets' };
const TYPE_COLORS = { revenus: 'text-green', depenses: 'text-red', epargne: 'text-accent', projet: 'text-purple' };
const fmt = (n) => n ? n.toFixed(2) : '';

export default function BudgetPlanning({ year, month }) {
  const [data, setData] = useState({});
  const [categories, setCategories] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const result = await window.api.getBudgetPlanning(year);
    setCategories(result.categories);
    setData(result.data);
    setDirty(false);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (catId, m, value) => {
    const key = `${catId}_${m}`;
    setData(prev => ({ ...prev, [key]: value === '' ? 0 : parseFloat(value) || 0 }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = [];
    for (const cat of categories) {
      for (let m = 1; m <= 12; m++) {
        entries.push({ categoryId: cat.id, month: m, amount: data[`${cat.id}_${m}`] || 0 });
      }
    }
    await window.api.saveBudgetPlan(year, entries);
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Group by type
  const grouped = {};
  for (const cat of categories) {
    if (!grouped[cat.type]) grouped[cat.type] = [];
    grouped[cat.type].push(cat);
  }

  // Monthly totals per type
  const typeTotals = {};
  for (const type of Object.keys(grouped)) {
    typeTotals[type] = {};
    for (let m = 1; m <= 12; m++) {
      typeTotals[type][m] = grouped[type].reduce((acc, cat) => acc + (data[`${cat.id}_${m}`] || 0), 0);
    }
  }

  // Annual total per category
  const catAnnual = (cat) => Array.from({ length: 12 }, (_, i) => data[`${cat.id}_${i + 1}`] || 0).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-text font-semibold">Planning budgétaire {year}</h2>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded transition-colors
            ${dirty ? 'bg-accent text-bg hover:bg-accent/90' : 'bg-surface-2 text-muted cursor-not-allowed'}
            ${saved ? '!bg-green !text-bg' : ''}`}
        >
          {saving ? '⏳ Sauvegarde...' : saved ? '✓ Sauvegardé' : dirty ? '💾 Sauvegarder' : '✓ À jour'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-2 text-muted sticky top-0 z-10">
              <th className="text-left px-3 py-2.5 font-medium w-44 sticky left-0 bg-surface-2 border-r border-border">Catégorie</th>
              {MONTHS.map((m, i) => (
                <th key={i} className={`px-2 py-2.5 font-medium text-center min-w-[72px] ${i + 1 === month ? 'text-accent' : ''}`}>
                  {m}
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium text-center text-text min-w-[88px]">Annuel</th>
            </tr>
          </thead>
          <tbody>
            {['revenus', 'depenses', 'epargne', 'projet'].map(type => (
              grouped[type]?.length > 0 && (
                <React.Fragment key={type}>
                  {/* Section header */}
                  <tr className="bg-surface border-y border-border">
                    <td className={`px-3 py-2 font-bold sticky left-0 bg-surface ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</td>
                    {Array.from({ length: 12 }, (_, i) => (
                      <td key={i} className={`px-2 py-2 text-center font-semibold ${TYPE_COLORS[type]}`}>
                        {typeTotals[type]?.[i + 1] ? typeTotals[type][i + 1].toFixed(0) : ''}
                      </td>
                    ))}
                    <td className={`px-3 py-2 text-center font-bold ${TYPE_COLORS[type]}`}>
                      {Object.values(typeTotals[type] || {}).reduce((a, b) => a + b, 0).toFixed(0)}
                    </td>
                  </tr>
                  {/* Category rows */}
                  {grouped[type].map(cat => (
                    <tr key={cat.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                      <td className="px-3 py-1.5 text-muted sticky left-0 bg-bg border-r border-border/50 truncate max-w-[176px]">
                        {cat.name}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => (
                        <td key={i} className={`px-1 py-1 ${i + 1 === month ? 'bg-accent/5' : ''}`}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data[`${cat.id}_${i + 1}`] || ''}
                            onChange={e => handleChange(cat.id, i + 1, e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-center text-text focus:outline-none focus:bg-surface-2 rounded px-1 py-0.5 placeholder-border"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-center text-text font-medium">
                        {catAnnual(cat).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
