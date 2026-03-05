/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core backgrounds - Dark theme
        'bg-primary':    '#1C1C2E',
        'bg-card':       '#252538',
        'bg-card-hover': '#2D2D45',
        'bg-section':    '#1A1A2E',
        
        // Accents - Warm gold
        'accent':        '#C8963E',
        'accent-hover':  '#E0A83F',
        'purple':        '#7B2FBE',
        'purple-hover':  '#9B4FDE',
        
        // Text
        'text-primary':  '#FFFFFF',
        'text-muted':    '#A0A0B8',
        'text-dark':     '#1C1C2E',
        
        // UI
        'border-dark':   '#3A3A55',
        'badge-new':     '#C8963E',
        'star':          '#FFB800',
        'out-of-stock':  '#6B7280',
        
        // Lulu Babe Inspired - Soft Pastels
        'pastel-pink':   '#FFB6B9',
        'pastel-mint':   '#A8DADC',
        'pastel-beige':  '#F8EDE3',
        'pastel-navy':   '#4A4E69',
        'pastel-peach':  '#FFDAB9',
        'pastel-lavender': '#E6E6FA',
        
        // Status colors
        'status-success': '#4CAF50',
        'status-warning': '#FF9800',
        'status-error':   '#F44336',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'card':   '20px',
        'btn':    '12px',
        'input':  '12px',
        'badge':  '8px',
      },
      boxShadow: {
        'card':   '0 8px 32px rgba(0,0,0,0.4)',
        'accent': '0 4px 20px rgba(200,150,62,0.4)',
        'purple': '0 4px 20px rgba(123,47,190,0.4)',
        'soft':   '0 2px 15px rgba(0,0,0,0.1)',
        'hover':  '0 10px 40px rgba(0,0,0,0.15)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.95' },
        },
      },
    },
  },
  plugins: [],
}
