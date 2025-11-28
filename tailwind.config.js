/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // Brand Colors - refined blue
                primary: {
                    DEFAULT: '#2563EB', // Blue-600
                    hover: '#1D4ED8',   // Blue-700
                    light: '#60A5FA',   // Blue-400
                    foreground: '#FFFFFF',
                },
                // Backgrounds
                background: {
                    light: '#F8FAFC',   // Slate-50
                    dark: '#0F172A',    // Slate-900
                },
                // Surfaces (Cards, Sidebars)
                surface: {
                    light: '#FFFFFF',
                    dark: '#1E293B',    // Slate-800
                    hover: '#F1F5F9',   // Slate-100
                    'hover-dark': '#334155', // Slate-700
                },
                // Text
                text: {
                    primary: {
                        light: '#0F172A', // Slate-900
                        dark: '#F8FAFC',  // Slate-50
                    },
                    secondary: {
                        light: '#64748B', // Slate-500
                        dark: '#94A3B8',  // Slate-400
                    },
                    muted: {
                        light: '#94A3B8', // Slate-400
                        dark: '#64748B',  // Slate-500
                    }
                },
                // Borders
                border: {
                    light: '#E2E8F0', // Slate-200
                    dark: '#334155',  // Slate-700
                },
                // Status
                success: '#10B981', // Emerald-500
                danger: '#EF4444',  // Red-500
                warning: '#F59E0B', // Amber-500
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Inter', 'system-ui', 'sans-serif'], // Keep consistent for now, can add a display font later
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out',
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
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
            boxShadow: {
                'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
                'soft-lg': '0 10px 25px rgba(0, 0, 0, 0.04)',
            }
        },
    },
    plugins: [],
}
