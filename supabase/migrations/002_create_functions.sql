-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aggiornato_il := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reparti
CREATE TRIGGER trigger_update_reparto_timestamp
  BEFORE UPDATE ON reparti
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for kanban ultima_modifica
CREATE OR REPLACE FUNCTION update_kanban_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_modifica := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kanban_timestamp
  BEFORE UPDATE ON kanban
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_timestamp();
