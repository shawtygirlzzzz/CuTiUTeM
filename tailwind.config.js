/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single restrained accent (SDD §8). Teal matches the PWA theme color.
        brand: {
          DEFAULT: '#0f766e',
          light: '#14b8a6',
          dark: '#0d5c56',
        },
        // Semantic event-type colors, chosen to hold up at AA contrast (SDD §8).
        event: {
          break: '#16a34a', // positive / green
          holiday: '#0d9488', // positive / teal
          study_week: '#d97706', // caution / amber
          exam: '#dc2626', // alert / red
          semester_start: '#475569', // neutral / slate
          semester_end: '#475569',
          registration: '#475569',
          class: '#64748b',
          special: '#7c3aed',
        },
      },
      fontFamily: {
        // Display face for the countdown numeral; body stays on the system stack.
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
