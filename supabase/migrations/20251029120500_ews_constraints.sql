-- Tag Chain EWS Constraints Migration
-- Date: 2025-10-29

-- Add foreign key constraints to EWS tables now that core tables exist

-- Add constraints to ews_forecasts
ALTER TABLE ews_forecasts 
ADD CONSTRAINT fk_ews_forecasts_farm 
FOREIGN KEY (farm_id) REFERENCES farms(id);

-- Add constraints to ews_alerts
ALTER TABLE ews_alerts 
ADD CONSTRAINT fk_ews_alerts_farm 
FOREIGN KEY (farm_id) REFERENCES farms(id);

-- Add constraints to ews_subscriptions
ALTER TABLE ews_subscriptions 
ADD CONSTRAINT fk_ews_subscriptions_user 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE ews_subscriptions 
ADD CONSTRAINT fk_ews_subscriptions_farm 
FOREIGN KEY (farm_id) REFERENCES farms(id);

-- Add constraints to ews_disease_risk
ALTER TABLE ews_disease_risk 
ADD CONSTRAINT fk_ews_disease_risk_farm 
FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE ews_disease_risk 
ADD CONSTRAINT fk_ews_disease_risk_forecast 
FOREIGN KEY (forecast_id) REFERENCES ews_forecasts(id);

-- Add constraints to ews_outbox
ALTER TABLE ews_outbox 
ADD CONSTRAINT fk_ews_outbox_alert 
FOREIGN KEY (alert_id) REFERENCES ews_alerts(id);

-- Add constraints to onchain_inbound_events
ALTER TABLE onchain_inbound_events 
ADD CONSTRAINT fk_onchain_inbound_events_user 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Add constraints to onchain_withdrawals
ALTER TABLE onchain_withdrawals 
ADD CONSTRAINT fk_onchain_withdrawals_user 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Add constraints to security_events
ALTER TABLE security_events 
ADD CONSTRAINT fk_security_events_user 
FOREIGN KEY (user_id) REFERENCES users(id);