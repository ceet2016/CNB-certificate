/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cnb: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          gold: '#C18F2E',
          goldlight: '#E8C766',
          golddark: '#8B6914',
          dark: '#1A1749',
          darker: '#13102F',
        },
        // Warm neutral palette - no pure white
        cream: {
          50: '#FAF9F7',
          100: '#F5F3EF',
          200: '#EDEAE3',
          300: '#E0DCD2',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px -1px rgba(26, 23, 73, 0.06), 0 4px 20px -6px rgba(26, 23, 73, 0.08)',
        'card-hover': '0 4px 12px -2px rgba(26, 23, 73, 0.1), 0 12px 40px -8px rgba(26, 23, 73, 0.12)',
        'glow': '0 0 32px -6px rgba(79, 70, 229, 0.25)',
        'gold-glow': '0 0 32px -6px rgba(193, 143, 46, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(193, 143, 46, 0.06) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(67, 56, 202, 0.05) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(193, 143, 46, 0.1) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
