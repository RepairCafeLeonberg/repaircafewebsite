import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f3ff',
          100: '#dee1ff',
          200: '#c2c6ff',
          300: '#9ea5ff',
          400: '#7b84f1',
          500: '#5863d8',
          600: '#2d2e7d',
          700: '#272768',
          800: '#1f2052',
          900: '#191a41'
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        logo: ['"Curlz MT"', 'cursive']
      },
      container: {
        center: true,
        padding: '1rem',
        screens: { '2xl': '1200px' }
      }
    }
  },
  plugins: [typography]
};
