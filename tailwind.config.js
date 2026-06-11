/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce7fd',
          200: '#c0d4fc',
          300: '#94b8fa',
          400: '#6191f5',
          500: '#3d6bef',
          600: '#274ce4',
          700: '#1f3ad1',
          800: '#2031a9',
          900: '#1f2e85',
        },
      },
    },
  },
  plugins: [],
}
