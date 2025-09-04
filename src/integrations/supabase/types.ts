export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_secrets: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value_hash?: string
        }
        Relationships: []
      }
      book_categories: {
        Row: {
          book_id: string
          category_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          book_id: string
          category_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          book_id?: string
          category_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_categories_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_categories_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_realtime_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          authors: string[]
          cover_path: string | null
          created_at: string | null
          description: string | null
          edition: string | null
          id: string
          isbn: string | null
          language: string | null
          level_id: string | null
          publication_year: number | null
          publisher: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          authors?: string[]
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          level_id?: string | null
          publication_year?: number | null
          publisher?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          authors?: string[]
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          level_id?: string | null
          publication_year?: number | null
          publisher?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      borrow_requests: {
        Row: {
          admin_notes: string | null
          affiliation: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          desired_duration_days: number
          email: string
          id: string
          id_number: string
          membership_id: string | null
          phone: string | null
          pickup_location: string
          purpose: string | null
          requested_items: Json
          requester_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliation: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          desired_duration_days?: number
          email: string
          id?: string
          id_number: string
          membership_id?: string | null
          phone?: string | null
          pickup_location: string
          purpose?: string | null
          requested_items?: Json
          requester_name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliation?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          desired_duration_days?: number
          email?: string
          id?: string
          id_number?: string
          membership_id?: string | null
          phone?: string | null
          pickup_location?: string
          purpose?: string | null
          requested_items?: Json
          requester_name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      copies: {
        Row: {
          acquisition_date: string | null
          barcode: string
          book_id: string
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          acquisition_date?: string | null
          barcode: string
          book_id: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string | null
          barcode?: string
          book_id?: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copies_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_realtime_view"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          borrow_request_id: string | null
          borrower_email: string
          borrower_name: string
          borrower_phone: string | null
          copy_id: string
          created_at: string | null
          due_date: string
          id: string
          issued_by: string
          issued_date: string
          late_fee: number | null
          notes: string | null
          renewal_count: number | null
          returned_date: string | null
          returned_to: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          borrow_request_id?: string | null
          borrower_email: string
          borrower_name: string
          borrower_phone?: string | null
          copy_id: string
          created_at?: string | null
          due_date: string
          id?: string
          issued_by: string
          issued_date?: string
          late_fee?: number | null
          notes?: string | null
          renewal_count?: number | null
          returned_date?: string | null
          returned_to?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          borrow_request_id?: string | null
          borrower_email?: string
          borrower_name?: string
          borrower_phone?: string | null
          copy_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          issued_by?: string
          issued_date?: string
          late_fee?: number | null
          notes?: string | null
          renewal_count?: number | null
          returned_date?: string | null
          returned_to?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrow_request_id_fkey"
            columns: ["borrow_request_id"]
            isOneToOne: false
            referencedRelation: "borrow_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      books_realtime_view: {
        Row: {
          authors: string[] | null
          available_count: number | null
          categories: string[] | null
          cover_path: string | null
          created_at: string | null
          description: string | null
          id: string | null
          level: string | null
          title: string | null
          total_copies: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      queue_notification: {
        Args: {
          email_content: string
          email_subject: string
          email_to: string
          notification_type: string
          payload_data?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
