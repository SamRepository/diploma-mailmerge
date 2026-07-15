import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-arabic)", "Amiri", "Noto Naskh Arabic", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
