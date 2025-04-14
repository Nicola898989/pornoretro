export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      retro_actions: {
        Row: {
          assignee: string | null
          completed: boolean
          created_at: string
          id: string
          linked_card_content: string | null
          linked_card_id: string | null
          linked_card_type: string | null
          retro_id: string | null
          text: string
        }
        Insert: {
          assignee?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          linked_card_content?: string | null
          linked_card_id?: string | null
          linked_card_type?: string | null
          retro_id?: string | null
          text: string
        }
        Update: {
          assignee?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          linked_card_content?: string | null
          linked_card_id?: string | null
          linked_card_type?: string | null
          retro_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "retro_actions_linked_card_id_fkey"
            columns: ["linked_card_id"]
            isOneToOne: false
            referencedRelation: "retro_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retro_actions_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retrospectives"
            referencedColumns: ["id"]
          },
        ]
      }
      retro_card_groups: {
        Row: {
          created_at: string
          id: string
          retro_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          retro_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          retro_id?: string
          title?: string
        }
        Relationships: []
      }
      retro_card_votes: {
        Row: {
          card_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retro_card_votes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "retro_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      retro_cards: {
        Row: {
          author: string
          content: string
          created_at: string
          group_id: string | null
          id: string
          retro_id: string
          type: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          retro_id: string
          type: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          retro_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "retro_cards_retro_id_fkey"
            columns: ["retro_id"]
            isOneToOne: false
            referencedRelation: "retrospectives"
            referencedColumns: ["id"]
          },
        ]
      }
      retro_comments: {
        Row: {
          author: string
          card_id: string | null
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author: string
          card_id?: string | null
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author?: string
          card_id?: string | null
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retro_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "retro_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      retrospectives: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_anonymous: boolean | null
          name: string
          team: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id: string
          is_anonymous?: boolean | null
          name: string
          team: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_anonymous?: boolean | null
          name?: string
          team?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
