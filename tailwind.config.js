/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // 다크 테마 기반 색상 (로고 컨셉)
        prowl: {
          bg: '#0d0d0d',
          surface: '#161616',
          card: '#1e1e1e',
          border: '#2a2a2a',
          'border-hover': '#3a3a3a',
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
