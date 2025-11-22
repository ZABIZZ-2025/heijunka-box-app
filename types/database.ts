export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type KanbanStatus =
  | 'non_avviato'
  | 'in_attesa'
  | 'in_corso'
  | 'attesa_convergenza'
  | 'completato'
  | 'annullato'
  | 'completato_parziale'

export interface Database {
  public: {
    Tables: {
      reparti: {
        Row: {
          id: string
          nome: string
          codice: string
          vedere_tutto: boolean
          creare_progetti: boolean
          modificare_kanban: boolean
          ruolo_amministratore: boolean
          colore_hex: string
          ordine_visualizzazione: number
          attivo: boolean
          creato_il: string
          aggiornato_il: string
        }
        Insert: {
          id?: string
          nome: string
          codice: string
          vedere_tutto?: boolean
          creare_progetti?: boolean
          modificare_kanban?: boolean
          ruolo_amministratore?: boolean
          colore_hex?: string
          ordine_visualizzazione?: number
          attivo?: boolean
          creato_il?: string
          aggiornato_il?: string
        }
        Update: {
          id?: string
          nome?: string
          codice?: string
          vedere_tutto?: boolean
          creare_progetti?: boolean
          modificare_kanban?: boolean
          ruolo_amministratore?: boolean
          colore_hex?: string
          ordine_visualizzazione?: number
          attivo?: boolean
          creato_il?: string
          aggiornato_il?: string
        }
      }
      utenti: {
        Row: {
          id: string
          email: string
          username: string
          password_hash: string
          nome_completo: string
          reparto_id: string | null
          attivo: boolean
          ultima_connessione: string | null
          creato_il: string
          aggiornato_il: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          password_hash: string
          nome_completo: string
          reparto_id?: string | null
          attivo?: boolean
          ultima_connessione?: string | null
          creato_il?: string
          aggiornato_il?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password_hash?: string
          nome_completo?: string
          reparto_id?: string | null
          attivo?: boolean
          ultima_connessione?: string | null
          creato_il?: string
          aggiornato_il?: string
        }
      }
      processi: {
        Row: {
          id: string
          codice: string
          descrizione: string
          attivo: boolean
          numero_attivita: number
          caricato_da: string | null
          caricato_il: string
          file_excel_path: string | null
          aggiornato_il: string
        }
        Insert: {
          id?: string
          codice: string
          descrizione: string
          attivo?: boolean
          numero_attivita: number
          caricato_da?: string | null
          caricato_il?: string
          file_excel_path?: string | null
          aggiornato_il?: string
        }
        Update: {
          id?: string
          codice?: string
          descrizione?: string
          attivo?: boolean
          numero_attivita?: number
          caricato_da?: string | null
          caricato_il?: string
          file_excel_path?: string | null
          aggiornato_il?: string
        }
      }
      attivita_processo: {
        Row: {
          id: string
          processo_id: string
          numero_attivita: number
          descrizione: string
          reparto_id: string
          numero_attivita_precedenti: number[]
          numero_attivita_successive: number[]
          is_prima_attivita: boolean
          is_ultima_attivita: boolean
        }
        Insert: {
          id?: string
          processo_id: string
          numero_attivita: number
          descrizione: string
          reparto_id: string
          numero_attivita_precedenti?: number[]
          numero_attivita_successive?: number[]
          is_prima_attivita?: boolean
          is_ultima_attivita?: boolean
        }
        Update: {
          id?: string
          processo_id?: string
          numero_attivita?: number
          descrizione?: string
          reparto_id?: string
          numero_attivita_precedenti?: number[]
          numero_attivita_successive?: number[]
          is_prima_attivita?: boolean
          is_ultima_attivita?: boolean
        }
      }
      kanban: {
        Row: {
          id: string
          numero: number
          suffisso: string | null
          numero_display: string
          modello: string | null
          cliente: string | null
          nome_progetto: string
          descrizione_progetto: string | null
          processo_id: string
          attivita_corrente_id: string | null
          descrizione_attivita_corrente: string | null
          reparto_corrente_id: string | null
          descrizione_reparto_corrente: string | null
          data_presa_in_carico: string | null
          data_prevista_fine: string | null
          data_effettiva_fine: string | null
          prossima_attivita_1_id: string | null
          descrizione_prossima_attivita_1: string | null
          reparto_prossima_attivita_1_id: string | null
          prossima_attivita_2_id: string | null
          descrizione_prossima_attivita_2: string | null
          reparto_prossima_attivita_2_id: string | null
          prossima_attivita_3_id: string | null
          descrizione_prossima_attivita_3: string | null
          reparto_prossima_attivita_3_id: string | null
          stato: KanbanStatus
          motivazione_chiusura: string | null
          kanban_padre_id: string | null
          is_split: boolean
          attesa_completamento_kanban_ids: string[] | null
          creato_da: string | null
          creato_il: string
          ultima_modifica: string
          modificato_da: string | null
        }
        Insert: {
          id?: string
          numero?: number
          suffisso?: string | null
          modello?: string | null
          cliente?: string | null
          nome_progetto: string
          descrizione_progetto?: string | null
          processo_id: string
          attivita_corrente_id?: string | null
          descrizione_attivita_corrente?: string | null
          reparto_corrente_id?: string | null
          descrizione_reparto_corrente?: string | null
          data_presa_in_carico?: string | null
          data_prevista_fine?: string | null
          data_effettiva_fine?: string | null
          prossima_attivita_1_id?: string | null
          descrizione_prossima_attivita_1?: string | null
          reparto_prossima_attivita_1_id?: string | null
          prossima_attivita_2_id?: string | null
          descrizione_prossima_attivita_2?: string | null
          reparto_prossima_attivita_2_id?: string | null
          prossima_attivita_3_id?: string | null
          descrizione_prossima_attivita_3?: string | null
          reparto_prossima_attivita_3_id?: string | null
          stato?: KanbanStatus
          motivazione_chiusura?: string | null
          kanban_padre_id?: string | null
          is_split?: boolean
          attesa_completamento_kanban_ids?: string[] | null
          creato_da?: string | null
          creato_il?: string
          ultima_modifica?: string
          modificato_da?: string | null
        }
        Update: {
          id?: string
          numero?: number
          suffisso?: string | null
          modello?: string | null
          cliente?: string | null
          nome_progetto?: string
          descrizione_progetto?: string | null
          processo_id?: string
          attivita_corrente_id?: string | null
          descrizione_attivita_corrente?: string | null
          reparto_corrente_id?: string | null
          descrizione_reparto_corrente?: string | null
          data_presa_in_carico?: string | null
          data_prevista_fine?: string | null
          data_effettiva_fine?: string | null
          prossima_attivita_1_id?: string | null
          descrizione_prossima_attivita_1?: string | null
          reparto_prossima_attivita_1_id?: string | null
          prossima_attivita_2_id?: string | null
          descrizione_prossima_attivita_2?: string | null
          reparto_prossima_attivita_2_id?: string | null
          prossima_attivita_3_id?: string | null
          descrizione_prossima_attivita_3?: string | null
          reparto_prossima_attivita_3_id?: string | null
          stato?: KanbanStatus
          motivazione_chiusura?: string | null
          kanban_padre_id?: string | null
          is_split?: boolean
          attesa_completamento_kanban_ids?: string[] | null
          creato_da?: string | null
          creato_il?: string
          ultima_modifica?: string
          modificato_da?: string | null
        }
      }
      storico_attivita_kanban: {
        Row: {
          id: string
          kanban_id: string
          kanban_numero_display: string
          attivita_id: string | null
          descrizione_attivita: string
          reparto_id: string | null
          descrizione_reparto: string
          data_inizio: string
          data_prevista_fine: string
          data_effettiva_fine: string
          durata_giorni: number
          in_ritardo: boolean
          ritardo_giorni: number
          completato_da: string | null
          creato_il: string
        }
        Insert: {
          id?: string
          kanban_id: string
          kanban_numero_display: string
          attivita_id?: string | null
          descrizione_attivita: string
          reparto_id?: string | null
          descrizione_reparto: string
          data_inizio: string
          data_prevista_fine: string
          data_effettiva_fine: string
          completato_da?: string | null
          creato_il?: string
        }
        Update: {
          id?: string
          kanban_id?: string
          kanban_numero_display?: string
          attivita_id?: string | null
          descrizione_attivita?: string
          reparto_id?: string | null
          descrizione_reparto?: string
          data_inizio?: string
          data_prevista_fine?: string
          data_effettiva_fine?: string
          completato_da?: string | null
          creato_il?: string
        }
      }
      log_azioni: {
        Row: {
          id: string
          kanban_id: string | null
          kanban_numero_display: string | null
          utente_id: string | null
          utente_username: string
          reparto_id: string | null
          azione: string
          dettagli: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          kanban_id?: string | null
          kanban_numero_display?: string | null
          utente_id?: string | null
          utente_username: string
          reparto_id?: string | null
          azione: string
          dettagli?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          kanban_id?: string | null
          kanban_numero_display?: string | null
          utente_id?: string | null
          utente_username?: string
          reparto_id?: string | null
          azione?: string
          dettagli?: Json | null
          timestamp?: string
        }
      }
    }
  }
}

// Helper types for joined queries
export type Reparto = Database['public']['Tables']['reparti']['Row']
export type RepartoInsert = Database['public']['Tables']['reparti']['Insert']
export type RepartoUpdate = Database['public']['Tables']['reparti']['Update']

export type Utente = Database['public']['Tables']['utenti']['Row']
export type UtenteInsert = Database['public']['Tables']['utenti']['Insert']
export type UtenteUpdate = Database['public']['Tables']['utenti']['Update']

export type Processo = Database['public']['Tables']['processi']['Row']
export type ProcessoInsert = Database['public']['Tables']['processi']['Insert']
export type ProcessoUpdate = Database['public']['Tables']['processi']['Update']

export type AttivitaProcesso = Database['public']['Tables']['attivita_processo']['Row']
export type AttivitaProcessoInsert = Database['public']['Tables']['attivita_processo']['Insert']

export type Kanban = Database['public']['Tables']['kanban']['Row']
export type KanbanInsert = Database['public']['Tables']['kanban']['Insert']
export type KanbanUpdate = Database['public']['Tables']['kanban']['Update']

export type StoricoAttivitaKanban = Database['public']['Tables']['storico_attivita_kanban']['Row']
export type LogAzioni = Database['public']['Tables']['log_azioni']['Row']

// Extended types with relations
export interface UtenteWithReparto extends Utente {
  reparto?: Reparto | null
}

export interface KanbanWithRelations extends Kanban {
  processo?: Processo | null
  attivita_corrente?: AttivitaProcesso | null
  reparto_corrente?: Reparto | null
}

export interface AttivitaProcessoWithReparto extends AttivitaProcesso {
  reparto?: Reparto | null
}
