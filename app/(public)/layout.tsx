// Public forms (/f/[slug]) — no auth, no app chrome. PublicFormShell handles the page theme.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>
}
