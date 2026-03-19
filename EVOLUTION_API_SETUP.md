# 🔗 Configuração Evolution API - WhatsApp Worker

## 📋 Informações do Webhook

**URL do Webhook:** `https://agentecarijos-production.up.railway.app/webhook`

Este webhook recebe eventos do WhatsApp via Evolution API e processa:
- Mensagens de texto (classificadas por IA)
- Cliques em botões (CONFIRMAR, CANCELAR, REAGENDAR)
- Respostas de reagendamento

---

## ⚙️ Configurar Webhook na Evolution API

### Via Dashboard Evolution API

1. Acesse o dashboard da sua instância Evolution API
2. Vá em **Configurações** > **Webhooks**
3. Configure o webhook:

```json
{
  "url": "https://agentecarijos-production.up.railway.app/webhook",
  "enabled": true,
  "events": [
    "messages.upsert",
    "messages.update"
  ]
}
```

### Via API (alternativa)

```bash
curl -X POST 'https://sua-evolution-api.com/webhook/set/carijos-clinica' \
  -H 'apikey: SUA_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://agentecarijos-production.up.railway.app/webhook",
    "enabled": true,
    "events": [
      "messages.upsert",
      "messages.update"
    ]
  }'
```

---

## 🔐 Variáveis de Ambiente

Certifique-se que estas variáveis estão configuradas no Railway:

```env
# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key-aqui
EVOLUTION_INSTANCE=carijos-clinica

# Webhook (opcional - para validação)
WEBHOOK_SECRET=seu-secret-aleatorio
```

---

## 📨 Eventos Processados

### 1. messages.upsert
Disparado quando uma nova mensagem chega:
- Mensagens de texto → Classificadas por IA (DeepSeek)
- Cliques em botões → Processados diretamente

### 2. messages.update
Disparado quando uma mensagem é atualizada:
- Status de entrega
- Status de leitura

---

## 🧪 Testar o Webhook

### 1. Health Check

```bash
curl https://agentecarijos-production.up.railway.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-03-19T..."
}
```

### 2. Enviar Notificação de Teste

```bash
curl -X POST https://agentecarijos-production.up.railway.app/send-immediate \
  -H 'Content-Type: application/json' \
  -d '{
    "appointmentId": "uuid-do-agendamento",
    "phone": "5511999999999",
    "patientName": "João Silva",
    "doctorName": "Dr. Maria Santos",
    "date": "2026-03-20",
    "time": "14:30"
  }'
```

### 3. Simular Webhook (desenvolvimento)

```bash
curl -X POST https://agentecarijos-production.up.railway.app/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "messages.upsert",
    "instance": "carijos-clinica",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "test-message-id"
      },
      "message": {
        "conversation": "confirmar"
      }
    }
  }'
```

---

## 🔍 Fluxo de Processamento

### Mensagem de Texto

```
WhatsApp → Evolution API → Webhook
  ↓
textHandler.js
  ↓
DeepSeek AI (classificação)
  ↓
Ação correspondente:
  - CONFIRMAR → confirmAppointment.js
  - CANCELAR → cancelAppointment.js
  - REAGENDAR → rescheduleFlow.js
  - OUTROS → resposta padrão
```

### Clique em Botão

```
WhatsApp → Evolution API → Webhook
  ↓
buttonHandler.js
  ↓
Ação direta (sem IA):
  - CONFIRMAR → confirmAppointment.js
  - CANCELAR → cancelAppointment.js
  - REAGENDAR → rescheduleFlow.js
  - OPCAO_1/2/3 → rescheduleFlow.js (escolha)
```

---

## 📊 Logs e Monitoramento

### Ver Logs no Railway

1. Acesse o dashboard do Railway
2. Clique em "Deployments"
3. Selecione o deployment ativo
4. Veja logs em tempo real

### Logs Importantes

```
✅ Webhook recebido de 5511999999999
✅ Botão detectado: CONFIRMAR
✅ Consulta confirmada: appointment-id
✅ Notificação enviada com sucesso

⚠️ Mensagem sem appointment_id no contexto
⚠️ Confiança baixa na classificação: 0.5

❌ Erro ao enviar mensagem: timeout
❌ Erro ao buscar agendamento: not found
```

---

## 🔧 Troubleshooting

### Webhook não recebe eventos

1. Verifique se o webhook está ativo na Evolution API:
```bash
curl 'https://sua-evolution-api.com/webhook/find/carijos-clinica' \
  -H 'apikey: SUA_API_KEY'
```

2. Confirme que a URL está correta:
```
https://agentecarijos-production.up.railway.app/webhook
```

3. Teste se o endpoint está acessível:
```bash
curl https://agentecarijos-production.up.railway.app/health
```

### Mensagens não são processadas

1. Verifique os logs do Railway
2. Confirme que `DEEPSEEK_API_KEY` está configurada
3. Teste a classificação manualmente:
```bash
curl -X POST https://agentecarijos-production.up.railway.app/test-classification \
  -H 'Content-Type: application/json' \
  -d '{"text": "quero confirmar minha consulta"}'
```

### Botões não funcionam

1. Verifique se os botões estão sendo enviados corretamente
2. Confirme que o payload do botão contém o `appointment_id`
3. Veja os logs para identificar o erro específico

---

## 📝 Formato das Mensagens Enviadas

### Notificação 3 Dias Antes

```
🏥 *Lembrete de Consulta*

Olá [Nome]! Sua consulta está agendada para:

📅 Data: [DD/MM/YYYY]
🕐 Horário: [HH:MM]
👨‍⚕️ Médico(a): [Nome do Médico]
📍 Local: Clínica Carijós

Por favor, confirme sua presença:
```

Com 3 botões:
- ✅ CONFIRMAR
- ❌ CANCELAR
- 📅 REAGENDAR

### Notificação 24h Antes

```
⏰ *Lembrete: Consulta Amanhã*

Olá [Nome]! Sua consulta é amanhã:

📅 Data: [DD/MM/YYYY]
🕐 Horário: [HH:MM]
👨‍⚕️ Médico(a): [Nome do Médico]

Confirme sua presença:
```

Com os mesmos 3 botões.

### Opções de Reagendamento

```
📅 *Escolha uma nova data/horário:*

1️⃣ [DD/MM] às [HH:MM]
2️⃣ [DD/MM] às [HH:MM]
3️⃣ [DD/MM] às [HH:MM]

Responda com o número da opção desejada.
```

Com 3 botões:
- 1️⃣ OPCAO_1
- 2️⃣ OPCAO_2
- 3️⃣ OPCAO_3

---

## 🔗 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/webhook` | Recebe eventos da Evolution API |
| POST | `/send-immediate` | Envia notificação imediata |
| POST | `/test-3days` | Testa job de 3 dias |
| POST | `/test-24h` | Testa job de 24h |

---

## ✅ Checklist de Configuração

- [x] Webhook URL definida: `https://agentecarijos-production.up.railway.app/webhook`
- [ ] Webhook configurado na Evolution API
- [ ] Eventos habilitados: `messages.upsert`, `messages.update`
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Health check respondendo
- [ ] Teste de notificação funcionando
- [ ] Teste de webhook funcionando
- [ ] Logs sem erros

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Railway
2. Teste os endpoints manualmente
3. Confirme as credenciais da Evolution API
4. Verifique se a instância está ativa

---

**URL do Webhook:** `https://agentecarijos-production.up.railway.app/webhook`  
**Criado em:** 19/03/2026  
**Versão:** 1.0.0
