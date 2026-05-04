/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Hades 톤 — 짙은 남색 배경 + 따뜻한 황금색 액센트
        hades: {
          bg: "#0F1A2E",
          surface: "#162338",
          gold: "#E8B95A",
          accent: "#F5C76E",
          text: "#F4F1EA",
          muted: "#8FA0BC",
          danger: "#E57373",
          ok: "#7CB48F",
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
