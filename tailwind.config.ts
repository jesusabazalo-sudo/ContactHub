import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050B0A',
          900: '#0B1714',
          850: '#0F1F1C',
        },
        brand: {
          400: '#34D399',
          500: '#22C55E',
          600: '#16A34A',
        },
        accent: {
          violet: '#7C3AED',
          cyan: '#22D3EE',
          gold: '#FACC15',
        },
        line: 'rgba(255,255,255,0.08)',
        panel: 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 42px rgba(34, 197, 94, 0.18), 0 0 68px rgba(124, 58, 237, 0.08)',
      },
      backgroundImage: {
        'radial-grid':
          'radial-gradient(circle at 20% 20%, rgba(34,201,133,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(29,180,122,0.12), transparent 22%), linear-gradient(180deg, #071111 0%, #0B1818 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
