# WhatsApp Worker - Clínica Carijós

Worker Node.js para envio automático de notificações WhatsApp e processamento de respostas dos pacientes.

## Stack

- Node.js + Express
- node-cron (agendamento de jobs)
- Evolution API (envio WhatsApp)
- DeepSeek AI (classificação de intenções)
- Supabase (banco de dados)

## Instalação

```bash
cd whatsapp-worker
npm install
```

## Configuração

1. Copiar `.env.example` para `.env`
2. Preencher as variáveis de ambiente:
   - `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`
   - `DEEPSEEK_API_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
3. Executar `CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql` no Supabase SQL Editor

## Executar

```bash
# Produção
npm start

# Desenvolvimento (com nodemon)
npm run dev
```

## Endpoints

- `GET /health` - Health check
- `POST /webhook/evolution` - Webhook da Evolution API
- `POST /notify/immediate` - Enviar notificação imediata
  ```json
  { "appointment_id": "uuid" }
  ```

## Jobs Automáticos

- **3 dias antes**: Executa diariamente às 9h
- **24h antes**: Executa diariamente às 10h

## Estrutura

```
whatsapp-worker/
├── index.js                    # Servidor Express
├── jobs/                       # Cron jobs
│   ├── send3DaysBefore.js
│   ├── send24hBefore.js
│   └── sendImmediate.js
├── handlers/                   # Processadores de webhook
│   ├── webhookHandler.js
│   ├── buttonHandler.js
│   └── textHandler.js
├── actions/                    # Ações de negócio
│   ├── confirmAppointment.js
│   ├── cancelAppointment.js
│   └── rescheduleFlow.js
└── services/                   # Integrações externas
    ├── evolutionApi.js
    ├── deepseek.js
    └── supabase.js
```

## Deploy Railway

1. Criar novo projeto no Railway
2. Conectar repositório Git
3. Configurar variáveis de ambiente
4. Deploy automático

## Webhook Evolution API

Configurar webhook na Evolution API apontando para:
```
https://seu-dominio.railway.app/webhook/evolution
```

Eventos necessários:
- `messages.upsert` (mensagens recebidas)
