import { Footer } from "@/components/site/footer"
import { Navbar } from "@/components/site/navbar"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
