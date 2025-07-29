/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'slideIn': 'slideIn 0.3s ease-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { 
            opacity: '0', 
            transform: 'translateY(-10px)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        slideIn: {
          'from': { 
            opacity: '0', 
            transform: 'translateX(20px)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
        }
      },
      colors: {
        'Background': '#e9c194',
        'header': '#31853acc',
        'button': '#2f8e38',
        // Colores adicionales para el dashboard admin
        'admin': {
          'primary': '#1f2937',
          'secondary': '#374151',
          'accent': '#3b82f6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
        }
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [],
}