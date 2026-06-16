import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4F46E5", dark: "#3730A3" },
        saffron: { DEFAULT: "#F97316", light: "#FED7AA" },
      },
      animation: {
        pulse2: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 3s linear infinite",
      }
    },
  },
  plugins: [],
};
export default config;
