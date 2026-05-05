import React, { useEffect, useState } from 'react';

const TYPE_LABELS = { revenus: '💰 Revenus', depenses: '💸 Dépenses', epargne: '🏦 Épargne', projet: '🏠 Projets' };
const TYPE_COLORS = { revenus: 'text-green', depenses: 'text-red', epargne: 'text-accent', projet: 'text-purple' };

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('depenses');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const [s, c] = await Promise.all([window.api.getSettings(), window.api.getCategories()]);
    setSettings(s);
    setCategories(c);
  };

  useEffect(() => { load(); }, []);

  const setSetting = async (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
    await window.api.setSetting(key, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleAddCat = async () => {
    if (!newCatName.trim()) return;
    await window.api.addCategory(newCatName.trim(), newCatType);
    setNewCatName('');
    load();
  };

  const handleDeleteCat = async (id) => {
    await window.api.deleteCategory(id);
    load();
  };

  const grouped = {};
  for (const c of categories) {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push(c);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-text font-semibold">Paramètres</h2>
        {saved && <span className="text-green text-xs">✓ Sauvegardé</span>}
      </div>

      {/* General settings */}
      <div className="bg-surface rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Général</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text text-sm">Année de démarrage</p>
              <p className="text-muted text-xs mt-0.5">Première année suivie dans l'application</p>
            </div>
            <select value={settings.start_year || '2025'} onChange={e => setSetting('start_year', e.target.value)}
              className="bg-surface-2 border border-border rounded px-3 py-1.5 text-text text-sm focus:outline-none focus:border-accent">
              {Array.from({ length: 6 }, (_, i) => 2022 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-text text-sm">Méthode de calcul du taux d'épargne</p>
              <p className="text-muted text-xs mt-0.5">Base de calcul du pourcentage d'épargne</p>
            </div>
            <select value={settings.savings_method || 'net'} onChange={e => setSetting('savings_method', e.target.value)}
              className="bg-surface-2 border border-border rounded px-3 py-1.5 text-text text-sm focus:outline-none focus:border-accent">
              <option value="net">Sur revenu net</option>
              <option value="gross">Sur revenu brut</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-surface rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4">Catégories</h3>

        {/* Add form */}
        <div className="flex gap-2 mb-5">
          <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Nom de la catégorie" onKeyDown={e => e.key === 'Enter' && handleAddCat()}
            className="flex-1 bg-surface-2 border border-border rounded px-3 py-1.5 text-text text-sm focus:outline-none focus:border-accent" />
          <select value={newCatType} onChange={e => setNewCatType(e.target.value)}
            className="bg-surface-2 border border-border rounded px-3 py-1.5 text-text text-sm focus:outline-none focus:border-accent">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleAddCat} disabled={!newCatName.trim()}
            className="bg-accent text-bg px-4 py-1.5 rounded text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40">
            + Ajouter
          </button>
        </div>

        {/* List */}
        {['revenus', 'depenses', 'epargne', 'projet'].map(type => (
          grouped[type]?.length > 0 && (
            <div key={type} className="mb-4">
              <h4 className={`text-xs font-semibold mb-2 ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</h4>
              <div className="space-y-1">
                {grouped[type].map(cat => (
                  <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded border border-border/50">
                    <span className="text-text text-sm">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      {cat.is_default ? (
                        <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">par défaut</span>
                      ) : (
                        <button onClick={() => handleDeleteCat(cat.id)} className="text-muted hover:text-red transition-colors text-xs">🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* About */}
      <div className="bg-surface rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-3">À propos</h3>
        <div className="space-y-1 text-xs text-muted">
          <p>Budget Manager v1.0.0</p>
          <p>Stack : Electron + React 18 + Tailwind CSS + SQLite</p>
          <p>Données stockées localement dans le dossier utilisateur</p>
        </div>
      </div>
    </div>
  );
}
