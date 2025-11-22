-- Seed initial departments
INSERT INTO reparti (nome, codice, vedere_tutto, creare_progetti, modificare_kanban, ruolo_amministratore, colore_hex, ordine_visualizzazione) VALUES
('Sviluppo', 'SVL', true, true, true, true, '#3399FF', 1),
('Modellistica', 'MOD', false, false, true, false, '#FF9933', 2),
('Qualità', 'QUA', false, false, true, false, '#28A745', 3),
('Produzione', 'PRD', false, false, true, false, '#6C757D', 4),
('Commerciale', 'COM', true, false, true, false, '#FFC107', 5),
('Logistica', 'LOG', false, false, true, false, '#DC3545', 6);

-- Note: Users should be created via Supabase Auth
-- After creating a user via Auth, insert the profile:
-- INSERT INTO utenti (id, email, username, nome_completo, reparto_id)
-- SELECT 'user-uuid-from-auth', 'admin@azienda.it', 'admin', 'Amministratore', id
-- FROM reparti WHERE codice = 'SVL';
