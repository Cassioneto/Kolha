/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tomate: '#e63946',
        folha: '#2a9d8f',
        areia: '#f4f1de',
        terra: '#8b4513',
        sol: '#f4a261',
        pimenta: '#9b2226',
        noite: '#264653',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
