import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mk: {
          pink: "#ec4899",
          pinkDark: "#db2777",
          pinkSoft: "#fdf2f8",
          black: "#0f0f12",
          ink: "#18181b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
