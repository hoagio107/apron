import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "#e7f5ef",
              100: "#d0ebdf",
              200: "#a1d7bf",
              300: "#71c2a0",
              400: "#42ae80",
              500: "#139a60",
              600: "#0f7b4d",
              700: "#0b5c3a",
              800: "#083e26",
              900: "#041f13",
              DEFAULT: "#139a60",
              foreground: "#ffffff",
            },
            focus: "#139a60",
          },
        },
        dark: {
          colors: {
            primary: {
              50: "#e7f5ef",
              100: "#d0ebdf",
              200: "#a1d7bf",
              300: "#71c2a0",
              400: "#42ae80",
              500: "#139a60",
              600: "#0f7b4d",
              700: "#0b5c3a",
              800: "#083e26",
              900: "#041f13",
              DEFAULT: "#139a60",
              foreground: "#ffffff",
            },
            focus: "#139a60",
          },
        },
      },
    }),
  ],
};
