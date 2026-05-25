/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        brand: {
          orange:        '#f97316',
          'orange-dark': '#ea580c',
          pink:          '#ec4899',
          teal:          '#14b8a6',
          purple:        '#8b5cf6',
          navy:          '#0f172a',
          'navy-light':  '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'navbar-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)',
        'hero-gradient':   'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0369a1 100%)',
        'cta-gradient':    'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        'btn-gradient':    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(249,115,22,0.35)',
        'glow-blue':   '0 0 20px rgba(37,99,235,0.35)',
        'card':        '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.14)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(-8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.18s ease-out both',
        'slide-up': 'slide-up 0.25s ease-out both',
        'shimmer':  'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width':    'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.glass': {
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'background': 'rgba(255,255,255,0.08)',
          'border': '1px solid rgba(255,255,255,0.12)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      })
    },
  ],
}
