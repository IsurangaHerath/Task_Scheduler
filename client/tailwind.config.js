/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary theme colors - Soft Light Green
                primary: {
                    light: '#A8E6CF',
                    DEFAULT: '#A8E6CF',
                    dark: '#6BCB77',
                    hover: '#5ABD69',
                },
                // Border color
                border: {
                    DEFAULT: '#E2E8F0',
                    light: '#F1F5F9',
                },
                // Background colors
                background: {
                    main: '#F5FBF7',
                    card: '#FFFFFF',
                    sidebar: '#E8F5E9',
                },
                // Text colors
                text: {
                    primary: '#1B4332',
                    secondary: '#40916C',
                    muted: '#74C69D',
                },
                // Priority colors
                priority: {
                    low: '#A8E6CF',
                    medium: '#FFD93D',
                    high: '#FF6B6B',
                },
                // Status colors
                status: {
                    success: '#6BCB77',
                    warning: '#FFD93D',
                    error: '#FF6B6B',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(168, 230, 207, 0.3), 0 10px 20px -2px rgba(168, 230, 207, 0.2)',
                'card': '0 4px 6px -1px rgba(168, 230, 207, 0.1), 0 2px 4px -1px rgba(168, 230, 207, 0.06)',
                'hover': '0 10px 25px -5px rgba(168, 230, 207, 0.3), 0 8px 10px -6px rgba(168, 230, 207, 0.2)',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
