# Heijunka Box App

Sistema Heijunka Box digitale per la gestione visiva dei processi di sviluppo prodotto in un'azienda manifatturiera di luxury apparel.

## Tecnologie

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3, shadcn/ui
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deploy**: Vercel

## Setup Locale

### Prerequisiti

- Node.js 20+
- Account Supabase
- Account Vercel (per deploy)

### Installazione

1. Clona il repository:
```bash
git clone https://github.com/[username]/heijunka-box-app.git
cd heijunka-box-app
```

2. Installa le dipendenze:
```bash
npm install
```

3. Configura le variabili d'ambiente:
```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://[tuo-progetto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tua-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[tua-service-key]
```

4. Configura il database Supabase:
   - Esegui le migrazioni SQL in `supabase/migrations/` nell'ordine:
     1. `001_create_tables.sql`
     2. `002_create_functions.sql`
   - Esegui il seed opzionale: `supabase/seed.sql`

5. Avvia il server di sviluppo:
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Struttura Progetto

```
heijunka-box-app/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route autenticazione
│   ├── (dashboard)/        # Route autenticate
│   │   ├── heijunka/       # Pagina principale griglia
│   │   ├── kanban/         # Lista kanban
│   │   ├── report/         # Dashboard report
│   │   └── admin/          # Gestione admin
│   └── api/                # API Routes
├── components/             # Componenti React
│   ├── heijunka/           # Componenti griglia Heijunka
│   ├── kanban/             # Componenti kanban
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities
│   └── supabase/           # Client Supabase
├── types/                  # TypeScript types
├── store/                  # Zustand stores
└── supabase/               # Migrazioni e seed
```

## Funzionalità Principali

### Fase 1 (MVP) - Completata

- Autenticazione utenti con Supabase Auth
- Gestione reparti con permessi granulari
- Upload processi da file Excel con validazione
- Heijunka Box visualizzazione 14 giorni
- Kanban CRUD con transizioni stati
- Gestione attività sequenziali
- Colori stati (arancione, azzurro, rosso per ritardi)
- Storico kanban completati/annullati

### Fase 2 - In Sviluppo

- Splitting kanban (attività parallele)
- Convergenza attività
- Segnaposti temporanei "Prossimamente"
- Filtri avanzati

### Fase 3 - Pianificata

- Dashboard report completa
- Export Excel/PDF
- Grafici analytics

## Comandi

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build

# Start produzione
npm start

# Linting
npm run lint
```

## Deploy su Vercel

1. Connetti il repository GitHub a Vercel
2. Configura le variabili d'ambiente in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automatico ad ogni push

## Licenza

Privato - Tutti i diritti riservati
