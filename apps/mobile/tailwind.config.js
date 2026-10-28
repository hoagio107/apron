import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      aspectRatio: {
        '4/3': '4 / 3',
        '3/4': '3 / 4',
        '4/5': '4 / 5',
        '16/10': '16 / 10',
        '2/1': '2 / 1',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        hoverOpacity: 1, // Vô hiệu hoá hoàn toàn hiệu ứng giảm opacity khi hover cho toàn bộ button
      },
      themes: {
        light: {
          colors: {
            background: "#f8f9fa", // Màu xám nhạt thanh khiết, sáng sủa và dịu mắt (Clean Soft Neutral Light Gray)
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
              950: "#02100a",
              DEFAULT: "#139a60",
              foreground: "#ffffff",
            },
            success: {
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
              950: "#02100a",
              DEFAULT: "#139a60",
              foreground: "#ffffff",
            },
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
              950: "#02100a",
              DEFAULT: "#2ec486",
              foreground: "#ffffff",
            },
            success: {
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
              950: "#02100a",
              DEFAULT: "#2ec486",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
    typography,
  ],
};
