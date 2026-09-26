import Link from "next/link"
import { RiAddLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

// Opens the new-form chooser (§9.3): Blank · Template.
export function NewFormButton({ label = "New form" }: { label?: string }) {
  return (
    <Button asChild size="lg">
      <Link href="/forms/new">
        <RiAddLine data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  )
}
