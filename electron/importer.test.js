import { describe, it, expect } from 'vitest'

// Copie des fonctions pures extraites de importer.js pour les tester sans Electron
const TYPE_MAP = {
  'revenus': 'revenus', 'revenu': 'revenus', 'income': 'revenus', 'salaire': 'revenus',
  'depenses': 'depenses', 'dépenses': 'depenses', 'dépense': 'depenses', 'expense': 'depenses', 'charges': 'depenses',
  'epargne': 'epargne', 'épargne': 'epargne', 'saving': 'epargne', 'savings': 'epargne',
  'projet': 'projet', 'project': 'projet',
}

function normalizeType(raw) {
  if (!raw) return 'depenses'
  const s = String(raw).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return TYPE_MAP[s] || 'depenses'
}

function parseDate(raw) {
  if (!raw) return null
  if (raw instanceof Date) {
    const d = raw
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const s = String(raw).trim()
  const fr = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return null
}

function detectColumns(header) {
  const map = {}
  header.forEach((cell, i) => {
    const val = (cell?.text || String(cell || '')).toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (/^date/.test(val) && !map.date) map.date = i
    if (/valeur|value/.test(val)) map.value_date = i
    if (/type|nature/.test(val)) map.type = i
    if (/categ|categ/.test(val)) map.category = i
    if (/montant|amount|somme/.test(val)) map.amount = i
    if (/detail|detail|libelle|libelle|descr/.test(val)) map.detail = i
  })
  return map
}

function fmt(n) {
  return n ? n.toFixed(2) : '0.00'
}

// ── normalizeType ─────────────────────────────────────────────────────────────

describe('normalizeType', () => {
  it('retourne depenses par défaut si null', () => {
    expect(normalizeType(null)).toBe('depenses')
  })

  it('retourne depenses par défaut si undefined', () => {
    expect(normalizeType(undefined)).toBe('depenses')
  })

  it('reconnaît revenus', () => {
    expect(normalizeType('revenus')).toBe('revenus')
    expect(normalizeType('revenu')).toBe('revenus')
    expect(normalizeType('income')).toBe('revenus')
    expect(normalizeType('salaire')).toBe('revenus')
  })

  it('reconnaît depenses avec accents', () => {
    expect(normalizeType('dépenses')).toBe('depenses')
    expect(normalizeType('dépense')).toBe('depenses')
    expect(normalizeType('expense')).toBe('depenses')
    expect(normalizeType('charges')).toBe('depenses')
  })

  it('reconnaît epargne avec accents', () => {
    expect(normalizeType('épargne')).toBe('epargne')
    expect(normalizeType('saving')).toBe('epargne')
    expect(normalizeType('savings')).toBe('epargne')
  })

  it('reconnaît projet', () => {
    expect(normalizeType('projet')).toBe('projet')
    expect(normalizeType('project')).toBe('projet')
  })

  it('est insensible à la casse', () => {
    expect(normalizeType('REVENUS')).toBe('revenus')
    expect(normalizeType('Depenses')).toBe('depenses')
  })

  it('retourne depenses pour valeur inconnue', () => {
    expect(normalizeType('inconnu')).toBe('depenses')
  })
})

// ── parseDate ─────────────────────────────────────────────────────────────────

describe('parseDate', () => {
  it('retourne null si vide', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate('')).toBeNull()
  })

  it('parse le format français DD/MM/YYYY', () => {
    expect(parseDate('15/06/2025')).toBe('2025-06-15')
    expect(parseDate('01/01/2024')).toBe('2024-01-01')
  })

  it('parse le format ISO YYYY-MM-DD', () => {
    expect(parseDate('2025-06-15')).toBe('2025-06-15')
  })

  it('parse un objet Date', () => {
    expect(parseDate(new Date('2025-06-15T12:00:00Z'))).toMatch(/^2025-06-1[45]$/)
  })

  it('retourne null pour un format non reconnu', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })
})

// ── detectColumns ─────────────────────────────────────────────────────────────

describe('detectColumns', () => {
  it('détecte les colonnes standards', () => {
    const header = ['Date', 'Type', 'Categorie', 'Montant', 'Detail']
    const map = detectColumns(header)
    expect(map.date).toBe(0)
    expect(map.type).toBe(1)
    expect(map.category).toBe(2)
    expect(map.amount).toBe(3)
    expect(map.detail).toBe(4)
  })

  it('détecte les colonnes en anglais', () => {
    const header = ['Date', 'Amount', 'Description']
    const map = detectColumns(header)
    expect(map.date).toBe(0)
    expect(map.amount).toBe(1)
    expect(map.detail).toBe(2)
  })

  it('retourne un objet vide si aucune colonne reconnue', () => {
    const map = detectColumns(['Col1', 'Col2'])
    expect(Object.keys(map).length).toBe(0)
  })
})

// ── fmt ───────────────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('formate un nombre avec 2 décimales', () => {
    expect(fmt(1234.5)).toBe('1234.50')
    expect(fmt(0.1)).toBe('0.10')
  })

  it('retourne 0.00 pour falsy', () => {
    expect(fmt(0)).toBe('0.00')
    expect(fmt(null)).toBe('0.00')
    expect(fmt(undefined)).toBe('0.00')
  })
})
