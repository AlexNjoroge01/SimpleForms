"use client"

import * as React from "react"
import { RiErrorWarningLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

// Route-level error boundary: friendly message + retry (§16 "every async action").
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="container-site flex min-h-[60svh] flex-col items-center justify-center py-16 text-center">
      <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-10 shadow-card" role="alert">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <RiErrorWarningLine className="size-[22px] text-brand" aria-hidden />
        </div>
        <h1 className="h3">Something went wrong</h1>
        <p className="max-w-sm">We couldn’t load this page. Check your connection and try again.</p>
        {error.digest && <p className="footnote">Reference: {error.digest}</p>}
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  )
}
