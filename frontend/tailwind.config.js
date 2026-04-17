/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // New warm organic palette
          bg: '#F8F4EF',
          'bg-alt': '#FAF6F1',
          cream: '#FDF8F3',
          warm: '#F5EFE6',
          sand: '#EDE3D8',
          
          // Golds
          gold: '#8B6914',
          'gold-light': '#C9A96E',
          'gold-soft': '#E8D5B5',
          
          // Browns
          brown: '#5C4033',
          'brown-dark': '#3D2B1F',
          'brown-light': '#8A7060',
          
          // Greens (muted)
          green: '#1A3A2A',
          'green-dark': '#0D1F14',
          'green-light': '#2D5A42',
          
          // Terracotta accents
          terra: '#C4704A',
          'terra-light': '#D4835E',
          'terra-soft': '#E8A88A',
          
          // Text colors
          text: '#2C1810',
          'text-secondary': '#5C4033',
          'text-muted': '#8A7060',
          
          // Legacy compatibility
          ivory: '#FDF8F3',
        },
        // Design tokens
        text: {
          primary: '#2C1810',
          secondary: '#5C4033',
          muted: '#8A7060',
        },
        bg: {
          primary: '#FDF8F3',
          soft: '#F5EFE6',
          surface: '#FAF6F1',
        },
        border: {
          default: '#E8E0D5',
          hover: '#D8CFC0',
        },
        accent: {
          primary: '#8B6914',
          secondary: '#C4704A',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      scale: {
        '103': '1.03',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(44,24,16,0.06)',
        'warm-md': '0 8px 24px rgba(44,24,16,0.08)',
        'warm-lg': '0 16px 48px rgba(44,24,16,0.10)',
        'warm-xl': '0 24px 64px rgba(44,24,16,0.14)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
