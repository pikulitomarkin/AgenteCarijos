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
- `POST /webhook` - Webhook da Evolution API (recebe eventos do WhatsApp)
- `POST /send-immediate` - Enviar notificação imediata
  ```json
  {
    "appointmentId": "uuid",
    "phone": "5511999999999",
    "patientName": "João Silva",
    "doctorName": "Dr. Maria Santos",
    "date": "2026-03-20",
    "time": "14:30"
  }
  ```
- `POST /test-3days` - Testar job de 3 dias antes
- `POST /test-24h` - Testar job de 24h antes

## Jobs Automáticos

- **3 dias antes**: Executa diariamente às 08:00 (America/Sao_Paulo)
- **24h antes**: Executa diariamente às 09:00 (America/Sao_Paulo)

Ambos os jobs buscam agendamentos confirmados e enviam notificações via WhatsApp.

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

**URL de Produção:** `https://agentecarijos-production.up.railway.app`

1. Criar novo projeto no Railway
2. Conectar repositório Git: https://github.com/pikulitomarkin/AgenteCarijos.git
3. Configurar variáveis de ambiente (ver [RAILWAY_SETUP.md](./RAILWAY_SETUP.md))
4. Deploy automático

Ver guia completo de configuração: [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)

## Webhook Evolution API

**URL Configurada:** `https://agentecarijos-production.up.railway.app/webhook`

Configurar webhook na Evolution API apontando para a URL acima.

Eventos necessários:
- `messages.upsert` (mensagens recebidas)
- `messages.update` (atualizações de mensagens)

Ver guia completo: [EVOLUTION_API_SETUP.md](./EVOLUTION_API_SETUP.md)

---

## 📚 Documentação

- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Guia de instalação completo
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Configuração de variáveis no Railway
- [EVOLUTION_API_SETUP.md](./EVOLUTION_API_SETUP.md) - Configuração do webhook Evolution API
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guia de testes
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Referência rápida
- [PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md) - Documentação completa do projeto

---

## 🔗 Links Úteis

- **Produção:** https://agentecarijos-production.up.railway.app
- **Webhook:** https://agentecarijos-production.up.railway.app/webhook
- **Health Check:** https://agentecarijos-production.up.railway.app/health
- **Repositório:** https://github.com/pikulitomarkin/AgenteCarijos.git
