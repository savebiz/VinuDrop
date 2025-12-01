import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-fredoka)', 'sans-serif'],
                mono: ['var(--font-inter)', 'monospace'],
            },
            colors: {
                background: "var(--bg-primary)",
                foreground: "var(--text-primary)",
                "deep-space": "#0B0B15",
                "neon-cyan": "#00F0FF",
                "hot-pink": "#FF0099",
                "golden-yellow": "#FFD700",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "laser-beam": "linear-gradient(90deg, transparent, rgba(255, 0, 153, 0.5), transparent)",
            },
            animation: {
                "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "glow": "glow 2s ease-in-out infinite alternate",
            },
            keyframes: {
                glow: {
                    "0%": { boxShadow: "0 0 5px #00F0FF, 0 0 10px #00F0FF" },
                    "100%": { boxShadow: "0 0 20px #00F0FF, 0 0 30px #00F0FF" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
