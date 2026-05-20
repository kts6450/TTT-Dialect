/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,css}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1B5E20",
          greenLight: "#2E7D32",
          greenDark: "#14532d",
          blue: "#1976D2",
          orange: "#EF6C00",
          cream: "#f7faf7",
          line: "#e5ebe6",
        },
        shop: {
          teal: "#1B5E20",
          tealHover: "#2E7D32",
          tealDark: "#14532d",
          tealLight: "#e8f5e9",
          surface: "#f7faf7",
        },
        hades: {
          bg: "#f7faf7",
          surface: "#ffffff",
          line: "#e5ebe6",
          gold: "#1B5E20",
          accent: "#2E7D32",
          text: "#1a1f1a",
          muted: "#5c6b5c",
          danger: "#dc2626",
          ok: "#15803d",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", "1.65"],
        lg: ["1.25rem", "1.55"],
        xl: ["1.5rem", "1.45"],
        "2xl": ["1.875rem", "1.35"],
        "3xl": ["2.25rem", "1.25"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(27, 94, 32, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.1)",
        "card-hover": "0 4px 20px -4px rgba(27, 94, 32, 0.12), 0 12px 32px -12px rgba(15, 23, 42, 0.14)",
      },
      keyframes: {
        pulse_ring: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        idle_glow: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.55" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.5s ease-out infinite",
        idle_glow: "idle_glow 3s ease-in-out infinite",
        wave: "wave 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
