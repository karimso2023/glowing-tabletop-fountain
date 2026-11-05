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
      analytics_session_days: {
        Row: {
          day: string
          pageviews: number
          session_id: string
        }
        Insert: {
          day: string
          pageviews?: number
          session_id: string
        }
        Update: {
          day?: string
          pageviews?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_session_days_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          checkout_started_at: string | null
          city: string | null
          country: string | null
          created_at: string
          first_day: string
          id: string
          identifiers_purged_at: string | null
          ip: unknown
          ip_hash: string | null
          is_bot: boolean
          landing_path: string | null
          last_pageview_id: string | null
          last_seen_at: string
          referrer_host: string | null
          referrer_path: string | null
          region: string | null
          token_hash: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          checkout_started_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_day?: string
          id?: string
          identifiers_purged_at?: string | null
          ip?: unknown
          ip_hash?: string | null
          is_bot?: boolean
          landing_path?: string | null
          last_pageview_id?: string | null
          last_seen_at?: string
          referrer_host?: string | null
          referrer_path?: string | null
          region?: string | null
          token_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          checkout_started_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_day?: string
          id?: string
          identifiers_purged_at?: string | null
          ip?: unknown
          ip_hash?: string | null
          is_bot?: boolean
          landing_path?: string | null
          last_pageview_id?: string | null
          last_seen_at?: string
          referrer_host?: string | null
          referrer_path?: string | null
          region?: string | null
          token_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
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
      order_attribution: {
        Row: {
          analytics_consent: boolean
          checkout_utm_campaign: string | null
          checkout_utm_content: string | null
          checkout_utm_medium: string | null
          checkout_utm_source: string | null
          city: string | null
          country: string | null
          created_at: string
          first_utm_campaign: string | null
          first_utm_content: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          identifiers_purged_at: string | null
          ip: unknown
          landing_path: string | null
          order_id: string
          referrer_host: string | null
          referrer_path: string | null
          region: string | null
          session_id: string | null
        }
        Insert: {
          analytics_consent?: boolean
          checkout_utm_campaign?: string | null
          checkout_utm_content?: string | null
          checkout_utm_medium?: string | null
          checkout_utm_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          identifiers_purged_at?: string | null
          ip?: unknown
          landing_path?: string | null
          order_id: string
          referrer_host?: string | null
          referrer_path?: string | null
          region?: string | null
          session_id?: string | null
        }
        Update: {
          analytics_consent?: boolean
          checkout_utm_campaign?: string | null
          checkout_utm_content?: string | null
          checkout_utm_medium?: string | null
          checkout_utm_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          identifiers_purged_at?: string | null
          ip?: unknown
          landing_path?: string | null
          order_id?: string
          referrer_host?: string | null
          referrer_path?: string | null
          region?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_attribution_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_attribution_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          last_error: string | null
          locked_until: string | null
          message_id: number | null
          next_attempt_at: string
          order_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          channel?: string
          created_at?: string
          last_error?: string | null
          locked_until?: string | null
          message_id?: number | null
          next_attempt_at?: string
          order_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          last_error?: string | null
          locked_until?: string | null
          message_id?: number | null
          next_attempt_at?: string
          order_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      admin_visitor_stats: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      analytics_purge_identifiers: { Args: never; Returns: undefined }
      analytics_track: {
        Args: {
          p_city: string
          p_country: string
          p_ip: string
          p_ip_hash: string
          p_is_bot: boolean
          p_kind: string
          p_landing: string
          p_pageview_id: string
          p_ref_host: string
          p_ref_path: string
          p_region: string
          p_token_hash: string
          p_utm_campaign: string
          p_utm_content: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: Json
      }
      claim_order_notifications: {
        Args: { p_limit: number }
        Returns: {
          attempts: number
          channel: string
          created_at: string
          last_error: string | null
          locked_until: string | null
          message_id: number | null
          next_attempt_at: string
          order_id: string
          sent_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
      enqueue_order_notification: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_order_staff: { Args: { _user_id: string }; Returns: boolean }
      record_order_attribution: {
        Args: {
          p_city: string
          p_consent: boolean
          p_country: string
          p_ip: string
          p_order_number: string
          p_region: string
          p_token_hash: string
          p_utm_campaign: string
          p_utm_content: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: Json
      }
      safe_inet: { Args: { p: string }; Returns: unknown }
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
