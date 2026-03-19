# Quick Reference - WhatsApp Worker

## 🚀 Comandos Rápidos

```bash
# Setup inicial
npm install
cp .env.example .env
# Editar .env com suas credenciais
npm run test:setup

# Testes
npm run test:3dias          # Testar job 3 dias antes
npm run test:24h            # Testar job 24h antes
node test-jobs.js imediato <id>  # Testar notificação imediata

# Servidor
npm run dev                 # Desenvolvimento (com auto-reload)
npm start                   # Produção

# Health check
curl http://localhost:3000/health
```

## 📅 Horários dos Jobs

| Job | Horário | Timezone | Busca |
|-----|---------|----------|-------|
| 3 dias antes | 08:00 | America/Sao_Paulo | hoje + 3 dias |
| 24h antes | 09:00 | America/Sao_Paulo | hoje + 1 dia |
| Imediato | On-demand | - | Por ID |

## 📊 Status dos Agendamentos

| Status | Job 3 dias | Job 24h | Imediato |
|--------|-----------|---------|----------|
| agendado | ✅ Envia | ✅ Envia | ✅ Envia |
| confirmado | ❌ Não | ✅ Envia | ✅ Envia |
| cancelado | ❌ Não | ❌ Não | ❌ Não |

## 🔄 Fluxo de Notificações

### Consulta 3+ dias antes
```
Dia 0: Agendamento criado
Dia 0: POST /notify/immediate → Envia "Agendamento Confirmado"
Dia X-3: Job 08:00 → Envia "Confirmação de Consulta"
Dia X-1: Job 09:00 → Envia "Confirmação de Consulta"
Dia X: Consulta acontece
```

### Consulta 1-3 dias antes
```
Dia 0: Agendamento criado
Dia 0: POST /notify/immediate → Envia "Agendamento Confirmado"
Dia X-1: Job 09:00 → Envia "Confirmação de Consulta"
Dia X: Consulta acontece
```

### Consulta < 24h
```
Dia 0: Agendamento criado
Dia 0: POST /notify/immediate → Envia "Agendamento Confirmado"
Dia 0: Consulta acontece
```

## 🔍 Verificar no Banco

```sql
-- Ver últimas notificações
SELECT patient_name, notification_type, status, sent_at
FROM whatsapp_notifications
ORDER BY sent_at DESC
LIMIT 10;

-- Contar por tipo
SELECT notification_type, COUNT(*)
FROM whatsapp_notifications
GROUP BY notification_type;

-- Ver duplicatas (não deveria ter)
SELECT appointment_id, notification_type, COUNT(*)
FROM whatsapp_notifications
GROUP BY appointment_id, notification_type
HAVING COUNT(*) > 1;

-- Ver notificações pendentes de resposta
SELECT patient_name, notification_type, sent_at
FROM whatsapp_notifications
WHERE responded_at IS NULL
ORDER BY sent_at DESC;
```

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Variáveis não encontradas | Verificar `.env` existe e está preenchido |
| Erro Supabase | Verificar SUPABASE_SERVICE_KEY (não é anon key) |
| Tabela não existe | Executar CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql |
| Erro 401 Evolution | Verificar EVOLUTION_API_KEY |
| Job não envia | Verificar data/status/telefone dos agendamentos |
| Mensagem não chega | Testar Evolution API diretamente |
| Duplicatas | Verificar whatsapp_notifications antes de enviar |

## 📱 Formato de Telefone

```javascript
// Entrada aceita
"11999999999"     → "5511999999999"
"(11) 99999-9999" → "5511999999999"
"5511999999999"   → "5511999999999"

// Normalização
1. Remove não numéricos
2. Adiciona 55 se tiver 11 dígitos
3. Retorna string limpa
```

## 🎯 Endpoints

| Método | Endpoint | Body | Resposta |
|--------|----------|------|----------|
| GET | /health | - | `{"status":"ok","ts":"..."}` |
| POST | /webhook/evolution | Evolution payload | `{"success":true}` |
| POST | /notify/immediate | `{"appointment_id":"uuid"}` | `{"success":true}` |

## 📝 Tipos de Notificação

| Tipo | Quando | Mensagem |
|------|--------|----------|
| 3dias | 3 dias antes às 08:00 | "Você possui uma consulta em 3 dias" |
| 24h | 1 dia antes às 09:00 | "Você possui uma consulta em 3 dias" |
| imediato | Ao agendar (< 24h) | "Seu agendamento foi realizado" |

## 🔐 Variáveis de Ambiente

```bash
# Evolution API
EVOLUTION_API_URL=https://...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=carijos-clinica

# DeepSeek AI
DEEPSEEK_API_KEY=...

# Supabase
SUPABASE_URL=https://hkhvswfewjdrokugdqcd.supabase.co
SUPABASE_SERVICE_KEY=...  # Service role key!

# Server
PORT=3000
WEBHOOK_SECRET=...
```

## 📚 Documentação Completa

- `README.md` - Visão geral
- `SETUP_INSTRUCTIONS.md` - Setup passo a passo
- `TESTING_GUIDE.md` - Guia de testes completo
- `SPRINT2_COMPLETE.md` - Resumo da Sprint 2
- `QUICK_REFERENCE.md` - Este arquivo


## 🔗 Testar Webhook

```bash
# Botões
node test-webhook.js button 5531999999999 CONFIRMAR
node test-webhook.js button 5531999999999 CANCELAR
node test-webhook.js button 5531999999999 REAGENDAR

# Texto
node test-webhook.js text 5531999999999 "sim, confirmo"
node test-webhook.js text 5531999999999 "não posso"

# Reagendamento
node test-webhook.js reagendar 5531999999999 1

# Mensagem própria (ignorada)
node test-webhook.js fromme 5531999999999
```

## 🤖 Fluxo de Resposta

| Ação Paciente | Processamento | Resultado |
|---------------|---------------|-----------|
| Clica "✅ Confirmar" | buttonHandler | Status → 'confirmado' |
| Envia "sim" | textHandler + DeepSeek | Status → 'confirmado' |
| Clica "❌ Cancelar" | buttonHandler | Status → 'cancelado' |
| Envia "não posso" | textHandler + DeepSeek | Status → 'cancelado' |
| Clica "📅 Reagendar" | rescheduleFlow | Envia 3 opções |
| Envia "2" | webhookHandler | Cria novo + cancela antigo |

## 📊 Status das Notificações

| Status | Significado |
|--------|-------------|
| enviado | Aguardando resposta do paciente |
| aguardando_reagendamento | Aguardando escolha de opção (1, 2 ou 3) |
| reagendado | Reagendamento concluído |

## 🧠 DeepSeek AI

| Texto | Intent | Confidence |
|-------|--------|------------|
| "sim" | CONFIRMAR | ~0.98 |
| "não posso" | CANCELAR | ~0.92 |
| "mudar data" | REAGENDAR | ~0.94 |
| "talvez" | DESCONHECIDO | ~0.45 |

Confiança mínima: 0.7
