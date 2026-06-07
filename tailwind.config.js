/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0c10',
          2: '#111318',
          3: '#181c22',
          4: '#1e232b',
        },
        border: {
          DEFAULT: '#2a2f3a',
          2: '#3a404d',
        },
        green: {
          DEFAULT: '#00d68f',
          2: '#00a86b',
          3: '#003d28',
        },
        amber: {
          DEFAULT: '#f5a623',
          2: '#c4841c',
          3: '#3d2800',
        },
        danger: {
          DEFAULT: '#ff4d4d',
          2: '#cc3333',
          3: '#3d0000',
        },
        blue: {
          DEFAULT: '#4d9fff',
          2: '#2d7fd4',
          3: '#001833',
        },
        purple: '#a855f7',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
