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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      integration_status: {
        Row: {
          detail: string | null
          key: string
          last_checked_at: string | null
          verified_at: string | null
        }
        Insert: {
          detail?: string | null
          key: string
          last_checked_at?: string | null
          verified_at?: string | null
        }
        Update: {
          detail?: string | null
          key?: string
          last_checked_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      order_outbox: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          locked_until: string | null
          next_attempt_at: string
          order_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          order_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          order_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_outbox_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string
          created_at: string
          customer_name: string
          customer_notes: string | null
          discount_amount: number
          full_address: string
          governorate: string
          id: string
          idempotency_key: string
          ip_hash: string | null
          order_number: string
          order_status: string
          payment_method: string
          phone: string
          product_id: string
          product_name: string
          quantity: number
          selected_color: string | null
          selected_size: string | null
          shipping_fee: number
          sync_status: string
          total_price: number
          unit_price: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          city: string
          created_at?: string
          customer_name: string
          customer_notes?: string | null
          discount_amount?: number
          full_address: string
          governorate: string
          id?: string
          idempotency_key: string
          ip_hash?: string | null
          order_number: string
          order_status?: string
          payment_method?: string
          phone: string
          product_id: string
          product_name: string
          quantity: number
          selected_color?: string | null
          selected_size?: string | null
          shipping_fee: number
          sync_status?: string
          total_price: number
          unit_price: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          customer_name?: string
          customer_notes?: string | null
          discount_amount?: number
          full_address?: string
          governorate?: string
          id?: string
          idempotency_key?: string
          ip_hash?: string | null
          order_number?: string
          order_status?: string
          payment_method?: string
          phone?: string
          product_id?: string
          product_name?: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          shipping_fee?: number
          sync_status?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      store_config: {
        Row: {
          compare_at_price: number | null
          flat_shipping_fee: number | null
          id: number
          max_quantity: number
          product_id: string
          product_name: string
          shipping_rates: Json | null
          store_name: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          flat_shipping_fee?: number | null
          id?: number
          max_quantity?: number
          product_id?: string
          product_name?: string
          shipping_rates?: Json | null
          store_name?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          flat_shipping_fee?: number | null
          id?: number
          max_quantity?: number
          product_id?: string
          product_name?: string
          shipping_rates?: Json | null
          store_name?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_outbox: {
        Args: { p_limit: number }
        Returns: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          locked_until: string | null
          next_attempt_at: string
          order_id: string
          sent_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_cod_order: {
        Args: {
          p_address: string
          p_city: string
          p_governorate: string
          p_idempotency_key: string
          p_ip_hash: string
          p_name: string
          p_notes: string
          p_phone: string
          p_quantity: number
          p_utm_campaign: string
          p_utm_content: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_order_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
