/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        paper2: 'var(--color-paper2)',
        ink: 'var(--color-ink)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark: 'var(--color-brand-dark)',
          mid: 'var(--color-brand-mid)'
        },
        mint: {
          DEFAULT: 'var(--color-mint)',
          border: 'var(--color-mint-border)'
        },
        terra: {
          DEFAULT: 'var(--color-terra)',
          dark: 'var(--color-terra-dark)'
        },
        peach: {
          DEFAULT: 'var(--color-peach)',
          border: 'var(--color-peach-border)'
        },
        amber: {
          DEFAULT: 'var(--color-amber)'
        },
        cream: 'var(--color-cream)',
      },
      fontFamily: {
        // Fraunces has real warmth at display sizes - a kinder headline face
        // than the usual AI-default serif, self-hosted so it's PWA-cached.
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['Public Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px' },
      boxShadow: { card: '0 12px 40px -12px rgba(42, 51, 45, 0.08)' },
    },
  },
  plugins: [],
};
