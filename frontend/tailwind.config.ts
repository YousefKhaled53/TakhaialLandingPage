import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#05050A",
          800: "#0A0A13",
          700: "#10101C",
        },
        violet: {
          accent: "#6B4CE6",
          glow: "#8A6BFF",
        },
        neon: {
          red: "#FF3366",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        ultra: "0.22em",
      },
      boxShadow: {
        glow: "inset 0 0 40px rgba(138, 107, 255, 0.08), 0 10px 60px rgba(107, 76, 230, 0.12)",
        glowRed: "inset 0 0 40px rgba(255, 51, 102, 0.1), 0 10px 60px rgba(255, 51, 102, 0.15)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      backdropBlur: {
        heavy: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
