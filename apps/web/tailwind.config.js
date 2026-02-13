/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        attrio: {
          navy: '#002D5C',       // Azul escuro principal
          blue: '#0052A3',        // Azul médio
          'blue-light': '#1E7DC9', // Azul claro
          green: '#7AB547',       // Verde check
          'green-light': '#8BC75C',
          gray: {
            50: '#F5F7FA',
            100: '#E8ECF1',
            200: '#D1D9E3',
            300: '#B3BFCC',
            400: '#8895A7',
            500: '#5D6B7C',
            600: '#49545F',
            700: '#3A424A',
            800: '#2A3037',
            900: '#1A1F24',
          }
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'attrio-sm': '0 1px 2px 0 rgba(0, 45, 92, 0.05)',
        'attrio': '0 4px 6px -1px rgba(0, 45, 92, 0.1)',
        'attrio-md': '0 10px 15px -3px rgba(0, 45, 92, 0.1)',
        'attrio-lg': '0 20px 25px -5px rgba(0, 45, 92, 0.1)',
      },
    },
  },
  plugins: [],
};
