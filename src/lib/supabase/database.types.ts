export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_entries: {
        Row: {
          id: string
          user_id: string
          week_ending_date: string
          wins: Json
          work_summary: string | null
          results_contributed: string | null
          learnings: string | null
          challenges: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_ending_date: string
          wins?: Json
          work_summary?: string | null
          results_contributed?: string | null
          learnings?: string | null
          challenges?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_ending_date?: string
          wins?: Json
          work_summary?: string | null
          results_contributed?: string | null
          learnings?: string | null
          challenges?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type WeeklyEntry = Tables<'weekly_entries'> & {
  profiles: Tables<'profiles'> | null
}
export type Profile = Tables<'profiles'>