import { z } from 'zod'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const isoDate = z
  .string({ required_error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine(
    (d) => {
      const parsed = new Date(d)
      return !isNaN(parsed.getTime())
    },
    { message: 'Date is not a valid calendar date' }
  )
  .refine(
    (d) => new Date(d) <= new Date(),
    { message: 'Date of dream cannot be in the future' }
  )

const moodScore = z
  .union(
    [z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)],
    { errorMap: () => ({ message: 'Mood score must be an integer between 1 and 5' }) }
  )
  .nullable()
  .optional()

const tagIdsField = z
  .array(
    z.string({ invalid_type_error: 'Each tag ID must be a string' })
     .uuid({ message: 'Each tag ID must be a valid UUID' }),
    { invalid_type_error: 'tag_ids must be an array' }
  )
  .max(20, { message: 'Maximum 20 tags per dream' })
  .optional()
  .default([])

// Tiptap JSON: minimal shape validation — we don't deep-validate the node tree
const tiptapJsonSchema = z
  .record(z.unknown())
  .refine(
    (v) => typeof v['type'] === 'string',
    { message: 'body_json must be a valid Tiptap document (missing "type" field)' }
  )

// ─── Create Dream ──────────────────────────────────────────────────────────────

export const createDreamSchema = z.object({
  title: z
    .string({ invalid_type_error: 'Title must be a string' })
    .max(200, { message: 'Title cannot exceed 200 characters' })
    .nullable()
    .optional(),

  body_json: tiptapJsonSchema,

  mood_score: moodScore,

  lucid: z
    .boolean({ invalid_type_error: 'lucid must be a boolean' })
    .optional()
    .default(false),

  date_of_dream: isoDate,

  tag_ids: tagIdsField,
})

export type CreateDreamInput = z.infer<typeof createDreamSchema>

// ─── Update Dream ──────────────────────────────────────────────────────────────

export const updateDreamSchema = z
  .object({
    title: z
      .string({ invalid_type_error: 'Title must be a string' })
      .max(200, { message: 'Title cannot exceed 200 characters' })
      .nullable()
      .optional(),

    body_json: tiptapJsonSchema.optional(),

    mood_score: moodScore,

    lucid: z
      .boolean({ invalid_type_error: 'lucid must be a boolean' })
      .optional(),

    date_of_dream: isoDate.optional(),

    tag_ids: tagIdsField,
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    { message: 'At least one field must be provided for update' }
  )

export type UpdateDreamInput = z.infer<typeof updateDreamSchema>

// ─── Search Query ──────────────────────────────────────────────────────────────

export const searchSchema = z.object({
  q: z
    .string({ invalid_type_error: 'Query must be a string' })
    .max(100, { message: 'Search query cannot exceed 100 characters' })
    // Sanitise: strip characters that could break tsquery
    .transform((s) => s.replace(/[&|!():*<>]/g, ' ').trim())
    .optional()
    .default(''),

  page: z
    .string()
    .optional()
    .default('1')
    .transform((s) => parseInt(s, 10))
    .pipe(
      z
        .number({ invalid_type_error: 'Page must be a number' })
        .int({ message: 'Page must be an integer' })
        .positive({ message: 'Page must be a positive integer' })
    ),

  per_page: z
    .enum(['10', '20', '50'], {
      errorMap: () => ({ message: 'per_page must be 10, 20, or 50' }),
    })
    .optional()
    .default('20')
    .transform((s) => parseInt(s, 10) as 10 | 20 | 50),
})

export type SearchInput = z.infer<typeof searchSchema>
