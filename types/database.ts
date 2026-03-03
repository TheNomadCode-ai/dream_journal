// Auto-generated Supabase database types would normally go here.
// Run `supabase gen types typescript --project-id <ref>` to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dreams: {
        Row: {
          id: string
          user_id: string
          title: string | null
          body_json: Json
          body_text: string | null
          mood_score: number | null
          lucid: boolean
          date_of_dream: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          body_json?: Json
          body_text?: string | null
          mood_score?: number | null
          lucid?: boolean
          date_of_dream: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string | null
          body_json?: Json
          body_text?: string | null
          mood_score?: number | null
          lucid?: boolean
          date_of_dream?: string
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      dream_tags: {
        Row: {
          dream_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          dream_id: string
          tag_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      notebooks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dream_notebooks: {
        Row: {
          dream_id: string
          notebook_id: string
          created_at: string
        }
        Insert: {
          dream_id: string
          notebook_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      search_dreams: {
        Args: { p_user_id: string; p_query: string; p_limit: number; p_offset: number }
        Returns: Array<{
          id: string
          title: string | null
          snippet: string
          date_of_dream: string
          mood_score: number | null
          lucid: boolean
        }>
      }
    }
    Enums: Record<string, never>
  }
}
