/** @type {import('tailwindcss').Config} */
// Los colores leen las variables definidas en src/styles/tokens.css,
// así el tema se cambia en un solo lugar.
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: token('primary-50'),
          100: token('primary-100'),
          500: token('primary-500'),
          600: token('primary-600'),
          700: token('primary-700'),
        },
        canvas: token('canvas'),
        surface: token('surface'),
        line: token('line'),
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
        },
        success: token('success'),
        danger: token('danger'),
        warning: token('warning'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(31 41 51 / 0.06), 0 1px 3px rgb(31 41 51 / 0.08)',
        raised: '0 4px 12px rgb(31 41 51 / 0.10), 0 2px 4px rgb(31 41 51 / 0.06)',
        modal: '0 20px 48px rgb(31 41 51 / 0.22)',
      },
      maxWidth: {
        feed: '720px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'pop-in': 'pop-in 180ms ease-out',
        'toast-in': 'toast-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
