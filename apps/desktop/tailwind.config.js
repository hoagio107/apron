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
            background: "#f3f4f6", // Màu xám nhạt thanh khiết, dịu mắt trên màn hình Desktop (giúp nổi bật các thẻ card trắng #ffffff)
            content1: {
              DEFAULT: "#ffffff",
              foreground: "#111827",
            },
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
              50: "#041f13",
              100: "#083e26",
              200: "#0b5c3a",
              300: "#0f7b4d",
              400: "#139a60",
              500: "#2ec486",
              600: "#34d399",
              700: "#71c2a0",
              800: "#a1d7bf",
              900: "#e7f5ef",
              DEFAULT: "#2ec486",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#2ec486",
              foreground: "#ffffff",
            },
            focus: "#2ec486",
          },
        },
      },
    }),
    require('@tailwindcss/typography'),
  ],
};
