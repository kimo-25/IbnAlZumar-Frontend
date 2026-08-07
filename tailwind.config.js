// File: tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F5F7', // app background — light, high-clarity workspace
        surface: '#FFFFFF',
        border: '#E2E4E9',
        ink: {
          DEFAULT: '#1A1D23',
          soft: '#6B7280',
        },
        graphite: {
          950: '#12151A',
          900: '#181C22', // sidebar
          800: '#232830',
          700: '#2E3440',
        },
        amber: {
          DEFAULT: '#F2A900', // signature accent — caution/tool-tape yellow, not generic SaaS blue
          dark: '#C98900',
        },
        success: '#1D9A6C',
        danger: '#D64545',
        info: '#2F6FED',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', '"Cairo"', 'sans-serif'],
        arabic: ['"Cairo"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
