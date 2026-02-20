/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // prowl 컴포넌트 색상 — CSS 변수로 라이트/다크 자동 분기
        prowl: {
          bg: 'transparent',
          surface: 'var(--prowl-surface)',
          card: 'var(--prowl-card)',
          border: 'var(--prowl-border)',
          'border-hover': 'var(--prowl-border-hover)',
        },
        // 의미론적 텍스트/배경 토큰 — CSS 변수로 라이트/다크 자동 분기
        app: {
          'text-primary':   'var(--app-text-primary)',
          'text-secondary': 'var(--app-text-secondary)',
          'text-muted':     'var(--app-text-muted)',
          'text-faint':     'var(--app-text-faint)',
          'text-ghost':     'var(--app-text-ghost)',
          'hover-bg':       'var(--app-hover-bg)',
          'active-bg':      'var(--app-active-bg)',
          'input-bg':       'var(--app-input-bg)',
          'input-border':   'var(--app-input-border)',
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
