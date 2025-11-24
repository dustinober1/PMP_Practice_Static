/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom color system with WCAG AA contrast (4.5:1 minimum)
        // Light mode: zinc-50 bg, zinc-900 text, sky-600 accent
        // Dark mode: zinc-950 bg, zinc-50 text, sky-500 accent
      },
      backgroundColor: {
        // Light mode
        'light-bg-primary': '#ffffff',      // white
        'light-bg-secondary': '#f4f4f5',    // zinc-100
        'light-bg-tertiary': '#fafafa',     // zinc-50
        // Dark mode
        'dark-bg-primary': '#09090b',       // zinc-950
        'dark-bg-secondary': '#18181b',     // zinc-900
        'dark-bg-tertiary': '#27272a',      // zinc-800
      },
      textColor: {
        // Light mode
        'light-text-primary': '#18181b',    // zinc-900 (900 on white = 21:1)
        'light-text-secondary': '#52525b',  // zinc-600 (600 on white = 6.5:1)
        'light-text-tertiary': '#71717a',   // zinc-500 (500 on white = 4.5:1)
        // Dark mode
        'dark-text-primary': '#fafafa',     // zinc-50 (50 on 950 = 15:1)
        'dark-text-secondary': '#d4d4d8',   // zinc-300 (300 on 950 = 8:1)
        'dark-text-tertiary': '#a1a1aa',    // zinc-400 (400 on 950 = 4.5:1)
      },
      accentColor: {
        light: '#0284c7',                   // sky-600 (600 on white = 5.5:1)
        dark: '#38bdf8',                    // sky-400 (400 on 950 = 6:1)
      },
      borderColor: {
        'light-border': '#e4e4e7',          // zinc-200
        'dark-border': '#3f3f46',           // zinc-700
      },
      boxShadow: {
        'light-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'light-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        'safe-area-inset-left': 'env(safe-area-inset-left)',
        'safe-area-inset-right': 'env(safe-area-inset-right)',
        'safe-area-inset-top': 'env(safe-area-inset-top)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
}
