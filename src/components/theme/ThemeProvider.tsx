'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeProps = {
    attribute: "class" as const,
    defaultTheme: "system" as const,
    enableSystem: true,
    disableTransitionOnChange: true,
  };

  return (
    <NextThemesProvider {...themeProps}>
      {children}
    </NextThemesProvider>
  );
}