import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#0f766e',
          hover: '#0d655e',
        },
        paper: '#FFFFFF',
        ink: {
          DEFAULT: '#0f172a', // slate-900
          muted: '#64748b',   // slate-500
          light: '#94a3b8',   // slate-400
        },
        teal: {
          DEFAULT: '#0f766e',
          hover: '#0d655e',
          light: '#f0fdfa',
        },
        marigold: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          light: '#fffbeb',
        },
        sage: {
          DEFAULT: '#10b981',
          light: '#ecfdf5',
        },
        warm: {
          border: '#e2e8f0', // slate-200
          card: '#f8fafc',   // slate-50
          stub: '#f1f5f9',   // slate-100
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        ledger: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        passbook: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
