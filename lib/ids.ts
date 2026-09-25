import { customAlphabet } from "nanoid"

// Stable ids for fields and options (Blueprint §6: never change once created).
export const newId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10)
