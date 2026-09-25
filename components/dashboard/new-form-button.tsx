"use client"

import { useFormStatus } from "react-dom"
import { RiAddLine, RiLoaderLine } from "@remixicon/react"

import { createBlankForm } from "@/app/(app)/forms/actions"
import { Button } from "@/components/ui/button"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? <RiLoaderLine className="animate-spin" data-icon="inline-start" /> : <RiAddLine data-icon="inline-start" />}
      {label}
    </Button>
  )
}

// Phase 1: creates a blank draft. Phase 4/8 route this through /forms/new (AI · Template · Blank).
export function NewFormButton({ label = "New form" }: { label?: string }) {
  return (
    <form action={createBlankForm}>
      <SubmitButton label={label} />
    </form>
  )
}
