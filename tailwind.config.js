var config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: {
                    950: '#071111',
                    900: '#0B1818',
                    850: '#102020',
                },
                brand: {
                    400: '#22C985',
                    500: '#1DB47A',
                    600: '#0F8F5F',
                },
                line: 'rgba(255,255,255,0.08)',
                panel: 'rgba(255,255,255,0.04)',
            },
            fontFamily: {
                display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                glow: '0 0 40px rgba(34, 201, 133, 0.16)',
            },
            backgroundImage: {
                'radial-grid': 'radial-gradient(circle at 20% 20%, rgba(34,201,133,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(29,180,122,0.12), transparent 22%), linear-gradient(180deg, #071111 0%, #0B1818 100%)',
            },
        },
    },
    plugins: [],
};
export default config;
