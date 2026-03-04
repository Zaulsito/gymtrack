/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        border: 'var(--border-color)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        muted: 'var(--muted)',
        'clr-text': 'var(--text)',
        up: 'var(--up)',
        down: 'var(--down)',
        hold: 'var(--hold)',
      },
    },
  },
  plugins: [],
}
