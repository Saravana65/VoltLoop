/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#080808', // primary background
          900: '#121212', // secondary surface
          850: '#181818',
          800: '#202020', // elevated card
          750: '#262626',
          700: '#2A2A2A', // card border
          600: '#383838',
        },
        volt: {
          red: '#F04438',
          'red-dark': '#D92D20',
          orange: '#FF7A00',
          'orange-dark': '#E06A00',
        },
        slate: {
          850: '#0f172a',
          900: '#0b1324',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
