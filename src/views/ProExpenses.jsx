import React, { useEffect, useState, useCallback } from 'react';

const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
const today = () => new Date().toISOString().split('T')[0];

const STATUS = {
  en_attente: { label: 'En attente', color: 'var(--c-orange)', bg: 'color-mix(in srgb,var(--c-orange) 12%,transparent)', border: 'color-mix(in srgb,var(--c-orange) 30%,transparent)', icon: '⏳' },
  rembourse:  { label: 'Remboursé',  color: 'var(--c-green)',  bg: 'color-mix(in srgb,var(--c-green) 12%,transparent)',  border: 'color-mix(in srgb,var(--c-green) 30%,transparent)',  icon: '✅' },
};

const PRO_CATEGORIES = [
  'Transport', 'Hôtel', 'Restaurant / Repas', 'Fournitures bureau',
  'Formation', 'Téléphone', 'Logiciel / Abonnement', 'Déplacement',
  'Client / Commercial', 'Autre',
];

const EMPTY = {
  date: today(), category: 'Transport', amount: '', detail: '',
  justificatif: '', status: 'en_attente', notes: '',
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className={`rounded-xl p-6 mx-4 shadow-2xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'}`}
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>{title}</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-muted)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.en_attente;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.icon} {s.label}
    </span>
  );
}

function ProForm({ form, setForm, onSubmit, onCancel, submitLabel }) {
  const inp = { background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text)' };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Date *</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full rounded px-3 py-2 text-sm focus:outline-none" style={inp} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Montant (€) *</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full rounded px-3 py-2 text-sm focus:outline-none" style={inp} />
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Catégorie *</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full rounded px-3 py-2 text-sm focus:outline-none" style={inp}>
          {PRO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Description *</label>
        <input type="text" placeholder="ex: Taxi client, Repas équipe..." value={form.detail}
          onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
          className="w-full rounded px-3 py-2 text-sm focus:outline-none" style={inp} />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>N° justificatif / référence</label>
        <input type="text" placeholder="ex: FACT-2025-042" value={form.justificatif}
          onChange={e => setForm(f => ({ ...f, justificatif: e.target.value }))}
          className="w-full rounded px-3 py-2 text-sm focus:outline-none" style={inp} />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Notes</label>
        <textarea rows={2} placeholder="Contexte, mission, projet concerné..." value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full rounded px-3 py-2 text-sm focus:outline-none resize-none" style={inp} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 rounded text-sm transition-colors"
          style={{ background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>Annuler</button>
        <button onClick={onSubmit} disabled={!form.date || !form.amount || !form.detail}
          className="flex-1 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40"
          style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>{submitLabel}</button>
      </div>
    </div>
  );
}

function ReimburseModal({ expense, onClose, onDone }) {
  const [date, setDate] = useState(today());
  const [createTx, setCreateTx] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await window.api.reimburseProExpense(expense.id, date, createTx);
    setLoading(false);
    onDone();
  };

  return (
    <Modal title="Marquer comme remboursé" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg p-3" style={{ background: 'var(--c-surface2)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--c-text)' }}>{expense.detail}</div>
          <div className="text-sm font-bold" style={{ color: 'var(--c-green)' }}>{fmt(expense.amount)}</div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Date de remboursement</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded px-3 py-2 text-sm focus:outline-none"
            style={{ background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg p-3 transition-colors"
          style={{ background: createTx ? 'color-mix(in srgb,var(--c-green) 8%,transparent)' : 'var(--c-surface2)', border: `1px solid ${createTx ? 'color-mix(in srgb,var(--c-green) 25%,transparent)' : 'var(--c-border)'}` }}>
          <input type="checkbox" checked={createTx} onChange={e => setCreateTx(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--c-green)]" />
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--c-text)' }}>Créer une transaction de remboursement</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
              Ajoute automatiquement {fmt(expense.amount)} dans vos revenus du mois concerné.
            </div>
          </div>
        </label>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded text-sm"
            style={{ background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>Annuler</button>
          <button onClick={handleConfirm} disabled={loading || !date}
            className="flex-1 py-2 rounded text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--c-green)', color: '#fff' }}>
            {loading ? '⏳ ...' : '✅ Confirmer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProExpenses({ year, month, onRefresh }) {
  const [expenses, setExpenses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [reimburseTarget, setReimburseTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    const exps = await window.api.getProExpenses({ year, status: filterStatus || undefined });
    setExpenses(exps);
  }, [year, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({ ...EMPTY, date: `${year}-${String(month).padStart(2, '0')}-01` });
    setEditExp(null); setShowModal(true);
  };
  const openEdit = (e) => {
    setForm({ date: e.date, category: e.category, amount: e.amount, detail: e.detail || '', justificatif: e.justificatif || '', status: e.status, notes: e.notes || '' });
    setEditExp(e); setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editExp) await window.api.updateProExpense(editExp.id, payload);
    else await window.api.addProExpense(payload);
    setShowModal(false); load(); onRefresh?.();
  };

  const handleDelete = async () => {
    await window.api.deleteProExpense(deleteId);
    setDeleteId(null); load(); onRefresh?.();
  };

  const handleReimburse = () => {
    load(); onRefresh?.(); setReimburseTarget(null);
  };

  // Summary
  const total = { en_attente: 0, rembourse: 0 };
  const count = { en_attente: 0, rembourse: 0 };
  for (const e of expenses) {
    if (total[e.status] !== undefined) {
      total[e.status] += e.amount;
      count[e.status]++;
    }
  }

  const filtered = filterStatus ? expenses.filter(e => e.status === filterStatus) : expenses;
  const cardStyle = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl p-4 text-xs"
        style={{ background: 'color-mix(in srgb,var(--c-accent) 8%,transparent)', border: '1px solid color-mix(in srgb,var(--c-accent) 20%,transparent)' }}>
        <span className="text-base mt-0.5">💼</span>
        <div style={{ color: 'var(--c-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--c-text)' }}>Dépenses professionnelles avancées</span>
          {' '}— Ces dépenses sont <strong style={{ color: 'var(--c-accent)' }}>hors calcul du budget mensuel</strong> tant qu'elles sont en attente.
          Une fois remboursées, tu peux générer une transaction revenus automatiquement.
        </div>
      </div>

      {/* KPI row — 2 statuts seulement */}
      <div className="grid grid-cols-2 gap-3">
        {[{ key: 'en_attente', label: 'En attente de remboursement' }, { key: 'rembourse', label: 'Remboursé' }].map(({ key, label }) => {
          const s = STATUS[key];
          return (
            <div key={key} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{fmt(total[key] || 0)}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>{count[key] || 0} dépense{(count[key] || 0) > 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {/* Actions + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium"
          style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}>
          + Nouvelle dépense pro
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Statut :</span>
          {[{ id: '', label: 'Tout' }, { id: 'en_attente', label: '⏳ En attente' }, { id: 'rembourse', label: '✅ Remboursé' }].map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              className="text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: filterStatus === f.id ? 'var(--c-accent)' : 'var(--c-surface2)',
                color: filterStatus === f.id ? 'var(--c-bg)' : 'var(--c-muted)',
                border: '1px solid var(--c-border)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--c-surface2)', borderBottom: '1px solid var(--c-border)' }}>
              {['Date', 'Catégorie', 'Description', 'Justificatif', 'Montant', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--c-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--c-muted)' }}>
                Aucune dépense pro{filterStatus ? ` avec ce statut` : ''}
              </td></tr>
            )}
            {filtered.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid color-mix(in srgb,var(--c-border) 50%,transparent)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-4 py-3 font-mono" style={{ color: 'var(--c-muted)' }}>{exp.date}</td>
                <td className="px-4 py-3" style={{ color: 'var(--c-text)' }}>{exp.category}</td>
                <td className="px-4 py-3 max-w-[180px]" style={{ color: 'var(--c-text)' }}>
                  <div className="truncate">{exp.detail}</div>
                  {exp.notes && <div className="truncate text-[10px] mt-0.5" style={{ color: 'var(--c-muted)' }}>{exp.notes}</div>}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--c-muted)' }}>
                  {exp.justificatif || <span style={{ color: 'var(--c-border)' }}>—</span>}
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: exp.status === 'rembourse' ? 'var(--c-green)' : 'var(--c-orange)' }}>
                  {fmt(exp.amount)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(exp)} title="Modifier"
                      className="p-1 rounded" style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>✏️</button>
                    {exp.status === 'en_attente' && (
                      <button onClick={() => setReimburseTarget(exp)} title="Marquer remboursé"
                        className="p-1 rounded" style={{ color: 'var(--c-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--c-green)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>✅</button>
                    )}
                    <button onClick={() => setDeleteId(exp.id)} title="Supprimer"
                      className="p-1 rounded" style={{ color: 'var(--c-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--c-red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 text-xs"
            style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-surface2)' }}>
            <span style={{ color: 'var(--c-muted)' }}>{filtered.length} dépense{filtered.length > 1 ? 's' : ''}</span>
            <span className="font-bold" style={{ color: 'var(--c-text)' }}>
              Total : {fmt(filtered.reduce((a, e) => a + e.amount, 0))}
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editExp ? 'Modifier la dépense pro' : 'Nouvelle dépense professionnelle'} onClose={() => setShowModal(false)} wide>
          <ProForm form={form} setForm={setForm}
            onSubmit={handleSubmit} onCancel={() => setShowModal(false)}
            submitLabel={editExp ? 'Modifier' : 'Ajouter'} />
        </Modal>
      )}

      {reimburseTarget && (
        <ReimburseModal expense={reimburseTarget} onClose={() => setReimburseTarget(null)} onDone={handleReimburse} />
      )}

      {deleteId && (
        <Modal title="Supprimer cette dépense pro ?" onClose={() => setDeleteId(null)}>
          <p className="text-sm mb-5" style={{ color: 'var(--c-muted)' }}>Cette action est irréversible.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded text-sm"
              style={{ background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>Annuler</button>
            <button onClick={handleDelete} className="flex-1 py-2 rounded text-sm font-medium"
              style={{ background: 'color-mix(in srgb,var(--c-red) 20%,transparent)', color: 'var(--c-red)', border: '1px solid color-mix(in srgb,var(--c-red) 30%,transparent)' }}>
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
