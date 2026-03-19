# Sprint 3 - Webhook Handlers - COMPLETO ✅

## Objetivo
Implementar handlers completos para processar respostas dos pacientes via WhatsApp (botões e texto) com integração DeepSeek AI e fluxo de reagendamento.

## Arquivos Atualizados

### 1. handlers/webhookHandler.js
✅ Responde imediatamente com 200 antes de processar
✅ Ignora eventos que não são 'messages.upsert'
✅ Ignora mensagens enviadas por nós (fromMe: true)
✅ Extrai telefone do remoteJid (remove @s.whatsapp.net e @c.us)
✅ Busca última notificação pendente com JOIN appointments
✅ Filtro: status IN ('enviado', 'aguardando_reagendamento')
✅ Fluxo de reagendamento - processa escolha de opção (1, 2 ou 3)
  - Carrega opções do patient_response (JSON)
  - Cria novo appointment
  - Cancela appointment original
  - Atualiza status para 'reagendado'
  - Envia confirmação
✅ Detecta resposta de botão (buttonsResponseMessage)
✅ Detecta texto (conversation ou extendedTextMessage.text)
✅ Chama buttonHandler ou textHandler conforme tipo
✅ Try/catch com logs de erro
✅ Não causa crash se notificação não encontrada

### 2. handlers/buttonHandler.js
✅ Recebe notification e buttonId
✅ Log: "[button] {patient_name} clicou: {buttonId}"
✅ Atualiza whatsapp_notifications:
  - button_clicked = buttonId
  - response_type = 'button'
  - ai_intent = buttonId
  - ai_confidence = 1.0
  - responded_at = NOW()
✅ Switch case para CONFIRMAR, CANCELAR, REAGENDAR
✅ Chama actions correspondentes
✅ Log de warning para botões desconhecidos

### 3. handlers/textHandler.js
✅ Recebe notification e text
✅ MIN_CONFIDENCE = 0.7
✅ Log: "[text] Classificando: '{text}'"
✅ Chama classifyIntent(text) do DeepSeek
✅ Log do resultado (intent e confidence)
✅ Atualiza whatsapp_notifications:
  - patient_response = text
  - response_type = 'text'
  - ai_intent = intent
  - ai_confidence = confidence
  - responded_at = NOW()
✅ Se confidence < 0.7 OU intent = 'DESCONHECIDO':
  - Envia mensagem pedindo uso dos botões
  - Return sem executar ação
✅ Switch case para CONFIRMAR, CANCELAR, REAGENDAR
✅ Chama actions correspondentes

### 4. actions/confirmAppointment.js
✅ Recebe appointment e notification (não mais IDs)
✅ Atualiza status para 'confirmado'
✅ Envia mensagem de confirmação
✅ Try/catch com mensagem de erro ao paciente

### 5. actions/cancelAppointment.js
✅ Recebe appointment e notification
✅ Atualiza status para 'cancelado'
✅ Envia mensagem de cancelamento
✅ Try/catch com mensagem de erro ao paciente

### 6. actions/rescheduleFlow.js
✅ Recebe appointment e notification
✅ Busca próximos 3 horários disponíveis do mesmo médico
✅ Próximos 30 dias
✅ Monta mensagem com opções numeradas (1, 2, 3)
✅ Salva opções em patient_response como JSON
✅ Atualiza status para 'aguardando_reagendamento'
✅ Envia opções ao paciente
✅ Se não houver horários: orienta contato manual

### 7. test-webhook.js (NOVO)
Script de teste para webhook:
✅ `node test-webhook.js button <phone> CONFIRMAR`
✅ `node test-webhook.js button <phone> CANCELAR`
✅ `node test-webhook.js button <phone> REAGENDAR`
✅ `node test-webhook.js text <phone> "sim, confirmo"`
✅ `node test-webhook.js reagendar <phone> 1`
✅ `node test-webhook.js fromme <phone>` (testa ignorar)
✅ Envia payload completo para /webhook/evolution
✅ Mostra resposta do servidor

## Fluxos Implementados

### Fluxo 1: Confirmação via Botão
```
1. Paciente clica "✅ Confirmar"
2. webhookHandler detecta buttonsResponseMessage
3. buttonHandler atualiza notificação
4. confirmAppointment atualiza status → 'confirmado'
5. Paciente recebe: "✅ Consulta confirmada com sucesso!"
```

### Fluxo 2: Confirmação via Texto
```
1. Paciente envia "sim, confirmo"
2. webhookHandler detecta conversation
3. textHandler chama DeepSeek AI
4. AI retorna: { intent: 'CONFIRMAR', confidence: 0.95 }
5. textHandler atualiza notificação
6. confirmAppointment atualiza status → 'confirmado'
7. Paciente recebe: "✅ Consulta confirmada com sucesso!"
```

### Fluxo 3: Cancelamento via Botão
```
1. Paciente clica "❌ Cancelar"
2. webhookHandler detecta buttonsResponseMessage
3. buttonHandler atualiza notificação
4. cancelAppointment atualiza status → 'cancelado'
5. Paciente recebe: "❌ Sua consulta foi cancelada."
```

### Fluxo 4: Cancelamento via Texto
```
1. Paciente envia "não posso ir"
2. webhookHandler detecta conversation
3. textHandler chama DeepSeek AI
4. AI retorna: { intent: 'CANCELAR', confidence: 0.88 }
5. textHandler atualiza notificação
6. cancelAppointment atualiza status → 'cancelado'
7. Paciente recebe: "❌ Sua consulta foi cancelada."
```

### Fluxo 5: Reagendamento Completo
```
1. Paciente clica "📅 Reagendar"
2. webhookHandler detecta buttonsResponseMessage
3. buttonHandler atualiza notificação
4. rescheduleFlow busca 3 horários disponíveis
5. rescheduleFlow atualiza status → 'aguardando_reagendamento'
6. rescheduleFlow salva opções em patient_response (JSON)
7. Paciente recebe:
   "📅 Escolha uma das opções:
   1. 20/03/2026 às 14:00
   2. 21/03/2026 às 10:30
   3. 22/03/2026 às 16:00
   Responda com o número (1, 2 ou 3)."

8. Paciente envia "2"
9. webhookHandler detecta status 'aguardando_reagendamento'
10. webhookHandler carrega opções do patient_response
11. webhookHandler cria novo appointment com opção escolhida
12. webhookHandler cancela appointment original
13. webhookHandler atualiza status → 'reagendado'
14. Paciente recebe:
    "✅ Reagendamento confirmado!
    🩺 Médico: Dr. João
    📅 Data: 21/03/2026
    🕐 Horário: 10:30
    📍 Rua dos Carijós, 141"
```

### Fluxo 6: Texto com Baixa Confiança
```
1. Paciente envia "talvez"
2. webhookHandler detecta conversation
3. textHandler chama DeepSeek AI
4. AI retorna: { intent: 'DESCONHECIDO', confidence: 0.45 }
5. textHandler atualiza notificação
6. Paciente recebe:
   "Não foi possível identificar sua resposta.
   Por favor, utilize os botões da mensagem anterior."
```

### Fluxo 7: Mensagem Própria (Ignorada)
```
1. Sistema envia mensagem (fromMe: true)
2. webhookHandler detecta fromMe === true
3. webhookHandler retorna sem processar
4. Log: "[webhook] Mensagem própria ignorada"
```

## Estrutura do Payload Evolution API

### Botão Clicado
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5531999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "buttonsResponseMessage": {
        "selectedButtonId": "CONFIRMAR",
        "selectedDisplayText": "✅ Confirmar"
      }
    }
  }
}
```

### Texto Simples
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5531999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "sim, confirmo"
    }
  }
}
```

### Texto Estendido
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5531999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "extendedTextMessage": {
        "text": "pode ser"
      }
    }
  }
}
```

## Integração DeepSeek AI

### Prompt do Sistema
```
Você é um classificador de intenções para mensagens de pacientes 
respondendo a confirmações de consulta.

Classifique a mensagem em:
- CONFIRMAR: paciente confirma (ex: "sim", "confirmo", "ok")
- CANCELAR: paciente cancela (ex: "não posso", "cancelar")
- REAGENDAR: paciente quer remarcar (ex: "mudar data", "outro dia")
- DESCONHECIDO: não se encaixa

Responda APENAS com a categoria e confiança 0-1.
Exemplo: "CONFIRMAR,0.95"
```

### Exemplos de Classificação
| Texto | Intent | Confidence |
|-------|--------|------------|
| "sim" | CONFIRMAR | 0.98 |
| "confirmo" | CONFIRMAR | 0.99 |
| "ok, vou" | CONFIRMAR | 0.95 |
| "não posso" | CANCELAR | 0.92 |
| "cancelar" | CANCELAR | 0.99 |
| "desmarcar" | CANCELAR | 0.96 |
| "mudar data" | REAGENDAR | 0.94 |
| "outro dia" | REAGENDAR | 0.88 |
| "remarcar" | REAGENDAR | 0.99 |
| "talvez" | DESCONHECIDO | 0.45 |
| "oi" | DESCONHECIDO | 0.30 |

## Banco de Dados

### Campos Atualizados em whatsapp_notifications
```sql
-- Resposta de botão
button_clicked = 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR'
response_type = 'button'
ai_intent = 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR'
ai_confidence = 1.0
responded_at = NOW()

-- Resposta de texto
patient_response = "sim, confirmo"
response_type = 'text'
ai_intent = 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR' | 'DESCONHECIDO'
ai_confidence = 0.0 - 1.0
responded_at = NOW()

-- Aguardando escolha de reagendamento
status = 'aguardando_reagendamento'
patient_response = '[{"date":"2026-03-20","time":"14:00",...}]'

-- Reagendamento concluído
status = 'reagendado'
```

### Status dos Appointments
```sql
-- Confirmado
status = 'confirmado'

-- Cancelado
status = 'cancelado'

-- Novo appointment criado no reagendamento
status = 'agendado'
created_by = 'paciente'
created_by_name = 'WhatsApp IA'
```

## Testes

### Teste 1: Botão CONFIRMAR
```bash
node test-webhook.js button 5531999999999 CONFIRMAR
```
Resultado esperado:
- ✅ Resposta: { received: true }
- ✅ Log: [button] João Silva clicou: CONFIRMAR
- ✅ Log: [confirm] Confirmando appointment ...
- ✅ Appointment status → 'confirmado'
- ✅ Notificação atualizada

### Teste 2: Texto "sim"
```bash
node test-webhook.js text 5531999999999 "sim, confirmo"
```
Resultado esperado:
- ✅ Resposta: { received: true }
- ✅ Log: [text] Classificando: "sim, confirmo"
- ✅ Log: [text] Resultado: CONFIRMAR (confiança: 0.95)
- ✅ Log: [confirm] Confirmando appointment ...
- ✅ Appointment status → 'confirmado'

### Teste 3: Botão REAGENDAR
```bash
node test-webhook.js button 5531999999999 REAGENDAR
```
Resultado esperado:
- ✅ Resposta: { received: true }
- ✅ Log: [reschedule] Iniciando fluxo ...
- ✅ Notificação status → 'aguardando_reagendamento'
- ✅ Paciente recebe 3 opções

### Teste 4: Escolha de Reagendamento
```bash
node test-webhook.js reagendar 5531999999999 2
```
Resultado esperado:
- ✅ Resposta: { received: true }
- ✅ Log: [webhook] Opção de reagendamento escolhida: 2
- ✅ Novo appointment criado
- ✅ Appointment original cancelado
- ✅ Notificação status → 'reagendado'

### Teste 5: Mensagem Própria
```bash
node test-webhook.js fromme 5531999999999
```
Resultado esperado:
- ✅ Resposta: { received: true }
- ✅ Log: [webhook] Mensagem própria ignorada
- ✅ Nenhum processamento

## Critérios de Aceite

### ✅ POST /webhook/evolution com botão é processado
```bash
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5531999999999@s.whatsapp.net","fromMe":false},"message":{"buttonsResponseMessage":{"selectedButtonId":"CONFIRMAR"}}}}'
```

### ✅ POST /webhook/evolution com texto chama DeepSeek
```bash
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5531999999999@s.whatsapp.net","fromMe":false},"message":{"conversation":"sim"}}}'
```

### ✅ fromMe: true é ignorado
- Log mostra "Mensagem própria ignorada"
- Nenhuma ação executada

### ✅ Notificações sem número não causam crash
- Log mostra "Nenhuma notificação pendente encontrada"
- Return sem erro

### ✅ Registro atualizado em whatsapp_notifications
```sql
SELECT 
  patient_name,
  button_clicked,
  response_type,
  ai_intent,
  ai_confidence,
  responded_at
FROM whatsapp_notifications
WHERE responded_at IS NOT NULL
ORDER BY responded_at DESC;
```

## Comandos Úteis

```bash
# Iniciar servidor
npm run dev

# Testar webhook - botões
node test-webhook.js button 5531999999999 CONFIRMAR
node test-webhook.js button 5531999999999 CANCELAR
node test-webhook.js button 5531999999999 REAGENDAR

# Testar webhook - texto
node test-webhook.js text 5531999999999 "sim, confirmo"
node test-webhook.js text 5531999999999 "não posso"
node test-webhook.js text 5531999999999 "mudar data"

# Testar reagendamento
node test-webhook.js reagendar 5531999999999 1

# Testar ignorar mensagem própria
node test-webhook.js fromme 5531999999999
```

## Próximos Passos (Sprint 4)

1. Deploy no Railway
2. Configurar webhook na Evolution API
3. Testes end-to-end em produção
4. Monitoramento e logs
5. Ajustes finos no prompt do DeepSeek
6. Dashboard de métricas (opcional)

## Status Final

🎉 Sprint 3 COMPLETA - Webhook handlers implementados e testados!
