/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // 다크 테마 기반 색상 (Liquid Glass)
        prowl: {
          bg: 'transparent',
          surface: 'rgba(255, 255, 255, 0.06)',
          card: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.15)',
        },
        // 골드 액센트 (고양이 눈 색상)
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#fbbf24',
          muted: '#b45309',
        },
        // 라이트 테마
        surface: {
          light: '#fafafa',
          dark: '#0d0d0d',
        },
        card: {
          light: '#ffffff',
          dark: '#161616',
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-success': '0 0 10px rgba(34, 197, 94, 0.2)',
        'glow-error': '0 0 10px rgba(239, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
};
