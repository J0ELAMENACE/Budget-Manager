import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThreeDotMenu({ year, month, onImportDone }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const ref = useRef();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async () => {
    setOpen(false);
    const result = await window.api.showSaveDialog({
      title: 'Exporter en Excel',
      defaultPath: `budget_${year}_${String(month).padStart(2, '0')}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (!result.canceled && result.filePath) {
      await window.api.exportExcel({ year, month, filePath: result.filePath });
    }
  };

  const handleExportAll = async () => {
    setOpen(false);
    const result = await window.api.showSaveDialog({
      title: 'Exporter toute l\'année',
      defaultPath: `budget_${year}_complet.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (!result.canceled && result.filePath) {
      await window.api.exportExcel({ year, month: null, filePath: result.filePath });
    }
  };

  const handleImport = async () => {
    setOpen(false);
    setImporting(true);
    try {
      const result = await window.api.showOpenDialog({
        title: 'Importer un fichier Excel',
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile'],
      });
      if (!result.canceled && result.filePaths?.[0]) {
        const res = await window.api.importExcel(result.filePaths[0]);
        if (res.success) {
          alert(`✅ Import réussi !\n${res.imported} transactions importées.`);
          onImportDone?.();
        } else {
          alert(`⚠️ Erreur d'import :\n${res.error}`);
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const items = [
    { icon: '📥', label: 'Importer Excel', action: handleImport, divider: false },
    { icon: '📤', label: 'Exporter le mois', action: handleExport, divider: false },
    { icon: '📦', label: "Exporter l'année complète", action: handleExportAll, divider: true },
    {
      icon: theme === 'dark' ? '☀️' : '🌙',
      label: theme === 'dark' ? 'Mode clair' : 'Mode sombre',
      action: () => { toggle(); setOpen(false); },
      divider: false,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={importing}
        className="w-8 h-8 flex items-center justify-center rounded text-muted hover:text-text hover:bg-surface-2 transition-colors text-lg leading-none"
        title="Menu"
      >
        {importing ? <span className="text-xs animate-spin">⏳</span> : '⋮'}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[220px] bg-surface border border-border rounded-xl shadow-2xl py-1.5 overflow-hidden">
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {item.divider && <div className="my-1 border-t border-border" />}
              <button
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface-2 transition-colors text-left"
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
