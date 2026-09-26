import { customAlphabet } from "nanoid"

// Public form slugs (Blueprint §5): 8 chars, URL-safe, no ambiguous characters
// (no 0/O, 1/l/I). 54^8 ≈ 7×10^13 combinations.
export const SLUG_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
export const SLUG_LENGTH = 8

export const newSlug = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH)

const slugPattern = new RegExp(`^[${SLUG_ALPHABET}]{${SLUG_LENGTH}}$`)

export function isValidSlug(s: string) {
  return slugPattern.test(s)
}
