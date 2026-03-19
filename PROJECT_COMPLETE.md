# WhatsApp Worker - Projeto Completo ✅

## Visão Geral

Worker Node.js para automação de notificações WhatsApp e processamento inteligente de respostas de pacientes da Clínica Carijós.

## Stack Tecnológica

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express
- **Cron**: node-cron
- **WhatsApp**: Evolution API
- **IA**: DeepSeek API
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Railway

## Sprints Concluídas

### ✅ Sprint 1: Estrutura e Services
- Estrutura de pastas completa
- Cliente Supabase com service role
- Wrapper Evolution API (sendButtons, sendText)
- Classificador DeepSeek AI
- Servidor Express com endpoints
- Migration da tabela whatsapp_notifications

### ✅ Sprint 2: Jobs de Notificação
- Job 3 dias antes (08:00 America/Sao_Paulo)
- Job 24h antes (09:00 America/Sao_Paulo)
- Notificação imediata via API
- Verificação de duplicatas
- Normalização de telefone
- Logs estruturados
- Script de testes manuais

### ✅ Sprint 3: Webhook Handlers
- webhookHandler com resposta imediata
- buttonHandler para cliques
- textHandler com IA
- Fluxo de reagendamento (aguarda escolha)
- Ignora mensagens próprias
- Atualiza whatsapp_notifications
- Script de testes de webhook

### ✅ Sprint 4: Actions Completas
- confirmAppointment com auditoria
- cancelAppointment com liberação de horário
- rescheduleFlow com busca real de disponibilidade
- Geração de horários de slots
- Verificação de ocupação
- Mensagens personalizadas

## Funcionalidades Principais

### 1. Notificações Automáticas

| Tipo | Quando | Horário | Mensagem |
|------|--------|---------|----------|
| 3 dias antes | Consulta em 3 dias | 08:00 | "Você possui uma consulta em 3 dias..." |
| 24h antes | Consulta amanhã | 09:00 | "Você possui uma consulta em 3 dias..." |
| Imediato | Consulta < 24h | On-demand | "Seu agendamento foi realizado..." |

### 2. Processamento de Respostas

| Entrada | Processamento | Ação |
|---------|---------------|------|
| Botão "✅ Confirmar" | buttonHandler | Confirma consulta |
| Texto "sim" | textHandler + IA | Confirma consulta |
| Botão "❌ Cancelar" | buttonHandler | Cancela consulta |
| Texto "não posso" | textHandler + IA | Cancela consulta |
| Botão "📅 Reagendar" | rescheduleFlow | Oferece 3 opções |
| Texto "2" | webhookHandler | Cria novo agendamento |

### 3. Inteligência Artificial

- **Modelo**: DeepSeek Chat
- **Confiança mínima**: 0.7
- **Intenções**: CONFIRMAR, CANCELAR, REAGENDAR, DESCONHECIDO
- **Exemplos**:
  - "sim" → CONFIRMAR (0.98)
  - "não posso" → CANCELAR (0.92)
  - "mudar data" → REAGENDAR (0.94)

### 4. Reagendamento Inteligente

1. Busca especialidade do médico original
2. Encontra todos os médicos com essa especialidade
3. Busca schedule_slots dos próximos dias
4. Gera horários de cada slot (start → end com interval)
5. Verifica appointments existentes
6. Coleta até 3 horários livres
7. Oferece opções ao paciente
8. Aguarda escolha (1, 2 ou 3)
9. Cria novo appointment
10. Cancela appointment original

## Estrutura de Arquivos

```
whatsapp-worker/
├── index.js                          # Servidor Express
├── package.json                      # Dependências
├── .env.example                      # Template de variáveis
├── jobs/                             # Cron jobs
│   ├── send3DaysBefore.js           # Job 3 dias antes
│   ├── send24hBefore.js             # Job 24h antes
│   └── sendImmediate.js             # Notificação imediata
├── handlers/                         # Processadores de webhook
│   ├── webhookHandler.js            # Handler principal
│   ├── buttonHandler.js             # Processa botões
│   └── textHandler.js               # Processa texto + IA
├── actions/                          # Ações de negócio
│   ├── confirmAppointment.js        # Confirma consulta
│   ├── cancelAppointment.js         # Cancela consulta
│   └── rescheduleFlow.js            # Fluxo de reagendamento
├── services/                         # Integrações externas
│   ├── supabase.js                  # Cliente Supabase
│   ├── evolutionApi.js              # Wrapper Evolution API
│   └── deepseek.js                  # Classificador IA
├── test-setup.js                     # Testa configuração
├── test-jobs.js                      # Testa jobs manualmente
├── test-webhook.js                   # Testa webhook
├── CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql  # Migration
├── README.md                         # Visão geral
├── SETUP_INSTRUCTIONS.md             # Setup passo a passo
├── TESTING_GUIDE.md                  # Guia de testes
├── QUICK_REFERENCE.md                # Referência rápida
├── SPRINT1_COMPLETE.md               # Resumo Sprint 1
├── SPRINT2_COMPLETE.md               # Resumo Sprint 2
├── SPRINT3_COMPLETE.md               # Resumo Sprint 3
├── SPRINT4_COMPLETE.md               # Resumo Sprint 4
└── PROJECT_COMPLETE.md               # Este arquivo
```

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /health | Health check |
| POST | /webhook/evolution | Recebe eventos do WhatsApp |
| POST | /notify/immediate | Envia notificação imediata |

## Banco de Dados

### Tabela: whatsapp_notifications

```sql
CREATE TABLE whatsapp_notifications (
  id                UUID PRIMARY KEY,
  appointment_id    UUID REFERENCES appointments(id),
  patient_phone     TEXT NOT NULL,
  patient_name      TEXT,
  doctor_name       TEXT,
  appointment_date  DATE,
  appointment_time  TIME,
  notification_type TEXT DEFAULT '24h',  -- 3dias, 24h, imediato
  sent_at           TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'enviado',  -- enviado, confirmado, cancelado, aguardando_reagendamento, reagendado
  patient_response  TEXT,  -- Texto enviado ou JSON com opções
  button_clicked    TEXT,  -- CONFIRMAR, CANCELAR, REAGENDAR
  response_type     TEXT,  -- button, text
  ai_intent         TEXT,  -- CONFIRMAR, CANCELAR, REAGENDAR, DESCONHECIDO
  ai_confidence     FLOAT,  -- 0.0 - 1.0
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Campos de Auditoria - appointments

```sql
-- Confirmação
status = 'confirmado'
confirmed_by_name = 'WhatsApp IA'
confirmed_at = TIMESTAMPTZ

-- Cancelamento
status = 'cancelado'

-- Reagendamento (novo appointment)
created_by = 'paciente'
created_by_name = 'WhatsApp IA'
```

## Regras de Negócio

### 1. Envio de Notificações

- **Consulta 3+ dias antes**: Envia 3 dias antes E 24h antes
- **Consulta 1-3 dias antes**: Envia APENAS 24h antes
- **Consulta < 24h**: Envia IMEDIATAMENTE ao agendar
- **Paciente cancelou**: NÃO envia 2ª mensagem
- **Paciente confirmou na 1ª**: Envia 2ª normalmente
- **NUNCA duplicar**: Verifica whatsapp_notifications antes de enviar

### 2. Processamento de Respostas

- **Botão**: Confiança = 1.0, executa ação imediatamente
- **Texto**: Classifica com IA, executa se confiança >= 0.7
- **Confiança baixa**: Pede uso dos botões
- **Mensagem própria (fromMe: true)**: Ignora
- **Sem notificação pendente**: Ignora silenciosamente

### 3. Reagendamento

- **Busca**: Mesma especialidade, qualquer médico
- **Período**: Próximos dias (até 20 slots)
- **Limite**: Até 3 opções
- **Verificação**: Horários não ocupados (status != 'cancelado')
- **Sem horários**: Orienta contato manual
- **Escolha**: Cria novo + cancela original

## Comandos Úteis

```bash
# Setup
npm install
cp .env.example .env
npm run test:setup

# Desenvolvimento
npm run dev

# Testes
npm run test:3dias
npm run test:24h
node test-jobs.js imediato <appointment_id>
node test-webhook.js button <phone> CONFIRMAR
node test-webhook.js text <phone> "sim"
node test-webhook.js reagendar <phone> 2

# Produção
npm start
```

## Variáveis de Ambiente

```bash
# Evolution API
EVOLUTION_API_URL=https://...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=carijos-clinica

# DeepSeek AI
DEEPSEEK_API_KEY=...

# Supabase
SUPABASE_URL=https://hkhvswfewjdrokugdqcd.supabase.co
SUPABASE_SERVICE_KEY=...

# Server
PORT=3000
WEBHOOK_SECRET=...
```

## Deploy Railway

1. Criar projeto no Railway
2. Conectar repositório Git
3. Configurar variáveis de ambiente
4. Deploy automático
5. Configurar webhook na Evolution API:
   - URL: `https://seu-dominio.railway.app/webhook/evolution`
   - Evento: `messages.upsert`

## Métricas e Monitoramento

### Queries Úteis

```sql
-- Total de notificações por tipo
SELECT notification_type, COUNT(*) 
FROM whatsapp_notifications 
GROUP BY notification_type;

-- Taxa de resposta
SELECT 
  COUNT(*) FILTER (WHERE responded_at IS NOT NULL) * 100.0 / COUNT(*) AS taxa_resposta
FROM whatsapp_notifications;

-- Distribuição de intenções
SELECT ai_intent, COUNT(*) 
FROM whatsapp_notifications 
WHERE ai_intent IS NOT NULL 
GROUP BY ai_intent;

-- Confiança média da IA
SELECT AVG(ai_confidence) 
FROM whatsapp_notifications 
WHERE response_type = 'text';

-- Reagendamentos concluídos
SELECT COUNT(*) 
FROM whatsapp_notifications 
WHERE status = 'reagendado';
```

## Próximos Passos (Futuro)

1. Dashboard de métricas
2. Relatório de efetividade
3. A/B testing de mensagens
4. Lembretes de retorno
5. Pesquisa de satisfação pós-consulta
6. Integração com calendário
7. Notificações de atraso do médico
8. Confirmação de chegada (check-in)

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Job não envia | Verificar data/status/telefone dos agendamentos |
| Erro 401 Evolution | Verificar EVOLUTION_API_KEY |
| Erro Supabase | Verificar SUPABASE_SERVICE_KEY (service role) |
| IA não classifica | Verificar DEEPSEEK_API_KEY |
| Webhook não processa | Verificar URL configurada na Evolution API |
| Duplicatas | Verificar lógica de verificação em cada job |
| Sem horários | Verificar schedule_slots e appointments |

## Contatos

- **Clínica**: (31) 3222-1000
- **Site**: grupocarijos.com.br
- **Endereço**: Rua dos Carijós, 141 - 6º Andar, Centro - BH

## Status do Projeto

🎉 **PROJETO COMPLETO E FUNCIONAL**

- ✅ 4 Sprints concluídas
- ✅ Todos os critérios de aceite atendidos
- ✅ Testes implementados
- ✅ Documentação completa
- ✅ Pronto para deploy em produção

---

**Desenvolvido para Clínica Carijós**
**Março 2026**
