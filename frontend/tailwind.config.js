/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary dark theme colors
        primary: '#1C1C2E',      // Deep dark navy/charcoal
        card: '#252538',         // Slightly lighter dark
        'card-hover': '#2D2D45', // Even lighter on hover
        accent: '#7B2FBE',       // Rich purple
        'accent-hover': '#9B4FDE',
        muted: '#A0A0B8',        // Muted grey-purple
        border: '#3A3A55',       // Border/divider
        gold: '#FFD700',         // Golden yellow
        
        // Legacy colors (kept for compatibility)
        secondary: '#D8A7B1',
        text: '#FFFFFF',
        cta: '#7B2FBE',
        'cta-hover': '#9B4FDE',
        cream: '#F8F4EE',
        dustyRose: '#D8A7B1',
        mutedGold: '#B8860B',
        charcoal: '#2E2E2E',
        deepBlush: '#9E3E50',
        
        // Utility colors
        success: '#4CAF50',
        warning: '#FFB800',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
        'input': '12px',
        'tag': '8px',
      },
      boxShadow: {
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 12px 40px rgba(123,47,190,0.3)',
        'button': '0 4px 20px rgba(123,47,190,0.4)',
      },
      spacing: {
        'section': '80px',
        'section-x': '120px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
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
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

