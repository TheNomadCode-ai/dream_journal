export interface Notebook {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_color: string
  created_at: string
  updated_at: string
  dream_count?: number
}

export interface NotebookDream {
  id: string
  title: string | null
  body_text: string | null
  mood_score: number | null
  lucid: boolean
  date_of_dream: string
  created_at: string
}

export interface NotebookListResponse {
  notebooks: Notebook[]
}

export interface NotebookDetailResponse {
  notebook: Notebook
  dreams: NotebookDream[]
}

export interface NotebookErrorResponse {
  error: string
}
