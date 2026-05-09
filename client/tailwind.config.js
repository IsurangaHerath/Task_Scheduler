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
                    light: 'rgb(168 230 207 / <alpha-value>)',
                    DEFAULT: 'rgb(168 230 207 / <alpha-value>)',
                    dark: 'rgb(107 203 119 / <alpha-value>)',
                    hover: 'rgb(90 189 105 / <alpha-value>)',
                },
                // Border color
                border: {
                    DEFAULT: 'rgb(226 232 240 / <alpha-value>)',
                    light: 'rgb(241 245 249 / <alpha-value>)',
                },
                // Background colors
                background: {
                    main: 'rgb(245 251 247 / <alpha-value>)',
                    card: 'rgb(255 255 255 / <alpha-value>)',
                    sidebar: 'rgb(232 245 233 / <alpha-value>)',
                },
                // Text colors
                text: {
                    primary: 'rgb(27 67 50 / <alpha-value>)',
                    secondary: 'rgb(64 145 108 / <alpha-value>)',
                    muted: 'rgb(116 198 157 / <alpha-value>)',
                },
                // Priority colors
                priority: {
                    low: 'rgb(168 230 207 / <alpha-value>)',
                    medium: 'rgb(255 217 61 / <alpha-value>)',
                    high: 'rgb(255 107 107 / <alpha-value>)',
                },
                // Status colors
                status: {
                    success: 'rgb(107 203 119 / <alpha-value>)',
                    warning: 'rgb(255 217 61 / <alpha-value>)',
                    error: 'rgb(255 107 107 / <alpha-value>)',
                },
            },
            // Dark mode color overrides
            backgroundColor: {
                'dark': {
                    'background-main': '#0D1117',
                    'background-card': '#161B22',
                    'background-sidebar': '#0D2818',
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
