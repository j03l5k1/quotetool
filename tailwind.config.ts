import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: '#00d9ff',
          dark: '#00b8d4',
        },
        dark: {
          DEFAULT: '#0a0e1a',
          lighter: '#1a1f2e',
          card: '#141824',
        }
      },
    },
  },
  plugins: [],
};
export default config;
