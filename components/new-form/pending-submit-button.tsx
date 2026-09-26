"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { RiArrowRightLine, RiLoaderLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

/** Submit button that shows a spinner while its parent <form action> runs. */
export function PendingSubmitButton({
  children,
  arrow,
  ...props
}: React.ComponentProps<typeof Button> & { arrow?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending} {...props}>
      {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
      {children}
      {arrow && !pending && <RiArrowRightLine data-icon="inline-end" />}
    </Button>
  )
}
