/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Courier New', 'monospace'],
      },
      /* Mirrors the CSS custom properties in globals.css so utilities
         follow the active theme. */
      colors: {
        bg: {
          base: 'var(--color-bg)',
          2: 'var(--color-surface)',
          3: 'var(--color-surface-2)',
          4: 'var(--bg4)',
          5: 'var(--color-surface-hover)',
        },
        border: {
          1: 'var(--color-border-subtle)',
          2: 'var(--color-border)',
          3: 'var(--b3)',
        },
        text: {
          1: 'var(--color-text)',
          2: 'var(--t2)',
          3: 'var(--color-muted)',
          4: 'var(--color-muted-2)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          text: 'var(--color-accent-text)',
          bg: 'var(--color-accent-dim)',
          border: 'var(--color-accent-border)',
        },
        navy: {
          DEFAULT: '#0F1A2C',
          deep: '#0A1220',
          raised: '#15233A',
        },
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '20px',
      },
      transitionTimingFunction: {
        precision: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
