/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core backgrounds - Using CSS variables
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-section': 'var(--bg-secondary)',
        
        // Accents - Using CSS variables
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-dark': 'var(--accent-primary)',
        
        // Primary brand
        'primary': 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        
        // Text - Using CSS variables
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        
        // Borders - Using CSS variables
        'border-default': 'var(--border)',
        
        // Status colors - Using CSS variables
        'status-success': 'var(--status-success)',
        'status-error': 'var(--status-error)',
        
        // Legacy colors (fallback)
        'cta': 'var(--primary)',
        'cta-hover': 'var(--primary-hover)',
        'border-dark': 'var(--border)',
        'badge-new': 'var(--accent-primary)',
        'star': '#D4A853',
        'out-of-stock': 'var(--text-muted)',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-playfair)', 'Playfair Display', 'serif'],
      },
      borderRadius: {
        'card': '20px',
        'btn': '12px',
        'input': '12px',
        'badge': '8px',
      },
      boxShadow: {
        'card': 'var(--shadow-lg)',
        'accent': 'var(--shadow-accent)',
        'purple': 'var(--shadow-accent)',
        'soft': 'var(--shadow-md)',
        'hover': 'var(--shadow-xl)',
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
          '50%': { transform: 'translateY(-12px)' },
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

