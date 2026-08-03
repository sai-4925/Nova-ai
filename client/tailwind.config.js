// tailwind.config.js
// -----------------------------------------------------------------------
// Encodes NOVA AI's visual identity as reusable design tokens instead of
// hard-coding hex values throughout components. See the design plan:
// deep-void background, warm amber "nova burst" accent, cool violet
// "signal" accent for AI/voice states.
// -----------------------------------------------------------------------

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0D0E14', // page background
        surface: '#161826', // card/panel background
        'surface-raised': '#1E2133', // hover/elevated surface
        hairline: '#262838', // borders/dividers
        'nova-amber': {
          DEFAULT: '#F2A93B',
          dim: '#B9822C',
          bright: '#FFC670',
        },
        'signal-violet': {
          DEFAULT: '#7C6FF0',
          dim: '#5B4FC7',
          bright: '#A79BFF',
        },
        ink: {
          DEFAULT: '#F5F4F0', // primary text
          muted: '#9497AC', // secondary text
          faint: '#5B5E73', // disabled/placeholder text
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px -15px rgba(242, 169, 59, 0.35)',
        'glow-violet': '0 0 60px -15px rgba(124, 111, 240, 0.4)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        burst: {
          '0%': { transform: 'scale(0.9)', opacity: '0.9' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        breathe: 'breathe 3.5s ease-in-out infinite',
        burst: 'burst 1.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
