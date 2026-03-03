/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        prompter: {
          yellow: 'rgb(255, 214, 10)',
          green: 'rgb(51, 214, 74)',
          blue: 'rgb(79, 140, 255)',
          pink: 'rgb(255, 97, 145)',
          orange: 'rgb(255, 158, 10)',
        },
      },
    },
  },
  plugins: [],
};
