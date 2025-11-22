-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reparti table
CREATE TABLE reparti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) UNIQUE NOT NULL,
  codice VARCHAR(20) UNIQUE NOT NULL,
  vedere_tutto BOOLEAN DEFAULT false,
  creare_progetti BOOLEAN DEFAULT false,
  modificare_kanban BOOLEAN DEFAULT false,
  ruolo_amministratore BOOLEAN DEFAULT false,
  colore_hex VARCHAR(7) DEFAULT '#3399FF',
  ordine_visualizzazione INTEGER DEFAULT 0,
  attivo BOOLEAN DEFAULT true,
  creato_il TIMESTAMP DEFAULT NOW(),
  aggiornato_il TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reparti_attivo ON reparti(attivo);
CREATE INDEX idx_reparti_ordine ON reparti(ordine_visualizzazione);

-- Create utenti table
CREATE TABLE utenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'managed_by_supabase_auth',
  nome_completo VARCHAR(200) NOT NULL,
  reparto_id UUID REFERENCES reparti(id) ON DELETE SET NULL,
  attivo BOOLEAN DEFAULT true,
  ultima_connessione TIMESTAMP,
  creato_il TIMESTAMP DEFAULT NOW(),
  aggiornato_il TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_utenti_reparto ON utenti(reparto_id);
CREATE INDEX idx_utenti_email ON utenti(email);
CREATE INDEX idx_utenti_username ON utenti(username);

-- Create processi table
CREATE TABLE processi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codice VARCHAR(50) UNIQUE NOT NULL,
  descrizione VARCHAR(500) NOT NULL,
  attivo BOOLEAN DEFAULT true,
  numero_attivita INTEGER NOT NULL,
  caricato_da UUID REFERENCES utenti(id),
  caricato_il TIMESTAMP DEFAULT NOW(),
  file_excel_path TEXT,
  aggiornato_il TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_processi_codice ON processi(codice);
CREATE INDEX idx_processi_attivo ON processi(attivo);

-- Create attivita_processo table
CREATE TABLE attivita_processo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id UUID REFERENCES processi(id) ON DELETE CASCADE,
  numero_attivita INTEGER NOT NULL,
  descrizione VARCHAR(500) NOT NULL,
  reparto_id UUID REFERENCES reparti(id) ON DELETE RESTRICT,
  numero_attivita_precedenti INTEGER[] DEFAULT '{}',
  numero_attivita_successive INTEGER[] DEFAULT '{}',
  is_prima_attivita BOOLEAN DEFAULT false,
  is_ultima_attivita BOOLEAN DEFAULT false,
  UNIQUE(processo_id, numero_attivita)
);

CREATE INDEX idx_attivita_processo_id ON attivita_processo(processo_id);
CREATE INDEX idx_attivita_numero ON attivita_processo(numero_attivita);
CREATE INDEX idx_attivita_reparto ON attivita_processo(reparto_id);

-- Create kanban table
CREATE TABLE kanban (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL,
  suffisso VARCHAR(1),
  numero_display VARCHAR(10) GENERATED ALWAYS AS (
    CASE
      WHEN suffisso IS NULL THEN numero::TEXT
      ELSE numero::TEXT || '-' || suffisso
    END
  ) STORED,
  modello VARCHAR(100),
  cliente VARCHAR(100),
  nome_progetto VARCHAR(200) NOT NULL,
  descrizione_progetto TEXT,
  processo_id UUID REFERENCES processi(id) ON DELETE RESTRICT,
  attivita_corrente_id UUID REFERENCES attivita_processo(id),
  descrizione_attivita_corrente VARCHAR(500),
  reparto_corrente_id UUID REFERENCES reparti(id),
  descrizione_reparto_corrente VARCHAR(100),
  data_presa_in_carico TIMESTAMP,
  data_prevista_fine DATE,
  data_effettiva_fine TIMESTAMP,
  prossima_attivita_1_id UUID REFERENCES attivita_processo(id),
  descrizione_prossima_attivita_1 VARCHAR(500),
  reparto_prossima_attivita_1_id UUID REFERENCES reparti(id),
  prossima_attivita_2_id UUID REFERENCES attivita_processo(id),
  descrizione_prossima_attivita_2 VARCHAR(500),
  reparto_prossima_attivita_2_id UUID REFERENCES reparti(id),
  prossima_attivita_3_id UUID REFERENCES attivita_processo(id),
  descrizione_prossima_attivita_3 VARCHAR(500),
  reparto_prossima_attivita_3_id UUID REFERENCES reparti(id),
  stato VARCHAR(50) NOT NULL DEFAULT 'in_attesa',
  motivazione_chiusura TEXT,
  kanban_padre_id UUID REFERENCES kanban(id) ON DELETE SET NULL,
  is_split BOOLEAN DEFAULT false,
  attesa_completamento_kanban_ids UUID[],
  creato_da UUID REFERENCES utenti(id),
  creato_il TIMESTAMP DEFAULT NOW(),
  ultima_modifica TIMESTAMP DEFAULT NOW(),
  modificato_da UUID REFERENCES utenti(id),
  UNIQUE(numero, suffisso)
);

CREATE INDEX idx_kanban_numero ON kanban(numero);
CREATE INDEX idx_kanban_stato ON kanban(stato);
CREATE INDEX idx_kanban_processo ON kanban(processo_id);
CREATE INDEX idx_kanban_reparto_corrente ON kanban(reparto_corrente_id);
CREATE INDEX idx_kanban_cliente ON kanban(cliente);
CREATE INDEX idx_kanban_modello ON kanban(modello);
CREATE INDEX idx_kanban_padre ON kanban(kanban_padre_id);
CREATE INDEX idx_kanban_data_prevista ON kanban(data_prevista_fine);
CREATE INDEX idx_kanban_attivi ON kanban(stato)
  WHERE stato IN ('in_attesa', 'in_corso', 'attesa_convergenza');

ALTER TABLE kanban ADD CONSTRAINT chk_stato_valido
  CHECK (stato IN ('non_avviato', 'in_attesa', 'in_corso', 'attesa_convergenza',
                   'completato', 'annullato', 'completato_parziale'));

ALTER TABLE kanban ADD CONSTRAINT chk_suffisso_valido
  CHECK (suffisso IS NULL OR suffisso IN ('A', 'B', 'C'));

-- Create storico_attivita_kanban table
CREATE TABLE storico_attivita_kanban (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kanban_id UUID REFERENCES kanban(id) ON DELETE CASCADE,
  kanban_numero_display VARCHAR(10) NOT NULL,
  attivita_id UUID REFERENCES attivita_processo(id),
  descrizione_attivita VARCHAR(500) NOT NULL,
  reparto_id UUID REFERENCES reparti(id),
  descrizione_reparto VARCHAR(100) NOT NULL,
  data_inizio TIMESTAMP NOT NULL,
  data_prevista_fine DATE NOT NULL,
  data_effettiva_fine TIMESTAMP NOT NULL,
  durata_giorni DECIMAL(10,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (data_effettiva_fine - data_inizio)) / 86400
  ) STORED,
  in_ritardo BOOLEAN GENERATED ALWAYS AS (
    data_effettiva_fine::DATE > data_prevista_fine
  ) STORED,
  ritardo_giorni INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN data_effettiva_fine::DATE > data_prevista_fine
      THEN (data_effettiva_fine::DATE - data_prevista_fine)
      ELSE 0
    END
  ) STORED,
  completato_da UUID REFERENCES utenti(id),
  creato_il TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_storico_kanban ON storico_attivita_kanban(kanban_id);
CREATE INDEX idx_storico_attivita ON storico_attivita_kanban(attivita_id);
CREATE INDEX idx_storico_reparto ON storico_attivita_kanban(reparto_id);
CREATE INDEX idx_storico_data_fine ON storico_attivita_kanban(data_effettiva_fine);

-- Create log_azioni table
CREATE TABLE log_azioni (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kanban_id UUID REFERENCES kanban(id) ON DELETE CASCADE,
  kanban_numero_display VARCHAR(10),
  utente_id UUID REFERENCES utenti(id),
  utente_username VARCHAR(100) NOT NULL,
  reparto_id UUID REFERENCES reparti(id),
  azione VARCHAR(100) NOT NULL,
  dettagli JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_log_kanban ON log_azioni(kanban_id);
CREATE INDEX idx_log_utente ON log_azioni(utente_id);
CREATE INDEX idx_log_timestamp ON log_azioni(timestamp DESC);
CREATE INDEX idx_log_azione ON log_azioni(azione);
