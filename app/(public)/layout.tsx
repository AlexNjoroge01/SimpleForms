// Public forms (/f/[slug]) — minimal chrome, no auth. Built in Phase 3.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-svh px-4 py-12">{children}</main>
}
