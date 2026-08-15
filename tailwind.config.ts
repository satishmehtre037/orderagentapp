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
        paper: '#FBFAF7',
        ink: {
          DEFAULT: '#1C2321',
          muted: '#4A5552',
          light: '#707D79',
        },
        teal: {
          DEFAULT: '#0F3D3E',
          hover: '#0A2B2C',
          light: '#E6F0F0',
        },
        marigold: {
          DEFAULT: '#E8A33D',
          hover: '#D4922B',
          light: '#FDF6EA',
        },
        sage: {
          DEFAULT: '#7A9B76',
          light: '#EFF4EE',
        },
        warm: {
          border: '#E4E0D6',
          card: '#F6F3EC',
          stub: '#EFECE6',
        },
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-public-sans)', 'Public Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        ledger: '0 2px 8px -2px rgba(28, 35, 33, 0.05), 0 1px 3px -1px rgba(28, 35, 33, 0.08)',
        passbook: '0 4px 16px -4px rgba(15, 61, 62, 0.08)',
      },
      borderWidth: {
        hairline: '1px',
      },
    },
  },
  plugins: [],
};

export default config;
