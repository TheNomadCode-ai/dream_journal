import { z } from 'zod'

export const notebookColorSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{6}$/, 'Color must be a 6-digit hex value without #')

export const createNotebookSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  cover_color: notebookColorSchema.optional(),
})

export const updateNotebookSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    cover_color: notebookColorSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const notebookDreamLinkSchema = z.object({
  dream_id: z.string().uuid(),
})
