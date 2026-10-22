/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E1A',
          900: '#0A192F',
          800: '#112240',
          700: '#1E3A8A',
          600: '#1D4ED8',
        },
        slate: {
          850: '#151F30',
        },
        chalk: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        institutional: {
          gold: '#C5A059',
          navy: '#0A192F',
          border: '#E2E8F0',
          canvas: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
