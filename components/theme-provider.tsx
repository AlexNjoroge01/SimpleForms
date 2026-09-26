"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Light everywhere (Design.md: pale-green page, dark only in DarkSection blocks).
// forcedTheme ignores any stale `theme=dark` left in localStorage — without it,
// next-themes would put `.dark` on <html> and flip every token site-wide.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
