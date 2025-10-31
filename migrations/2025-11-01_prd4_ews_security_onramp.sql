-- Tag Chain PRD4: EWS + Security + On/Off-Ramp migration
-- Date: 2025-11-01

-- EWS tables
CREATE TABLE IF NOT EXISTS ews_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id),
  provider TEXT,
  data jsonb,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ews_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id),
  severity TEXT,
  type TEXT,
  message TEXT,
  payload jsonb,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ews_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  farm_id uuid REFERENCES farms(id),
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EWS disease risk table
CREATE TABLE IF NOT EXISTS ews_disease_risk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id),
  disease TEXT,
  confidence_score numeric,
  recommended_actions TEXT,
  forecast_id uuid REFERENCES ews_forecasts(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EWS disease rules table
CREATE TABLE IF NOT EXISTS ews_disease_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT,
  conditions_json jsonb,
  recommended_actions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EWS notification outbox table
CREATE TABLE IF NOT EXISTS ews_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES ews_alerts(id),
  recipient_type TEXT, -- email, sms, push
  recipient_address TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  retry_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  user_id uuid,
  ip TEXT,
  user_agent TEXT,
  details jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onchain inbound / withdrawal events
CREATE TABLE IF NOT EXISTS onchain_inbound_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address TEXT,
  provider TEXT,
  external_tx_hash TEXT UNIQUE,
  amount numeric,
  currency TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onchain_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address TEXT,
  amount numeric,
  currency TEXT,
  status TEXT,
  external_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ews_forecasts_farm ON ews_forecasts(farm_id);
CREATE INDEX IF NOT EXISTS idx_ews_alerts_farm ON ews_alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_ews_disease_risk_farm ON ews_disease_risk(farm_id);
CREATE INDEX IF NOT EXISTS idx_ews_outbox_status ON ews_outbox(status);
CREATE INDEX IF NOT EXISTS idx_onchain_inbound_external_tx ON onchain_inbound_events(external_tx_hash);

-- ROLLBACK (manual)
-- DROP TABLE IF EXISTS onchain_withdrawals;
-- DROP TABLE IF EXISTS onchain_inbound_events;
-- DROP TABLE IF EXISTS security_events;
-- DROP TABLE IF EXISTS ews_subscriptions;
-- DROP TABLE IF EXISTS ews_alerts;
-- DROP TABLE IF EXISTS ews_forecasts;
-- DROP TABLE IF EXISTS ews_disease_risk;
-- DROP TABLE IF EXISTS ews_disease_rules;
-- DROP TABLE IF EXISTS ews_outbox;