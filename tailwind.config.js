/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#0F0F0F', // Ink (Off-Black)
                    accent: '#C8C6F5',  // The Glow (Digital Lavender)
                    muted: '#D1CDC7',   // Structure (Warm Stone)
                    canvas: '#F9F9F9',  // Canvas (Off-White)
                    nature: '#D8E2DC',  // Nature (Soft Sage)
                },
                gray: {
                    750: '#2d3748',
                    850: '#1a202c',
                    950: '#0F0F0F', // Sync with Ink
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Barlow', 'sans-serif'],
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '3rem',
            },
            backdropBlur: {
                'xs': '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in-up': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
