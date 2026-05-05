import React, { useEffect, useState, useCallback } from 'react';
import ProExpenses from './ProExpenses';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const TYPE_LABELS = { revenus:'💰 Revenus', depenses:'💸 Dépenses', epargne:'🏦 Épargne', projet:'🏠 Projets' };
const TYPE_COLORS = { revenus:'text-green bg-green/10', depenses:'text-red bg-red/10', epargne:'text-accent bg-accent/10', projet:'text-purple bg-purple/10' };
const TYPE_SIGN  = { revenus:'+', depenses:'-', epargne:'-', projet:'-' };
const fmt = (n) => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0);
const today = () => new Date().toISOString().split('T')[0];
const EMPTY_FORM = { date:today(), value_date:'', type:'depenses', category_id:'', amount:'', detail:'' };

/* ── shared modal ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.6)'}} onClick={onClose}>
      <div className="rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" style={{background:'var(--c-surface)',border:'1px solid var(--c-border)'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-sm" style={{color:'var(--c-text)'}}>{title}</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{color:'var(--c-muted)'}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── transaction form ── */
function TransactionForm({ form, setForm, categories, onSubmit, onCancel, submitLabel }) {
  const cats = categories.filter(c=>c.type===form.type);
  const inp = "w-full rounded px-3 py-2 text-sm focus:outline-none";
  const inpStyle = {background:'var(--c-surface2)',border:'1px solid var(--c-border)',color:'var(--c-text)'};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Date *</label>
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className={inp} style={inpStyle}/>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Date de valeur</label>
          <input type="date" value={form.value_date} onChange={e=>setForm(f=>({...f,value_date:e.target.value}))} className={inp} style={inpStyle}/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Type *</label>
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value,category_id:''}))} className={inp} style={inpStyle}>
            <option value="revenus">💰 Revenus</option>
            <option value="depenses">💸 Dépenses</option>
            <option value="epargne">🏦 Épargne</option>
            <option value="projet">🏠 Projets</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Catégorie</label>
          <select value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))} className={inp} style={inpStyle}>
            <option value="">— Sans catégorie —</option>
            {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Montant (€) *</label>
        <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className={inp} style={inpStyle}/>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{color:'var(--c-muted)'}}>Détail</label>
        <input type="text" placeholder="Description optionnelle" value={form.detail} onChange={e=>setForm(f=>({...f,detail:e.target.value}))} className={inp} style={inpStyle}/>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded text-sm transition-colors" style={{background:'var(--c-surface2)',color:'var(--c-muted)'}}>Annuler</button>
        <button onClick={onSubmit} disabled={!form.date||!form.amount} className="flex-1 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40" style={{background:'var(--c-accent)',color:'var(--c-bg)'}}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── main component ── */
export default function BudgetTracking({ year, month }) {
  const [activeTab, setActiveTab] = useState('courantes');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [filterType, setFilterType]   = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editTx, setEditTx]           = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]       = useState(null);
  const [proSummary, setProSummary]   = useState([]);

  const load = useCallback(async () => {
    const [txs, cats, proSum] = await Promise.all([
      window.api.getTransactions({ year, month, type: filterType || undefined }),
      window.api.getCategories(),
      window.api.getProExpenseSummary(),
    ]);
    setTransactions(txs);
    setCategories(cats);
    setProSummary(proSum);
  }, [year, month, filterType]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({...EMPTY_FORM, date:`${year}-${String(month).padStart(2,'0')}-01`});
    setEditTx(null); setShowModal(true);
  };
  const openEdit = (tx) => {
    setForm({ date:tx.date, value_date:tx.value_date||'', type:tx.type, category_id:tx.category_id||'', amount:tx.amount, detail:tx.detail||'' });
    setEditTx(tx); setShowModal(true);
  };
  const handleSubmit = async () => {
    const payload = {...form, amount:parseFloat(form.amount), category_id:form.category_id||null};
    if (editTx) await window.api.updateTransaction(editTx.id, payload);
    else await window.api.addTransaction(payload);
    setShowModal(false); load();
  };
  const handleDelete = async () => {
    await window.api.deleteTransaction(deleteId);
    setDeleteId(null); load();
  };

  // Summary (courantes only, excludes pro en_attente)
  const summary = { revenus:0, depenses:0, epargne:0, projet:0 };
  for (const tx of transactions) summary[tx.type] = (summary[tx.type]||0) + tx.amount;

  // Pro badge count
  const proEnAttente = proSummary.find(s=>s.status==='en_attente');
  const proCount = proEnAttente?.count || 0;
  const proTotal = proEnAttente?.total || 0;

  const tabs = [
    { id:'courantes', label:'Dépenses courantes' },
    { id:'pro', label:'Dépenses pro', badge: proCount > 0 ? proCount : null },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm" style={{color:'var(--c-text)'}}>
          Transactions — {MONTHS_FR[month-1]} {year}
        </h2>
        {activeTab === 'courantes' && (
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded font-medium transition-colors" style={{background:'var(--c-accent)',color:'var(--c-bg)'}}>
            + Ajouter
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:'var(--c-surface)',border:'1px solid var(--c-border)'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab===t.id ? 'var(--c-accent)' : 'transparent',
              color: activeTab===t.id ? 'var(--c-bg)' : 'var(--c-muted)',
            }}>
            {t.label}
            {t.badge && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{background: activeTab===t.id ? 'rgba(255,255,255,0.25)' : 'var(--c-orange)', color: activeTab===t.id ? 'var(--c-bg)' : '#fff'}}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Courantes tab ─────────────────────────────────────── */}
      {activeTab === 'courantes' && (
        <>
          {/* Pro en attente notice */}
          {proCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs" style={{background:'color-mix(in srgb,var(--c-orange) 10%,transparent)',border:'1px solid color-mix(in srgb,var(--c-orange) 30%,transparent)',color:'var(--c-orange)'}}>
              <span>⚠️</span>
              <span>
                <strong>{proCount} dépense{proCount>1?'s':''} pro</strong> en attente de remboursement
                ({new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(proTotal)}) — non comptées dans ce total.
              </span>
              <button onClick={()=>setActiveTab('pro')} className="ml-auto underline font-medium" style={{color:'var(--c-orange)'}}>
                Voir →
              </button>
            </div>
          )}

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(summary).map(([type, total]) => (
              <div key={type} className="rounded-lg border px-4 py-3 flex items-center justify-between" style={{background:'var(--c-surface)',borderColor:'var(--c-border)'}}>
                <span className="text-xs" style={{color:'var(--c-muted)'}}>{TYPE_LABELS[type]}</span>
                <span className="font-bold text-sm" style={{color:type==='revenus'?'var(--c-green)':type==='depenses'?'var(--c-red)':type==='epargne'?'var(--c-accent)':'var(--c-purple)'}}>
                  {TYPE_SIGN[type]}{fmt(total)}
                </span>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{color:'var(--c-muted)'}}>Filtrer :</span>
            {['','revenus','depenses','epargne','projet'].map(t=>(
              <button key={t} onClick={()=>setFilterType(t)}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  background: filterType===t ? 'var(--c-accent)' : 'var(--c-surface2)',
                  color: filterType===t ? 'var(--c-bg)' : 'var(--c-muted)',
                  border: '1px solid var(--c-border)',
                }}>
                {t ? TYPE_LABELS[t] : 'Tout'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg overflow-hidden" style={{background:'var(--c-surface)',border:'1px solid var(--c-border)'}}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{background:'var(--c-surface2)',borderBottom:'1px solid var(--c-border)'}}>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'var(--c-muted)'}}>Date</th>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'var(--c-muted)'}}>Type</th>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'var(--c-muted)'}}>Catégorie</th>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'var(--c-muted)'}}>Détail</th>
                  <th className="text-right px-4 py-3 font-medium" style={{color:'var(--c-muted)'}}>Montant</th>
                  <th className="px-4 py-3 font-medium w-20 text-center" style={{color:'var(--c-muted)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length===0 && (
                  <tr><td colSpan={6} className="text-center py-12" style={{color:'var(--c-muted)'}}>Aucune transaction ce mois</td></tr>
                )}
                {transactions.map(tx=>(
                  <tr key={tx.id} className="transition-colors" style={{borderBottom:'1px solid color-mix(in srgb,var(--c-border) 50%,transparent)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--c-surface2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td className="px-4 py-2.5 font-mono" style={{color:'var(--c-muted)'}}>{tx.date}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[tx.type]||''}`}>{tx.type}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{color:'var(--c-text)'}}>{tx.category_name||<span style={{color:'var(--c-muted)'}}>—</span>}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate" style={{color:'var(--c-muted)'}}>{tx.detail||'—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold" style={{color:tx.type==='revenus'?'var(--c-green)':'var(--c-red)'}}>
                      {TYPE_SIGN[tx.type]}{fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={()=>openEdit(tx)} className="p-1 rounded" style={{color:'var(--c-muted)'}}
                          onMouseEnter={e=>e.currentTarget.style.color='var(--c-accent)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--c-muted)'}>✏️</button>
                        <button onClick={()=>setDeleteId(tx.id)} className="p-1 rounded" style={{color:'var(--c-muted)'}}
                          onMouseEnter={e=>e.currentTarget.style.color='var(--c-red)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--c-muted)'}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Pro tab ────────────────────────────────────────────── */}
      {activeTab === 'pro' && (
        <ProExpenses year={year} month={month} onRefresh={load} />
      )}

      {/* Modals */}
      {showModal && (
        <Modal title={editTx?'Modifier la transaction':'Nouvelle transaction'} onClose={()=>setShowModal(false)}>
          <TransactionForm form={form} setForm={setForm} categories={categories}
            onSubmit={handleSubmit} onCancel={()=>setShowModal(false)} submitLabel={editTx?'Modifier':'Ajouter'}/>
        </Modal>
      )}
      {deleteId && (
        <Modal title="Confirmer la suppression" onClose={()=>setDeleteId(null)}>
          <p className="text-sm mb-5" style={{color:'var(--c-muted)'}}>Cette action est irréversible. Supprimer la transaction ?</p>
          <div className="flex gap-2">
            <button onClick={()=>setDeleteId(null)} className="flex-1 py-2 rounded text-sm transition-colors" style={{background:'var(--c-surface2)',color:'var(--c-muted)'}}>Annuler</button>
            <button onClick={handleDelete} className="flex-1 py-2 rounded text-sm transition-colors" style={{background:'color-mix(in srgb,var(--c-red) 20%,transparent)',color:'var(--c-red)',border:'1px solid color-mix(in srgb,var(--c-red) 30%,transparent)'}}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
