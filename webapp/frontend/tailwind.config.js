/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 로컬링크(Local Link) CI — 그린 프라이머리 + 블루 서브 + 오렌지 포인트
        brand: {
          green: "#1B5E20",
          greenLight: "#2E7D32",
          blue: "#1976D2",
          orange: "#EF6C00",
        },
        shop: {
          teal: "#0d9488",
          tealHover: "#0f766e",
          tealDark: "#115e59",
          tealLight: "#ccfbf1",
          surface: "#f4faf9",
        },
        hades: {
          bg: "#f6faf6",
          surface: "#ffffff",
          line: "#e2e8e6",
          gold: "#1B5E20",
          accent: "#2E7D32",
          text: "#1c1917",
          muted: "#757575",
          danger: "#dc2626",
          ok: "#15803d",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
      fontSize: {
        // 노인 친화 — 기본 1rem이 18px가 되도록
        base: ["1.125rem", "1.7"],
        lg: ["1.35rem", "1.6"],
        xl: ["1.6rem", "1.5"],
        "2xl": ["2rem", "1.4"],
        "3xl": ["2.6rem", "1.3"],
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
