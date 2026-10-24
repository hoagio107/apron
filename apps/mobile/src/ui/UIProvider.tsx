import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <ToastProvider 
          placement="top-center" 
          toastOffset={16}
          regionProps={{
            className: "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2 w-full max-w-[92vw] sm:max-w-[400px]",
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
