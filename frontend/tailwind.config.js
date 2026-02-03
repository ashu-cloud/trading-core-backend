/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        'bg-main': '#0f1724', // bg-slate-950 equivalent
        'panel': '#0f1724',
        'card': '#111827', // bg-slate-900
        'border-slab': '#1f2937', // bg-slate-800
        'accent': '#4f46e5', // indigo
        'buy': '#10b981', // emerald
        'sell': '#fb7185', // rose
        'pending': '#f59e0b'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: [],
}
