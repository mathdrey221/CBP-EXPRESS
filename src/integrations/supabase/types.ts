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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alertes_agents: {
        Row: {
          colis_id: string | null
          created_at: string
          created_by: string | null
          id: string
          lu: boolean
          message: string
          type: string
          ville: string
          ville_origine: string | null
        }
        Insert: {
          colis_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lu?: boolean
          message: string
          type?: string
          ville: string
          ville_origine?: string | null
        }
        Update: {
          colis_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lu?: boolean
          message?: string
          type?: string
          ville?: string
          ville_origine?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_agents_colis_id_fkey"
            columns: ["colis_id"]
            isOneToOne: false
            referencedRelation: "colis"
            referencedColumns: ["id"]
          },
        ]
      }
      colis: {
        Row: {
          archive: boolean
          archive_at: string | null
          arrive_at: string | null
          contenu: string | null
          created_at: string
          created_by: string | null
          dest_nom: string
          dest_prenom: string | null
          dest_tel: string
          dest_ville: string
          exp_nom: string
          exp_prenom: string | null
          exp_tel: string
          exp_ville: string
          frais_livraison: number
          id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"] | null
          montant: number
          numero_suivi: string
          paye: boolean
          photo_url: string | null
          poids: number | null
          point_relais_id: string | null
          relance_envoyee: boolean
          retire_at: string | null
          reverse: boolean
          source: string
          statut: Database["public"]["Enums"]["colis_statut"]
          updated_at: string
          ville_depot: string
          ville_retrait: string
        }
        Insert: {
          archive?: boolean
          archive_at?: string | null
          arrive_at?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          dest_nom: string
          dest_prenom?: string | null
          dest_tel: string
          dest_ville: string
          exp_nom: string
          exp_prenom?: string | null
          exp_tel: string
          exp_ville: string
          frais_livraison?: number
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant?: number
          numero_suivi: string
          paye?: boolean
          photo_url?: string | null
          poids?: number | null
          point_relais_id?: string | null
          relance_envoyee?: boolean
          retire_at?: string | null
          reverse?: boolean
          source?: string
          statut?: Database["public"]["Enums"]["colis_statut"]
          updated_at?: string
          ville_depot: string
          ville_retrait: string
        }
        Update: {
          archive?: boolean
          archive_at?: string | null
          arrive_at?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          dest_nom?: string
          dest_prenom?: string | null
          dest_tel?: string
          dest_ville?: string
          exp_nom?: string
          exp_prenom?: string | null
          exp_tel?: string
          exp_ville?: string
          frais_livraison?: number
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant?: number
          numero_suivi?: string
          paye?: boolean
          photo_url?: string | null
          poids?: number | null
          point_relais_id?: string | null
          relance_envoyee?: boolean
          retire_at?: string | null
          reverse?: boolean
          source?: string
          statut?: Database["public"]["Enums"]["colis_statut"]
          updated_at?: string
          ville_depot?: string
          ville_retrait?: string
        }
        Relationships: [
          {
            foreignKeyName: "colis_point_relais_id_fkey"
            columns: ["point_relais_id"]
            isOneToOne: false
            referencedRelation: "points_relais"
            referencedColumns: ["id"]
          },
        ]
      }
      colis_events: {
        Row: {
          auteur: string | null
          colis_id: string
          commentaire: string | null
          created_at: string
          id: string
          statut: Database["public"]["Enums"]["colis_statut"]
        }
        Insert: {
          auteur?: string | null
          colis_id: string
          commentaire?: string | null
          created_at?: string
          id?: string
          statut: Database["public"]["Enums"]["colis_statut"]
        }
        Update: {
          auteur?: string | null
          colis_id?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          statut?: Database["public"]["Enums"]["colis_statut"]
        }
        Relationships: [
          {
            foreignKeyName: "colis_events_colis_id_fkey"
            columns: ["colis_id"]
            isOneToOne: false
            referencedRelation: "colis"
            referencedColumns: ["id"]
          },
        ]
      }
      colis_photos: {
        Row: {
          colis_id: string
          created_at: string
          created_by: string | null
          id: string
          path: string
        }
        Insert: {
          colis_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          path: string
        }
        Update: {
          colis_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "colis_photos_colis_id_fkey"
            columns: ["colis_id"]
            isOneToOne: false
            referencedRelation: "colis"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          dernier_message: string | null
          id: string
          mode: string
          nom: string | null
          telephone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dernier_message?: string | null
          id?: string
          mode?: string
          nom?: string | null
          telephone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dernier_message?: string | null
          id?: string
          mode?: string
          nom?: string | null
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          canal: Database["public"]["Enums"]["canal_notif"]
          colis_id: string | null
          created_at: string
          destinataire_tel: string
          erreur: string | null
          id: string
          message: string
          statut: string
          template: string
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal_notif"]
          colis_id?: string | null
          created_at?: string
          destinataire_tel: string
          erreur?: string | null
          id?: string
          message: string
          statut?: string
          template: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_notif"]
          colis_id?: string | null
          created_at?: string
          destinataire_tel?: string
          erreur?: string | null
          id?: string
          message?: string
          statut?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_colis_id_fkey"
            columns: ["colis_id"]
            isOneToOne: false
            referencedRelation: "colis"
            referencedColumns: ["id"]
          },
        ]
      }
      points_relais: {
        Row: {
          actif: boolean
          adresse: string
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          telephone: string | null
          ville: string
        }
        Insert: {
          actif?: boolean
          adresse: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          telephone?: string | null
          ville: string
        }
        Update: {
          actif?: boolean
          adresse?: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          telephone?: string | null
          ville?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          actif: boolean
          created_at: string
          full_name: string
          id: string
          point_relais_id: string | null
          telephone: string | null
          ville: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          full_name?: string
          id: string
          point_relais_id?: string | null
          telephone?: string | null
          ville?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          full_name?: string
          id?: string
          point_relais_id?: string | null
          telephone?: string | null
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_point_relais_id_fkey"
            columns: ["point_relais_id"]
            isOneToOne: false
            referencedRelation: "points_relais"
            referencedColumns: ["id"]
          },
        ]
      }
      reversements: {
        Row: {
          created_at: string
          effectue: boolean
          id: string
          marchand_nom: string
          marchand_tel: string
          montant: number
          moyen: string
          nb_colis: number
          periode_debut: string
          periode_fin: string
        }
        Insert: {
          created_at?: string
          effectue?: boolean
          id?: string
          marchand_nom: string
          marchand_tel: string
          montant: number
          moyen?: string
          nb_colis?: number
          periode_debut: string
          periode_fin: string
        }
        Update: {
          created_at?: string
          effectue?: boolean
          id?: string
          marchand_nom?: string
          marchand_tel?: string
          montant?: number
          moyen?: string
          nb_colis?: number
          periode_debut?: string
          periode_fin?: string
        }
        Relationships: []
      }
      tarifs: {
        Row: {
          id: string
          prix: number
          ville_arrivee: string
          ville_depart: string
        }
        Insert: {
          id?: string
          prix: number
          ville_arrivee: string
          ville_depart: string
        }
        Update: {
          id?: string
          prix?: number
          ville_arrivee?: string
          ville_depart?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          priorite: string
          statut: string
          sujet: string
          telephone: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          priorite?: string
          statut?: string
          sujet: string
          telephone: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          priorite?: string
          statut?: string
          sujet?: string
          telephone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      generer_numero_suivi: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_actif: { Args: { _user_id: string }; Returns: boolean }
      my_ville: { Args: { _user_id: string }; Returns: string }
      suivi_public: {
        Args: { _numero: string }
        Returns: {
          arrive_at: string
          created_at: string
          dest_nom: string
          exp_nom: string
          montant: number
          numero_suivi: string
          point_adresse: string
          point_lat: number
          point_lng: number
          point_nom: string
          point_tel: string
          point_ville: string
          retire_at: string
          statut: Database["public"]["Enums"]["colis_statut"]
          ville_depot: string
          ville_retrait: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "comptable"
      canal_notif: "whatsapp" | "sms"
      colis_statut:
        | "en_attente_depot"
        | "depose"
        | "en_transit"
        | "arrive_point_relais"
        | "notifie_client"
        | "retire"
        | "retour_expediteur"
      mode_paiement: "especes" | "mtn_momo" | "moov_money"
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
    Enums: {
      app_role: ["admin", "agent", "comptable"],
      canal_notif: ["whatsapp", "sms"],
      colis_statut: [
        "en_attente_depot",
        "depose",
        "en_transit",
        "arrive_point_relais",
        "notifie_client",
        "retire",
        "retour_expediteur",
      ],
      mode_paiement: ["especes", "mtn_momo", "moov_money"],
    },
  },
} as const
