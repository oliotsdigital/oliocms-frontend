/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4effe',
          100: '#e7dcfd',
          200: '#d0bafb',
          300: '#b28df8',
          400: '#9859f8',
          500: '#8542f7',
          600: '#702bd9',
          700: '#5c1fae',
          800: '#4c1c8c',
          900: '#3f1871',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
