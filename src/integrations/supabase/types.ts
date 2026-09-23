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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      observation_photos: {
        Row: {
          created_at: string
          id: string
          observation_id: string
          photo_type: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation_id: string
          photo_type?: string
          photo_url: string
        }
        Update: {
          created_at?: string
          id?: string
          observation_id?: string
          photo_type?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_photos_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          area_id: string | null
          common_name: string
          count: number
          created_at: string
          family: string | null
          flower_present: boolean
          fruit_present: boolean
          girth: number | null
          gps_accuracy: number | null
          growth_form: string | null
          health: string | null
          height: number | null
          id: string
          identification_status: string
          latitude: number | null
          local_name: string | null
          longitude: number | null
          map_x: number | null
          map_y: number | null
          native_status: string | null
          plant_id: string | null
          remarks: string | null
          scientific_name: string | null
          survey_date: string
          survey_id: string
          survey_time: string
          surveyor: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          common_name: string
          count?: number
          created_at?: string
          family?: string | null
          flower_present?: boolean
          fruit_present?: boolean
          girth?: number | null
          gps_accuracy?: number | null
          growth_form?: string | null
          health?: string | null
          height?: number | null
          id?: string
          identification_status?: string
          latitude?: number | null
          local_name?: string | null
          longitude?: number | null
          map_x?: number | null
          map_y?: number | null
          native_status?: string | null
          plant_id?: string | null
          remarks?: string | null
          scientific_name?: string | null
          survey_date?: string
          survey_id: string
          survey_time?: string
          surveyor?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          common_name?: string
          count?: number
          created_at?: string
          family?: string | null
          flower_present?: boolean
          fruit_present?: boolean
          girth?: number | null
          gps_accuracy?: number | null
          growth_form?: string | null
          health?: string | null
          height?: number | null
          id?: string
          identification_status?: string
          latitude?: number | null
          local_name?: string | null
          longitude?: number | null
          map_x?: number | null
          map_y?: number | null
          native_status?: string | null
          plant_id?: string | null
          remarks?: string | null
          scientific_name?: string | null
          survey_date?: string
          survey_id?: string
          survey_time?: string
          surveyor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "survey_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plant_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_master: {
        Row: {
          common_name: string
          common_uses: string | null
          created_at: string
          description: string | null
          ecological_information: string | null
          family: string | null
          flowering_season: string | null
          fruiting_season: string | null
          genus: string | null
          id: string
          local_names: string | null
          native_status: string | null
          plant_type: string | null
          reference_image: string | null
          scientific_name: string
          species: string | null
        }
        Insert: {
          common_name: string
          common_uses?: string | null
          created_at?: string
          description?: string | null
          ecological_information?: string | null
          family?: string | null
          flowering_season?: string | null
          fruiting_season?: string | null
          genus?: string | null
          id?: string
          local_names?: string | null
          native_status?: string | null
          plant_type?: string | null
          reference_image?: string | null
          scientific_name?: string
          species?: string | null
        }
        Update: {
          common_name?: string
          common_uses?: string | null
          created_at?: string
          description?: string | null
          ecological_information?: string | null
          family?: string | null
          flowering_season?: string | null
          fruiting_season?: string | null
          genus?: string | null
          id?: string
          local_names?: string | null
          native_status?: string | null
          plant_type?: string | null
          reference_image?: string | null
          scientific_name?: string
          species?: string | null
        }
        Relationships: []
      }
      survey_areas: {
        Row: {
          area_name: string
          created_at: string
          id: string
          status: string
          survey_id: string
        }
        Insert: {
          area_name: string
          created_at?: string
          id?: string
          status?: string
          survey_id: string
        }
        Update: {
          area_name?: string
          created_at?: string
          id?: string
          status?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_areas_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          campus_name: string
          city: string
          created_at: string
          id: string
          institution_name: string
          map_url: string | null
          survey_date: string
          survey_name: string
          survey_type: string
          surveyor: string
          updated_at: string
        }
        Insert: {
          campus_name?: string
          city?: string
          created_at?: string
          id?: string
          institution_name: string
          map_url?: string | null
          survey_date?: string
          survey_name: string
          survey_type?: string
          surveyor?: string
          updated_at?: string
        }
        Update: {
          campus_name?: string
          city?: string
          created_at?: string
          id?: string
          institution_name?: string
          map_url?: string | null
          survey_date?: string
          survey_name?: string
          survey_type?: string
          surveyor?: string
          updated_at?: string
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
    Enums: {},
  },
} as const
