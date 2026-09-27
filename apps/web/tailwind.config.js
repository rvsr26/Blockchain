import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import("tailwindcss").Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", "Inter", ...fontFamily.sans],
      },
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          400: "#6b8cff",
          500: "#4f6ef7",
          600: "#3d5af1",
          700: "#2d46e0",
          900: "#1a2eb8",
        },
        surface: {
          DEFAULT: "#0f1117",
          card: "#171b2d",
          border: "#252a3d",
          hover: "#1e2438",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
