# Guia de Testes - WhatsApp Worker

## Pré-requisitos

1. Dependências instaladas: `npm install`
2. Arquivo `.env` configurado
3. Tabela `whatsapp_notifications` criada no Supabase
4. Evolution API configurada e funcionando

## 1. Testar Configuração

```bash
npm run test:setup
```

Deve mostrar:
- ✅ All environment variables set
- ✅ Supabase connected successfully
- ✅ Table exists

## 2. Testar Jobs Manualmente

### Job 3 dias antes

```bash
npm run test:3dias
```

Ou com mais detalhes:
```bash
node test-jobs.js 3dias
```

O que faz:
- Busca agendamentos para daqui a 3 dias
- Status = 'agendado'
- Verifica duplicatas
- Envia mensagem WhatsApp
- Registra em whatsapp_notifications

### Job 24h antes

```bash
npm run test:24h
```

Ou:
```bash
node test-jobs.js 24h
```

O que faz:
- Busca agendamentos para amanhã
- Status = 'agendado' OU 'confirmado'
- Verifica duplicatas
- Envia mensagem WhatsApp
- Registra em whatsapp_notifications

### Notificação imediata

```bash
node test-jobs.js imediato <appointment_id>
```

Exemplo:
```bash
node test-jobs.js imediato 550e8400-e29b-41d4-a716-446655440000
```

O que faz:
- Busca agendamento específico por ID
- Verifica se tem telefone
- Verifica se não está cancelado
- Verifica duplicata
- Envia mensagem WhatsApp
- Registra em whatsapp_notifications

## 3. Testar Servidor

### Iniciar servidor

```bash
npm run dev
```

Deve mostrar:
```
[3dias] Cron job registrado (diariamente às 08:00 - America/Sao_Paulo)
[24h] Cron job registrado (diariamente às 09:00 - America/Sao_Paulo)
🚀 WhatsApp Worker running on port 3000
📍 Health check: http://localhost:3000/health
📍 Webhook: http://localhost:3000/webhook/evolution
📍 Immediate notify: http://localhost:3000/notify/immediate
```

### Testar health check

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "ts": "2026-03-16T..."
}
```

### Testar endpoint de notificação imediata

```bash
curl -X POST http://localhost:3000/notify/immediate \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

Resposta esperada:
```json
{
  "success": true
}
```

## 4. Verificar Registros no Banco

### Ver notificações enviadas

```sql
SELECT 
  patient_name,
  patient_phone,
  notification_type,
  status,
  sent_at,
  responded_at
FROM whatsapp_notifications
ORDER BY sent_at DESC
LIMIT 10;
```

### Ver notificações por tipo

```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  COUNT(responded_at) as respondidas
FROM whatsapp_notifications
GROUP BY notification_type;
```

### Ver duplicatas (não deveria ter)

```sql
SELECT 
  appointment_id,
  notification_type,
  COUNT(*) as vezes
FROM whatsapp_notifications
GROUP BY appointment_id, notification_type
HAVING COUNT(*) > 1;
```

## 5. Testar Regras de Negócio

### Cenário 1: Consulta 3+ dias antes

1. Criar agendamento para daqui a 5 dias
2. Rodar `npm run test:3dias` → deve PULAR (ainda não é 3 dias)
3. Ajustar data para daqui a 3 dias
4. Rodar `npm run test:3dias` → deve ENVIAR
5. Rodar novamente → deve PULAR (duplicata)

### Cenário 2: Consulta 1-3 dias antes

1. Criar agendamento para daqui a 2 dias
2. Rodar `npm run test:3dias` → deve PULAR (não é exatamente 3 dias)
3. Rodar `npm run test:24h` → deve PULAR (não é amanhã)
4. Ajustar data para amanhã
5. Rodar `npm run test:24h` → deve ENVIAR

### Cenário 3: Consulta < 24h

1. Criar agendamento para hoje ou amanhã
2. Chamar POST /notify/immediate → deve ENVIAR
3. Chamar novamente → deve retornar erro (duplicata)

### Cenário 4: Paciente confirmou na 1ª mensagem

1. Criar agendamento para daqui a 5 dias
2. Aguardar job 3 dias antes enviar
3. Paciente confirma (status vira 'confirmado')
4. Aguardar job 24h antes
5. Job deve ENVIAR normalmente (inclui status 'confirmado')

### Cenário 5: Paciente cancelou

1. Criar agendamento para daqui a 5 dias
2. Aguardar job 3 dias antes enviar
3. Paciente cancela (status vira 'cancelado')
4. Aguardar job 24h antes
5. Job deve PULAR (não inclui status 'cancelado')

### Cenário 6: Sem telefone

1. Criar agendamento sem patient_phone
2. Rodar qualquer job → deve PULAR silenciosamente

## 6. Testar Webhook (Evolution API)

### Simular clique em botão

```bash
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      },
      "message": {
        "buttonsResponseMessage": {
          "selectedButtonId": "CONFIRMAR"
        }
      }
    }
  }'
```

### Simular mensagem de texto

```bash
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      },
      "message": {
        "conversation": "sim, confirmo"
      }
    }
  }'
```

## 7. Logs Esperados

### Ao iniciar servidor

```
[3dias] Cron job registrado (diariamente às 08:00 - America/Sao_Paulo)
[24h] Cron job registrado (diariamente às 09:00 - America/Sao_Paulo)
🚀 WhatsApp Worker running on port 3000
```

### Ao executar job 3 dias

```
[3dias] Iniciando job...
[3dias] Buscando agendamentos para 2026-03-19
[3dias] Encontrados 5 agendamentos
[3dias] Enviado para João Silva
[3dias] PULAR: já enviado para Maria Santos
[3dias] Enviado para Pedro Costa
[3dias] Concluído: 2 enviados, 0 erros, 3 pulados
```

### Ao receber webhook

```
[WEBHOOK] Event: messages.upsert
[BUTTON] 5511999999999 clicked CONFIRMAR
[CONFIRM] Appointment 550e8400-e29b-41d4-a716-446655440000
[CONFIRM] Success for 550e8400-e29b-41d4-a716-446655440000
```

## Troubleshooting

### Erro: "All environment variables set" falha
- Verificar se `.env` existe e está preenchido
- Copiar de `.env.example` se necessário

### Erro: "Supabase connected successfully" falha
- Verificar SUPABASE_URL e SUPABASE_SERVICE_KEY
- Testar conexão no Supabase Dashboard

### Erro: "Table exists" falha
- Executar `CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql` no SQL Editor

### Erro 401 na Evolution API
- Verificar EVOLUTION_API_KEY
- Verificar se instância está ativa

### Job não envia nada
- Verificar se existem agendamentos nas datas corretas
- Verificar status dos agendamentos
- Verificar se têm telefone
- Verificar logs de duplicatas

### Mensagem não chega no WhatsApp
- Verificar se Evolution API está funcionando
- Testar envio manual pela Evolution API
- Verificar formato do telefone (deve ter 55 + DDD + número)
