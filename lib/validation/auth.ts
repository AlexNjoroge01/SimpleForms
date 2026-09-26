import { z } from "zod"

// Shared by the auth forms (client) and the auth actions (server).
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
})

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"))
// bcrypt ignores bytes past 72, so cap there.
const newPassword = z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters")

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email,
  password: newPassword,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don’t match", path: ["confirm"] })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
