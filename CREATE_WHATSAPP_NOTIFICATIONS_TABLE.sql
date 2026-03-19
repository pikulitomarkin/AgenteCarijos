-- Migration: Criar tabela whatsapp_notifications
-- Executar no Supabase SQL Editor

CREATE TABLE whatsapp_notifications (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id    UUID REFERENCES appointments(id),
  patient_phone     TEXT NOT NULL,
  patient_name      TEXT,
  doctor_name       TEXT,
  appointment_date  DATE,
  appointment_time  TIME,
  notification_type TEXT DEFAULT '24h',
  sent_at           TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'enviado',
  patient_response  TEXT,
  button_clicked    TEXT,
  response_type     TEXT,
  ai_intent         TEXT,
  ai_confidence     FLOAT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_wn_appointment_id ON whatsapp_notifications(appointment_id);
CREATE INDEX idx_wn_phone ON whatsapp_notifications(patient_phone);
CREATE INDEX idx_wn_type ON whatsapp_notifications(notification_type, sent_at);

-- Comentários
COMMENT ON TABLE whatsapp_notifications IS 'Registro de notificações WhatsApp enviadas e respostas dos pacientes';
COMMENT ON COLUMN whatsapp_notifications.notification_type IS 'Tipo: 3days, 24h, immediate';
COMMENT ON COLUMN whatsapp_notifications.response_type IS 'Tipo de resposta: button, text';
COMMENT ON COLUMN whatsapp_notifications.ai_intent IS 'Intenção classificada pela IA: CONFIRMAR, CANCELAR, REAGENDAR, DESCONHECIDO';
