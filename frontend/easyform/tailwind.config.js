/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sixcaps: ['"Six Caps"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
        serif: ['"Newsreader"', 'serif'],
      },
      colors: {
        mint: {
          light: '#CEF1E4',
          soft: '#CCF0E6',
          50: '#F0FAF6',
          100: '#E2F7EF',
          200: '#CEF1E4',
          300: '#CCF0E6',
          400: '#7FE0BF',
          500: '#2EB688',
          600: '#259B73',
          700: '#1E8561',
        },
        primary: {
          DEFAULT: '#2EB688',
          hover: '#259B73',
          dark: '#1E8561',
          light: '#3FCB9C',
        },
        charcoal: {
          50: '#4B4F4C',
          100: '#3D413E',
          200: '#343835',
          DEFAULT: '#2E2E2E',
          surface: '#2E2E2E',
          card: '#1E2220',
          bg: '#111214',
        },
        coolgray: {
          DEFAULT: '#ACAFAB',
          muted: '#6B706D',
          subtle: '#8E928F',
        },
        gold: {
          400: '#3FCB9C',
          500: '#2EB688',
          600: '#259B73',
        }
      },
      animation: {
        'scan-beam': 'scan 3s ease-in-out infinite',
        'subtle-pulse': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.2' },
          '50%': { transform: 'translateY(100%)', opacity: '0.8' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-1.5deg)' },
        }
      }
    },
  },
  plugins: [],
}
