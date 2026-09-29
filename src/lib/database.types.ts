// Generated from the database schema (Supabase type generator); helper generics trimmed.
// Regenerate after every migration: npx supabase gen types typescript --project-id <ref>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      access_codes: {
        Row: { code_hash: string; created_at: string; person_id: string };
        Insert: { code_hash: string; created_at?: string; person_id: string };
        Update: { code_hash?: string; created_at?: string; person_id?: string };
        Relationships: [
          {
            foreignKeyName: "access_codes_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: true;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      aulas: {
        Row: {
          created_at: string;
          created_by: string | null;
          duration_min: number;
          id: string;
          meet_link: string;
          ping_at: string | null;
          reminder_sent_at: string | null;
          start_at: string;
          status: Database["public"]["Enums"]["aula_status"];
          title: string;
          turma_id: string;
          type: Database["public"]["Enums"]["aula_type"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          duration_min?: number;
          id?: string;
          meet_link: string;
          ping_at?: string | null;
          reminder_sent_at?: string | null;
          start_at: string;
          status: Database["public"]["Enums"]["aula_status"];
          title?: string;
          turma_id: string;
          type: Database["public"]["Enums"]["aula_type"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          duration_min?: number;
          id?: string;
          meet_link?: string;
          ping_at?: string | null;
          reminder_sent_at?: string | null;
          start_at?: string;
          status?: Database["public"]["Enums"]["aula_status"];
          title?: string;
          turma_id?: string;
          type?: Database["public"]["Enums"]["aula_type"];
        };
        Relationships: [
          {
            foreignKeyName: "aulas_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aulas_turma_id_fkey";
            columns: ["turma_id"];
            isOneToOne: false;
            referencedRelation: "turmas";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: { created_at: string; person_id: string; turma_id: string };
        Insert: { created_at?: string; person_id: string; turma_id: string };
        Update: { created_at?: string; person_id?: string; turma_id?: string };
        Relationships: [
          {
            foreignKeyName: "enrollments_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_turma_id_fkey";
            columns: ["turma_id"];
            isOneToOne: false;
            referencedRelation: "turmas";
            referencedColumns: ["id"];
          },
        ];
      };
      join_events: {
        Row: { aula_id: string; id: number; joined_at: string; person_id: string };
        Insert: { aula_id: string; id?: never; joined_at?: string; person_id: string };
        Update: { aula_id?: string; id?: never; joined_at?: string; person_id?: string };
        Relationships: [
          {
            foreignKeyName: "join_events_aula_id_fkey";
            columns: ["aula_id"];
            isOneToOne: false;
            referencedRelation: "aulas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "join_events_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      people: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          role: Database["public"]["Enums"]["person_role"];
          school_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          role: Database["public"]["Enums"]["person_role"];
          school_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          role?: Database["public"]["Enums"]["person_role"];
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "people_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      person_logins: {
        Row: { auth_user_id: string; created_at: string; person_id: string };
        Insert: { auth_user_id: string; created_at?: string; person_id: string };
        Update: { auth_user_id?: string; created_at?: string; person_id?: string };
        Relationships: [
          {
            foreignKeyName: "person_logins_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_ok_at: string | null;
          p256dh: string;
          person_id: string;
          platform: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_ok_at?: string | null;
          p256dh: string;
          person_id: string;
          platform?: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_ok_at?: string | null;
          p256dh?: string;
          person_id?: string;
          platform?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: { city: string | null; created_at: string; id: string; name: string };
        Insert: { city?: string | null; created_at?: string; id?: string; name: string };
        Update: { city?: string | null; created_at?: string; id?: string; name?: string };
        Relationships: [];
      };
      turmas: {
        Row: {
          created_at: string;
          horario: string;
          id: string;
          meet_link: string | null;
          name: string;
          nivel: string;
          school_id: string;
          teacher_id: string | null;
        };
        Insert: {
          created_at?: string;
          horario?: string;
          id?: string;
          meet_link?: string | null;
          name: string;
          nivel?: string;
          school_id: string;
          teacher_id?: string | null;
        };
        Update: {
          created_at?: string;
          horario?: string;
          id?: string;
          meet_link?: string | null;
          name?: string;
          nivel?: string;
          school_id?: string;
          teacher_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "turmas_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turmas_teacher_id_school_id_fkey";
            columns: ["teacher_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id", "school_id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      push_config: {
        Args: never;
        Returns: { push_secret: string; vapid_private_key: string; vapid_public_key: string; vapid_subject: string }[];
      };
      vapid_public_key: { Args: never; Returns: string };
      redeem_access_code: {
        Args: { code: string };
        Returns: {
          name: string;
          person_id: string;
          role: Database["public"]["Enums"]["person_role"];
        }[];
      };
    };
    Enums: {
      aula_status: "scheduled" | "live" | "ended";
      aula_type: "scheduled" | "lightning";
      person_role: "student" | "teacher" | "admin";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
