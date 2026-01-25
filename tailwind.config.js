/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        surface: {
          light: '#ffffff',
          dark: '#1e1e1e',
        },
        card: {
          light: '#f5f5f5',
          dark: '#2d2d2d',
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
