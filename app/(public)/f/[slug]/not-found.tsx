import { RiQuestionLine } from "@remixicon/react"

import { FormStateMessage } from "@/components/public-form/form-state"
import { PublicFormShell } from "@/components/public-form/public-form"
import { DEFAULT_FORM_SETTINGS } from "@/lib/fields/types"

export default function PublicFormNotFound() {
  return (
    <PublicFormShell settings={DEFAULT_FORM_SETTINGS}>
      <FormStateMessage
        icon={RiQuestionLine}
        title="Form not found"
        message="This link doesn’t point to a form. It may have been mistyped, unpublished or deleted — check with the person who shared it."
      />
    </PublicFormShell>
  )
}
