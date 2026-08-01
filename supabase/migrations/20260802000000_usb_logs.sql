/*
# USB Device Monitoring — usb_logs table

Stores real USB device connection/disconnection events with Zero Trust risk evaluation results.
Each row represents one USB connect or disconnect event detected on the host machine.
*/

CREATE TABLE IF NOT EXISTS usb_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL,
  device_type text NOT NULL DEFAULT 'Unknown',
  manufacturer text,
  device_id text,
  serial_number text,
  connection_time timestamptz NOT NULL DEFAULT now(),
  disconnection_time timestamptz,
  status text NOT NULL DEFAULT 'Connected' CHECK (status IN ('Connected', 'Disconnected')),
  is_registered boolean NOT NULL DEFAULT false,
  risk_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'High' CHECK (risk_level IN ('Low', 'Medium', 'High')),
  decision text NOT NULL DEFAULT 'Deny',
  risk_reasons text[],
  security_alert boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usb_logs_created ON usb_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usb_logs_status ON usb_logs(status);
CREATE INDEX IF NOT EXISTS idx_usb_logs_risk_level ON usb_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_usb_logs_device_id ON usb_logs(device_id);

-- Enable RLS
ALTER TABLE usb_logs ENABLE ROW LEVEL SECURITY;

-- Policies: full CRUD for anon + authenticated (single-tenant simulation)
DROP POLICY IF EXISTS "anon_select_usb_logs" ON usb_logs;
CREATE POLICY "anon_select_usb_logs" ON usb_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_usb_logs" ON usb_logs;
CREATE POLICY "anon_insert_usb_logs" ON usb_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_usb_logs" ON usb_logs;
CREATE POLICY "anon_update_usb_logs" ON usb_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_usb_logs" ON usb_logs;
CREATE POLICY "anon_delete_usb_logs" ON usb_logs FOR DELETE TO anon, authenticated USING (true);
