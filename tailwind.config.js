/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // straight from the pitch deck, so the product matches the pitch
        paper: '#FCFBF7',
        paper2: '#F1ECE0',
        ink: '#2A332D',
        body: '#4C534C',
        muted: '#7A7E74',
        line: '#E5DECF',
        brand: { DEFAULT: '#1B6B54', dark: '#0E3A2E', mid: '#155845' },
        mint: { DEFAULT: '#E6EFE8', border: '#CFE0D5' },
        terra: { DEFAULT: '#C56A45', dark: '#A9502E' },
        peach: { DEFAULT: '#FBEFE9', border: '#EAD3C7' },
        amber: { DEFAULT: '#B98328' },
        cream: '#F3EDE1',
      },
      fontFamily: {
        // Fraunces has real warmth at display sizes - a kinder headline face
        // than the usual AI-default serif, self-hosted so it's PWA-cached.
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['Public Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '10px' },
      boxShadow: { card: '0 3px 8px rgba(110,102,86,0.14)' },
    },
  },
  plugins: [],
};
