import { z } from 'zod'

// ─── Shared ────────────────────────────────────────────────────────────────────

const emailField = z
  .string({ required_error: 'Email address is required' })
  .email({ message: 'Please enter a valid email address' })
  .max(255, { message: 'Email address is too long' })
  .transform((s) => s.toLowerCase().trim())

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password cannot exceed 128 characters' })
  .refine(
    (pw) => /[A-Z]/.test(pw),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (pw) => /[0-9]/.test(pw),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (pw) => /[^A-Za-z0-9]/.test(pw),
    { message: 'Password must contain at least one special character (!@#$%^&* etc.)' }
  )

// ─── Sign Up ───────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: emailField,

  password: passwordField,

  display_name: z
    .string({ required_error: 'Display name is required' })
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(50, { message: 'Display name cannot exceed 50 characters' })
    .regex(
      /^[a-zA-Z0-9 _\-'.]+$/,
      { message: 'Display name can only contain letters, numbers, spaces, and _ - \' .' }
    )
    .transform((s) => s.trim()),
})

export type SignupInput = z.infer<typeof signupSchema>

// ─── Login ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' }),
})

export type LoginInput = z.infer<typeof loginSchema>

// ─── Magic Link ────────────────────────────────────────────────────────────────

export const magicLinkSchema = z.object({
  email: emailField,
})

export type MagicLinkInput = z.infer<typeof magicLinkSchema>

// ─── Update Profile ────────────────────────────────────────────────────────────

export const updateProfileSchema = z
  .object({
    display_name: z
      .string({ invalid_type_error: 'Display name must be a string' })
      .min(2, { message: 'Display name must be at least 2 characters' })
      .max(50, { message: 'Display name cannot exceed 50 characters' })
      .regex(
        /^[a-zA-Z0-9 _\-'.]+$/,
        { message: 'Display name can only contain letters, numbers, spaces, and _ - \' .' }
      )
      .transform((s) => s.trim())
      .optional(),

    avatar_url: z
      .string({ invalid_type_error: 'Avatar URL must be a string' })
      .url({ message: 'Avatar URL must be a valid URL' })
      .max(2048, { message: 'Avatar URL is too long' })
      .nullable()
      .optional(),
  })
  .refine(
    (v) => Object.keys(v).filter((k) => v[k as keyof typeof v] !== undefined).length > 0,
    { message: 'At least one field must be provided for profile update' }
  )

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ─── Change Password ───────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    current_password: z
      .string({ required_error: 'Current password is required' })
      .min(1, { message: 'Current password is required' }),

    new_password: passwordField,

    confirm_password: z
      .string({ required_error: 'Please confirm your new password' })
      .min(1, { message: 'Please confirm your new password' }),
  })
  .refine(
    (v) => v.new_password === v.confirm_password,
    {
      message: 'Passwords do not match',
      path: ['confirm_password'],
    }
  )
  .refine(
    (v) => v.current_password !== v.new_password,
    {
      message: 'New password must be different from your current password',
      path: ['new_password'],
    }
  )

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
