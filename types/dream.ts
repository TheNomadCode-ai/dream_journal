export interface Dream {
  id: string
  user_id: string
  title: string | null
  body_json: Record<string, unknown> // Tiptap JSON
  body_text: string | null           // Plain text extracted for search
  mood_score: 1 | 2 | 3 | 4 | 5 | null
  lucid: boolean
  date_of_dream: string              // ISO date string (YYYY-MM-DD)
  search_vec: string | null          // tsvector — only set by DB
  created_at: string
  updated_at: string
  deleted_at: string | null
  tags?: Tag[]
  notebook_ids?: string[]
}

export interface Tag {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface CreateDreamInput {
  title?: string | null
  body_json: Record<string, unknown>
  mood_score?: 1 | 2 | 3 | 4 | 5 | null
  lucid?: boolean
  date_of_dream: string
  tag_ids?: string[]
}

export interface UpdateDreamInput {
  title?: string | null
  body_json?: Record<string, unknown>
  mood_score?: 1 | 2 | 3 | 4 | 5 | null
  lucid?: boolean
  date_of_dream?: string
  tag_ids?: string[]
}

export interface DreamListResponse {
  dreams: Dream[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface DreamSearchResult extends Dream {
  headline: string | null // ts_headline snippet
  rank: number
}

export interface DreamSearchResponse {
  results: DreamSearchResult[]
  query: string
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  error: string
  code?: string
  details?: Record<string, unknown>
}
