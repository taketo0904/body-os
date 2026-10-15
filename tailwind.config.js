/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        card: '#111113',
        card2: '#1a1a1d',
        line: '#2a2a2e',
        sub: '#8e8e93',
        accent: '#c6ff3d',
        pro: '#ff4d6d',
        fat: '#ffb340',
        carb: '#4cc9f0',
        kcal: '#c6ff3d',
        ok: '#30d158',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Hiragino Sans"', '"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
