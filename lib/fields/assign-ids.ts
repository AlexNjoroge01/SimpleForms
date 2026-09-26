import { newId } from "@/lib/ids"
import type { Field, FieldOption } from "@/lib/fields/types"

/** A field as authored by a template: ids optional. */
export type FieldInput = Omit<Field, "id" | "options"> & {
  id?: string
  options?: (Omit<FieldOption, "id"> & { id?: string })[]
}

const ID = /^[a-z0-9]{1,32}$/i

/**
 * Assigns stable ids (§6: never change once created). Ids listed in `keep`
 * are preserved; any other, missing, malformed or duplicate id gets a fresh one.
 */
export function assignIds(fields: FieldInput[], keep: ReadonlySet<string> = new Set()): Field[] {
  const used = new Set<string>()
  const take = (candidate: string | undefined, allowed: (id: string) => boolean) => {
    const id = candidate && ID.test(candidate) && allowed(candidate) && !used.has(candidate) ? candidate : newId()
    used.add(id)
    return id
  }

  return fields.map((f) => {
    const optionIds = new Set<string>()
    const options = f.options?.map((o) => {
      const id = o.id && ID.test(o.id) && !optionIds.has(o.id) ? o.id : newId()
      optionIds.add(id)
      return { id, label: o.label }
    })
    return { ...f, id: take(f.id, (id) => keep.has(id)), ...(options ? { options } : {}) } as Field
  })
}
