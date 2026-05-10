import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#08110d",
        forest: "#0f2a1f",
        moss: "#1c7a52",
        mist: "#f4f1e8",
        ember: "#d3ff7f",
        chrome: "#95a89c"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(47, 200, 120, 0.18)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(80, 255, 165, 0.18), transparent 36%), radial-gradient(circle at bottom left, rgba(240, 255, 177, 0.14), transparent 28%)"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
