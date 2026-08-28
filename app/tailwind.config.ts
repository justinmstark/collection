import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f1923",
        "navy-light": "#1a2632",
        "navy-mid": "#243447",
        gold: "#c9a84c",
        "gold-light": "#e2c87e",
        "gold-dark": "#a07835",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
