import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          navy: '#1e3a5f',
          'navy-dark': '#152d4a',
          gold: '#f59e0b',
          'gold-light': '#fef3c7',
        },
        surface: {
          page: '#f8fafc',
          card: '#ffffff',
          muted: '#f1f5f9',
          border: '#e2e8f0',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
          inverse: '#ffffff',
        },
        status: {
          live: '#ef4444',
          scheduled: '#3b82f6',
          ended: '#6b7280',
          success: '#10b981',
        },
        sidebar: {
          bg: '#1e293b',
          text: '#94a3b8',
          active: '#3b82f6',
          hover: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
