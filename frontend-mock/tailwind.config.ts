import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: 'var(--color-amber)',
          light: 'var(--color-amber-light)',
          dark: 'var(--color-amber-dark)',
        },
        dark: 'var(--color-dark)',
        muted: 'var(--color-gray)',
        border: 'var(--color-border)',
        bg: 'var(--color-bg)',
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans:    ['Nunito', 'system-ui', 'sans-serif'],
        heading: ['Caudex', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
