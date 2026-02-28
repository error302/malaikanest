module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F8F4EE',
        secondary: '#D8A7B1',
        accent: '#B8860B', // Darkened for WCAG AA contrast
        text: '#2E2E2E',
        cta: '#9E3E50', // Darkened for WCAG AA contrast
        'cta-hover': '#7D2F40',
        cream: '#F8F4EE',
        dustyRose: '#D8A7B1',
        mutedGold: '#B8860B',
        charcoal: '#2E2E2E',
        deepBlush: '#9E3E50',
      }
    }
  },
  plugins: []
}
