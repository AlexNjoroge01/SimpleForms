import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, Manrope } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "SimpleForms — Beautiful forms for Kenya, built with AI",
    template: "%s · SimpleForms",
  },
  description:
    "Describe the form you need and SimpleForms builds it. Share by link or QR, collect responses, export to CSV.",
}

export const viewport: Viewport = {
  themeColor: "#E8F1E3",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", manrope.variable, jetbrainsMono.variable)}
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
