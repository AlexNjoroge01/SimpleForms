import { Logo } from "@/components/site/logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-16">
      <Logo />
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-card">{children}</div>
    </main>
  )
}
