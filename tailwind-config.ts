/* eslint-disable @typescript-eslint/no-require-imports */
// tailwind.config.js (place at project root)
import plugin from 'tailwindcss/plugin'

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",      // Next.js app router
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",    // Next.js pages router
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // add other folders where you keep UI (stories, examples, etc.)
  ],
  theme: {
    extend: {
      animation: {
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'in': 'in 0.3s ease-out',
        'fade-in-0': 'fade-in 0.3s ease-out',
        'slide-in-from-bottom-1': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-bottom-2': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left-2': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right-2': 'slide-in-from-right 0.3s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      colors: {
        gray: {
          850: '#121212',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // optional: custom utility for animation-delay helper if you want
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.animation-delay-0': { 'animation-delay': '0ms' },
        '.animation-delay-150': { 'animation-delay': '150ms' },
        '.animation-delay-300': { 'animation-delay': '300ms' },
      })
    }),
  ],

  // Safelist - prevents purge for classes that are built dynamically or used rarely
  // (optional but helpful for animation classes if you compute them)
  safelist: [
    'animate-in',
    'animate-fade-in-0',
    'animate-slide-in-from-bottom-1',
    'animate-slide-in-from-bottom-2',
    'animate-slide-in-from-left-2',
    'animate-slide-in-from-right-2',
    'animate-bounce',
    'animate-pulse',
    'animation-delay-0',
    'animation-delay-150',
    'animation-delay-300',
  ],
}
