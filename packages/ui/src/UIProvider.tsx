import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export interface UIProviderProps {
  children: React.ReactNode;
  toastPlacement?: "top-right" | "top-center";
}

export function UIProvider({ children, toastPlacement = "top-right" }: UIProviderProps) {
  const isCenter = toastPlacement === "top-center";
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <ToastProvider
          placement={toastPlacement}
          toastOffset={isCenter ? 16 : 20}
          regionProps={{
            className: isCenter
              ? "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-[92vw] sm:max-w-[400px]"
              : "fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2 w-full max-w-[400px]",
          }}
          toastProps={{
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            classNames: {
              base: "pointer-events-auto shadow-xl backdrop-blur-md rounded-2xl",
            },
          }}
        />
        {children}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
