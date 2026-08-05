/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        triage: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4bfff',
          300: '#9e94ff',
          400: '#7c6bff',
          500: '#6246f8',
          600: '#5429ef',
          700: '#491ddc',
          800: '#3c19b6',
          900: '#331994',
        },
        accent: {
          red: '#e74c3c',
          blue: '#3498db',
          yellow: '#f1c40f',
          coral: '#e67e80',
        },
      },
    },
  },
  plugins: [],
};
