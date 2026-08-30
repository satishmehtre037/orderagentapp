import type { Config } from 'tailwindcss';

/**
 * Colour, radius and shadow values live as CSS variables in src/app/globals.css
 * so that one `.dark` class on <html> swaps the whole palette. This config only
 * maps semantic names onto those variables.
 *
 * Prefer semantic utilities (`bg-surface`, `text-fg-muted`, `border-line`) over
 * raw palette classes (`bg-white`, `text-slate-500`, `border-slate-200`) — the
 * semantic ones are automatically correct in both themes.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // dashboard/page.tsx already used `xs:` before this existed, which
        // silently hid the "+ New Client" / "+ Book OPD" button labels.
        xs: '480px',
      },
      colors: {
        /* ---- Semantic tokens (use these) ---- */
        base: 'var(--bg-base)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          subtle: 'var(--bg-subtle)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)',
        },
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)',
          inverse: 'var(--fg-inverse)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          fg: 'var(--accent-fg)',
          subtle: 'var(--accent-subtle)',
          border: 'var(--accent-border)',
        },
        success: {
          DEFAULT: 'var(--success)',
          hover: 'var(--success-hover)',
          fg: 'var(--success-fg)',
          subtle: 'var(--success-subtle)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          fg: 'var(--warning-fg)',
          subtle: 'var(--warning-subtle)',
          border: 'var(--warning-border)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: 'var(--danger-hover)',
          fg: 'var(--danger-fg)',
          subtle: 'var(--danger-subtle)',
          border: 'var(--danger-border)',
        },
        info: {
          DEFAULT: 'var(--info)',
          fg: 'var(--info-fg)',
          subtle: 'var(--info-subtle)',
          border: 'var(--info-border)',
        },

        /* ---- Legacy keys, kept so in-flight components keep compiling ----
           These are being migrated out; do not use them in new code. */
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
          DEFAULT: '#0f172a',
          muted: '#64748b',
          light: '#94a3b8',
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
          border: '#e2e8f0',
          card: '#f8fafc',
          stub: '#f1f5f9',
        },
      },
      borderRadius: {
        // Modern-SaaS scale: tighter than the rounded-2xl/3xl currently in use.
        sm: '0.375rem', // 6px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem', // 8px
        lg: '0.625rem', // 10px
        xl: '0.75rem', // 12px
        '2xl': '1rem', // 16px
        '3xl': '1.25rem', // 20px
      },
      fontFamily: {
        // Actual families are injected by next/font in layout.tsx.
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        // Legacy aliases, previously defined but unused.
        ledger: 'var(--shadow-sm)',
        passbook: 'var(--shadow-md)',
        card: 'var(--shadow-sm)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'slide-in-top': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'scale-in': 'scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 200ms cubic-bezier(0.4, 0, 1, 1)',
        'slide-in-top': 'slide-in-top 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionTimingFunction: {
        // The easing that was previously inlined via style={{}} in ToastContext.
        emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      scale: {
        // `active:scale-98` was already used in login/signup/ToastContext but
        // never existed in the default scale, so the press feedback did nothing.
        '98': '0.98',
      },
    },
  },
  plugins: [],
};

export default config;
