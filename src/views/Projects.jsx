import React, { useEffect, useState, useCallback } from 'react';

const STATUS_LABELS = { etude: '🔍 Étude', recherche: '🔎 Recherche', offre: '📝 Offre', signe: '✅ Signé', abandonne: '❌ Abandonné' };
const STATUS_COLORS = { etude: 'text-muted', recherche: 'text-accent', offre: 'text-orange', signe: 'text-green', abandonne: 'text-red' };
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const fmtRate = (n) => n ? `${parseFloat(n).toFixed(2)}%` : '—';

const EMPTY = {
  name: '', status: 'etude', type: 'appartement', operation: 'achat',
  surface: '', dpe: '', heating: '', price: '', bank: '',
  loan_duration: 20, taeg: '', insurance_rate: 0.36, apport: 0, notes: ''
};

function calcMortgage(price, apport, taegPct, durationYears, insurancePct) {
  const capital = (parseFloat(price) || 0) - (parseFloat(apport) || 0);
  if (capital <= 0 || !taegPct || !durationYears) return null;
  const monthlyRate = (parseFloat(taegPct) / 100) / 12;
  const n = parseInt(durationYears) * 12;
  const insuranceMonthly = (capital * (parseFloat(insurancePct) / 100)) / 12;
  const mensualite = capital * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  const totalInterets = (mensualite * n) - capital;
  const coutAssurance = insuranceMonthly * n;
  const coutTotal = capital + totalInterets + coutAssurance;
  return { capital, mensualite, mensualiteAssurance: mensualite + insuranceMonthly, totalInterets, coutAssurance, coutTotal, n };
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-muted text-xs mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-text text-sm focus:outline-none focus:border-accent";
const selectCls = inputCls;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [rates, setRates] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [projs, rts] = await Promise.all([window.api.getProjects(), window.api.getMortgageRates()]);
    setProjects(projs);
    setRates(rts);
    if (projs.length > 0 && !selected) { setSelected(projs[0]); setForm(projs[0]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectProject = (p) => { setSelected(p); setForm({ ...EMPTY, ...p }); setIsNew(false); };
  const newProject = () => { setForm(EMPTY); setSelected(null); setIsNew(true); };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (isNew) { const id = await window.api.addProject(form); await load(); const updated = await window.api.getProjects(); const p = updated.find(x => x.id === id); if (p) { setSelected(p); setForm(p); setIsNew(false); } }
    else { await window.api.updateProject(selected.id, form); await load(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Supprimer "${selected.name}" ?`)) return;
    await window.api.deleteProject(selected.id);
    setSelected(null); setForm(EMPTY); setIsNew(false);
    load();
  };

  const calc = calcMortgage(form.price, form.apport, form.taeg, form.loan_duration, form.insurance_rate);

  return (
    <div className="flex gap-4 h-full">
      {/* Left: project list */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <button onClick={newProject} className="w-full bg-accent hover:bg-accent/90 text-bg text-xs py-2 rounded font-medium transition-colors">
          + Nouveau projet
        </button>
        <div className="space-y-1 overflow-y-auto flex-1">
          {projects.map(p => (
            <button key={p.id} onClick={() => selectProject(p)}
              className={`w-full text-left px-3 py-2.5 rounded border text-xs transition-colors
                ${selected?.id === p.id ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-text hover:bg-surface-2'}`}>
              <div className="font-medium truncate">{p.name}</div>
              <div className={`text-[10px] mt-0.5 ${STATUS_COLORS[p.status] || 'text-muted'}`}>{STATUS_LABELS[p.status] || p.status}</div>
            </button>
          ))}
          {projects.length === 0 && !isNew && (
            <div className="text-muted text-xs text-center py-6">Aucun projet</div>
          )}
        </div>
      </div>

      {/* Right: detail */}
      {(selected || isNew) ? (
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-text font-semibold">{isNew ? 'Nouveau projet' : form.name}</h2>
            <div className="flex gap-2">
              {!isNew && (
                <button onClick={handleDelete} className="text-xs px-3 py-1.5 rounded bg-red/10 text-red border border-red/30 hover:bg-red/20 transition-colors">
                  Supprimer
                </button>
              )}
              <button onClick={handleSave}
                className={`text-xs px-4 py-1.5 rounded font-medium transition-colors ${saved ? 'bg-green text-bg' : 'bg-accent text-bg hover:bg-accent/90'}`}>
                {saved ? '✓ Sauvegardé' : isNew ? '+ Créer' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Info section */}
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-semibold text-muted uppercase mb-3">Informations générales</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom du projet *">
                <input className={inputCls} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ex: T2 Lyon 3e" />
              </Field>
              <Field label="Statut">
                <select className={selectCls} value={form.status} onChange={e => setField('status', e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Type de bien">
                <select className={selectCls} value={form.type} onChange={e => setField('type', e.target.value)}>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="studio">Studio</option>
                  <option value="terrain">Terrain</option>
                </select>
              </Field>
              <Field label="Opération">
                <select className={selectCls} value={form.operation} onChange={e => setField('operation', e.target.value)}>
                  <option value="achat">Achat</option>
                  <option value="location">Location</option>
                  <option value="investissement">Investissement locatif</option>
                </select>
              </Field>
              <Field label="Surface (m²)">
                <input className={inputCls} type="number" min="0" value={form.surface} onChange={e => setField('surface', e.target.value)} placeholder="0" />
              </Field>
              <Field label="DPE">
                <select className={selectCls} value={form.dpe || ''} onChange={e => setField('dpe', e.target.value)}>
                  <option value="">—</option>
                  {['A','B','C','D','E','F','G'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Chauffage">
                <select className={selectCls} value={form.heating || ''} onChange={e => setField('heating', e.target.value)}>
                  <option value="">—</option>
                  <option value="gaz">Gaz</option>
                  <option value="electrique">Électrique</option>
                  <option value="fioul">Fioul</option>
                  <option value="pompe_chaleur">Pompe à chaleur</option>
                </select>
              </Field>
              <Field label="Prix de vente (€)">
                <input className={inputCls} type="number" min="0" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="0" />
              </Field>
            </div>
          </div>

          {/* Mortgage section */}
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-semibold text-muted uppercase mb-3">Financement</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Banque">
                <input className={inputCls} value={form.bank || ''} onChange={e => setField('bank', e.target.value)} placeholder="Ex: Crédit Agricole" />
              </Field>
              <Field label="Durée (ans)">
                <select className={selectCls} value={form.loan_duration} onChange={e => setField('loan_duration', parseInt(e.target.value))}>
                  <option value={15}>15 ans</option>
                  <option value={20}>20 ans</option>
                  <option value={25}>25 ans</option>
                </select>
              </Field>
              <Field label="Apport (€)">
                <input className={inputCls} type="number" min="0" value={form.apport} onChange={e => setField('apport', e.target.value)} placeholder="0" />
              </Field>
              <Field label="TAEG (%)">
                <div className="flex gap-1">
                  <input className={inputCls} type="number" step="0.01" min="0" max="20" value={form.taeg || ''} onChange={e => setField('taeg', e.target.value)} placeholder="3.66" />
                </div>
              </Field>
              <Field label="Assurance emprunteur (%/an)">
                <input className={inputCls} type="number" step="0.01" min="0" value={form.insurance_rate} onChange={e => setField('insurance_rate', e.target.value)} placeholder="0.36" />
              </Field>
            </div>

            {/* Rate helper */}
            {rates.length > 0 && (
              <div className="bg-surface-2 rounded border border-border p-3 mb-4">
                <p className="text-muted text-xs mb-2">📍 Taux de marché par région ({form.loan_duration} ans)</p>
                <div className="grid grid-cols-3 gap-1">
                  {rates.filter(r => r.duration === parseInt(form.loan_duration)).slice(0, 6).map(r => (
                    <button key={r.id} onClick={() => setField('taeg', r.rate)}
                      className="text-[10px] px-2 py-1 rounded bg-surface border border-border hover:border-accent hover:text-accent transition-colors text-left">
                      <span className="text-muted">{r.region.replace('Île-de-France', 'IDF').split('-')[0]}</span>
                      <span className="text-accent ml-1">{r.rate}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mortgage result */}
            {calc ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Capital emprunté', fmt(calc.capital), 'text-text'],
                  ['Mensualité (hors assurance)', fmt(calc.mensualite), 'text-accent'],
                  ['Mensualité (avec assurance)', fmt(calc.mensualiteAssurance), 'text-orange'],
                  ['Coût total des intérêts', fmt(calc.totalInterets), 'text-red'],
                  ['Coût total assurance', fmt(calc.coutAssurance), 'text-muted'],
                  ['Coût total du crédit', fmt(calc.coutTotal), 'text-purple'],
                ].map(([label, value, cls]) => (
                  <div key={label} className="bg-surface-2 rounded p-3">
                    <div className="text-muted text-[10px] mb-1">{label}</div>
                    <div className={`font-bold text-sm ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-xs text-center py-4">Renseigne le prix, le TAEG et la durée pour voir le calcul</div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-semibold text-muted uppercase mb-3">Notes</h3>
            <textarea className={`${inputCls} resize-none`} rows={4} value={form.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="Observations, points à vérifier..." />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          Sélectionne un projet ou crée-en un nouveau
        </div>
      )}
    </div>
  );
}
