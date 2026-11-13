import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#183F35",
          hover: "#245447",
          light: "#E6EFE8",
        },
        ivory: {
          DEFAULT: "#F7F5EF",
          subtle: "#F0EDE4",
          warm: "#FAF8F3",
        },
        card: "#FFFFFF",
        sage: {
          DEFAULT: "#E6EFE8",
          subtle: "#D4E2D8",
          dark: "#2A4D43",
        },
        citrus: {
          DEFAULT: "#E6B65C",
          hover: "#D4A346",
          light: "#FDF8ED",
          accent: "#F3C978",
        },
        tomato: {
          DEFAULT: "#D96D4C",
          hover: "#C35A3B",
          light: "#FDF2EF",
          accent: "#E28264",
        },
        foreground: "#202923",
        muted: {
          DEFAULT: "#707A73",
          light: "#95A098",
        },
        border: "#E7E5DD",
        status: {
          success: "#1E7E51",
          successBg: "#EBF5F0",
          warning: "#D9822B",
          warningBg: "#FEF7ED",
          danger: "#C2410C",
          dangerBg: "#FEF2F2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        café: "14px",
        bento: "24px",
        organic: "28px",
        pebble: "36px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(24, 63, 53, 0.05), 0 1px 2px rgba(24, 63, 53, 0.03)",
        card: "0 4px 16px -2px rgba(24, 63, 53, 0.06), 0 2px 6px -1px rgba(24, 63, 53, 0.03)",
        float: "0 12px 32px -4px rgba(24, 63, 53, 0.12), 0 4px 12px -2px rgba(24, 63, 53, 0.06)",
        diffuse: "0 20px 48px -12px rgba(24, 63, 53, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)",
        pill: "0 10px 30px -5px rgba(24, 63, 53, 0.1), 0 2px 6px -1px rgba(24, 63, 53, 0.04)",
        glow: "0 0 50px -10px rgba(230, 182, 92, 0.35)",
      },
      keyframes: {
        floatBlob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      animation: {
        blob: 'floatBlob 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
