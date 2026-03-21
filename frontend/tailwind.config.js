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
          green:  '#1A3A2A',
          green2: '#254D38',
          terra:  '#C4704A',
          terra2: '#D4835E',
          gold:   '#C9A96E',
          gold2:  '#E8C98A',
          ivory:  '#FDF8F3',
          cream:  '#FAF4EC',
          text:   '#2C1810',
          text2:  '#5C4033',
          text3:  '#8A7060',
        },
      },
      fontFamily: {
        sans:  ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'ui-serif', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      scale: {
        '103': '1.03',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(44,24,16,0.08)',
        'warm-md': '0 8px 24px rgba(44,24,16,0.10)',
        'warm-lg': '0 16px 48px rgba(44,24,16,0.12)',
        'warm-xl': '0 24px 64px rgba(44,24,16,0.16)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
