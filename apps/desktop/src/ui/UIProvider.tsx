import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function UIProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <ToastProvider 
          placement="top-right" 
          toastOffset={20}
          regionProps={{
            className: "fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2 w-full max-w-[400px]",
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
