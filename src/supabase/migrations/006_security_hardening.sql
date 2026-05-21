-- Revocar acceso público por defecto
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Solo dar los permisos mínimos necesarios
GRANT SELECT ON categories TO anon;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plans TO authenticated;
GRANT SELECT ON contact_public_preview TO anon;
GRANT SELECT ON contact_public_preview TO authenticated;
GRANT SELECT ON contact_unlocked_secure TO authenticated;
GRANT SELECT ON admin_contacts_secure TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT, INSERT ON user_category_access TO authenticated;
GRANT SELECT, INSERT, UPDATE ON purchases TO authenticated;
GRANT SELECT, INSERT ON trial_claims TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;
GRANT SELECT ON customer_status TO authenticated;
GRANT SELECT ON customer_rewards TO authenticated;
GRANT SELECT ON customer_feedback TO authenticated;
GRANT INSERT ON customer_feedback TO anon;
GRANT INSERT ON customer_feedback TO authenticated;

-- Función para limpiar sesiones viejas
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Índices para mejorar rendimiento y evitar full table scans
CREATE INDEX IF NOT EXISTS idx_contacts_category_status
  ON contacts(category_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_name
  ON contacts USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_user_category_access_user
  ON user_category_access(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_user
  ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user
  ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trial_claims_user
  ON trial_claims(user_id);
