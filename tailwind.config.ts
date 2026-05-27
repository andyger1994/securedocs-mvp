import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fb",
          100: "#edf0f6",
          500: "#687083",
          700: "#2d3442",
          900: "#121722"
        },
        accent: {
          500: "#2f6df6",
          600: "#1f58d8"
        },
        panel: "#ffffff",
        line: "#dfe4ee"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(18, 23, 34, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
