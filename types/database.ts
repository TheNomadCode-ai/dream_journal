// Auto-generated Supabase database types would normally go here.
// Run `supabase gen types typescript --project-id <ref>` to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          target_wake_time: string | null
          target_sleep_time: string | null
          onboarding_complete: boolean
          home_screen_installed: boolean
          tier: 'free' | 'pro' | 'lifetime'
          chronotype: string | null
          streak_freezes_remaining: number
          streak_freeze_reset_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          target_wake_time?: string | null
          target_sleep_time?: string | null
          onboarding_complete?: boolean
          home_screen_installed?: boolean
          tier?: 'free' | 'pro' | 'lifetime'
          chronotype?: string | null
          streak_freezes_remaining?: number
          streak_freeze_reset_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          target_wake_time?: string | null
          target_sleep_time?: string | null
          onboarding_complete?: boolean
          home_screen_installed?: boolean
          tier?: 'free' | 'pro' | 'lifetime'
          chronotype?: string | null
          streak_freezes_remaining?: number
          streak_freeze_reset_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'lifetime'
          tier: 'free' | 'pro' | 'lifetime'
          stripe_customer_id: string | null
          onboarded_at: string | null
          last_logged_date: string | null
          current_streak: number
          streak_freezes_remaining: number
          streak_freezes_reset_date: string | null
          auto_pattern_insight: string | null
          auto_pattern_generated_at: string | null
          wake_time: string | null
          target_wake_time: string | null
          target_sleep_time: string | null
          chronotype: string | null
          home_screen_installed: boolean
          wake_timezone: string
          timezone: string
          push_enabled: boolean
          onboarding_complete: boolean
          push_subscription: Json | null
          last_push_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'lifetime'
          tier?: 'free' | 'pro' | 'lifetime'
          stripe_customer_id?: string | null
          onboarded_at?: string | null
          last_logged_date?: string | null
          current_streak?: number
          streak_freezes_remaining?: number
          streak_freezes_reset_date?: string | null
          auto_pattern_insight?: string | null
          auto_pattern_generated_at?: string | null
          wake_time?: string | null
          target_wake_time?: string | null
          target_sleep_time?: string | null
          chronotype?: string | null
          home_screen_installed?: boolean
          wake_timezone?: string
          timezone?: string
          push_enabled?: boolean
          onboarding_complete?: boolean
          push_subscription?: Json | null
          last_push_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'lifetime'
          tier?: 'free' | 'pro' | 'lifetime'
          stripe_customer_id?: string | null
          onboarded_at?: string | null
          last_logged_date?: string | null
          current_streak?: number
          streak_freezes_remaining?: number
          streak_freezes_reset_date?: string | null
          auto_pattern_insight?: string | null
          auto_pattern_generated_at?: string | null
          wake_time?: string | null
          target_wake_time?: string | null
          target_sleep_time?: string | null
          chronotype?: string | null
          home_screen_installed?: boolean
          wake_timezone?: string
          timezone?: string
          push_enabled?: boolean
          onboarding_complete?: boolean
          push_subscription?: Json | null
          last_push_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wake_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          actual_wake_time: string
          actual_sleep_time: string | null
          sleep_quality: number | null
          morning_light: number | null
          minutes_from_target: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date?: string
          actual_wake_time: string
          actual_sleep_time?: string | null
          sleep_quality?: number | null
          morning_light?: number | null
          minutes_from_target?: number | null
          created_at?: string
        }
        Update: {
          actual_wake_time?: string
          actual_sleep_time?: string | null
          sleep_quality?: number | null
          morning_light?: number | null
          minutes_from_target?: number | null
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
          cover_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          cover_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          cover_color?: string
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
      get_user_tier: {
        Args: { user_id: string }
        Returns: string
      }
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
