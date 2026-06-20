/** rgb(var(--token) / <alpha-value>) — habilita utilidades de opacidad sobre los tokens. */
var withAlpha = function (token) { return "rgb(var(".concat(token, ") / <alpha-value>)"); };
var config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                /* Superficies */
                canvas: {
                    DEFAULT: withAlpha('--canvas'),
                    subtle: withAlpha('--canvas-subtle'),
                },
                surface: withAlpha('--surface'),
                elevated: withAlpha('--elevated'),
                muted: withAlpha('--muted'),
                /* Bordes */
                border: {
                    DEFAULT: withAlpha('--border'),
                    strong: withAlpha('--border-strong'),
                },
                /* Texto */
                content: {
                    DEFAULT: withAlpha('--content'),
                    secondary: withAlpha('--content-secondary'),
                    muted: withAlpha('--content-muted'),
                    inverse: withAlpha('--content-inverse'),
                },
                /* Marca */
                brand: {
                    DEFAULT: withAlpha('--brand'),
                    hover: withAlpha('--brand-hover'),
                    soft: withAlpha('--brand-soft'),
                    contrast: withAlpha('--brand-contrast'),
                    text: withAlpha('--brand-text'),
                    /* Escala fija (acentos) — preserva clases existentes */
                    100: '#D1FAE5',
                    200: '#A7F3D0',
                    300: '#6EE7B7',
                    400: '#34D399',
                    500: '#10B981',
                    600: '#059669',
                },
                /* Estados */
                success: withAlpha('--success'),
                warning: withAlpha('--warning'),
                danger: withAlpha('--danger'),
                accent: {
                    violet: '#7C3AED',
                    cyan: '#22D3EE',
                    gold: '#F59E0B',
                },
                /* --- Aliases legacy (se re-mapean a tokens para temizar markup existente) --- */
                ink: {
                    /* Tinta fija oscura: para texto sobre superficies de marca/claras */
                    950: '#08110E',
                    900: '#0F1614',
                    850: '#161E1C',
                },
                line: withAlpha('--border'),
                panel: withAlpha('--surface'),
            },
            fontFamily: {
                display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                glow: 'var(--shadow-glow)',
                'card-sm': 'var(--shadow-sm)',
                'card-md': 'var(--shadow-md)',
                'card-lg': 'var(--shadow-lg)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
        },
    },
    plugins: [],
};
export default config;
