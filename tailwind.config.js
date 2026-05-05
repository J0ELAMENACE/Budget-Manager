/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        'var(--c-bg)',
        surface:   'var(--c-surface)',
        'surface-2': 'var(--c-surface2)',
        border:    'var(--c-border)',
        accent:    'var(--c-accent)',
        green:     'var(--c-green)',
        red:       'var(--c-red)',
        orange:    'var(--c-orange)',
        purple:    'var(--c-purple)',
        text:      'var(--c-text)',
        muted:     'var(--c-muted)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
