# Sprint 2 - Jobs de Notificação - COMPLETO ✅

## Objetivo
Implementar lógica completa dos 3 jobs de notificação WhatsApp com regras de negócio, verificação de duplicatas e logs detalhados.

## Arquivos Atualizados

### 1. jobs/send3DaysBefore.js
- ✅ Cron às 08:00 (America/Sao_Paulo)
- ✅ Busca agendamentos para hoje + 3 dias
- ✅ Filtro: status = 'agendado'
- ✅ Verificação de duplicatas (notification_type = '3dias')
- ✅ Normalização de telefone (adiciona 55 se necessário)
- ✅ Formatação de data (dd/MM/yyyy)
- ✅ Mensagem personalizada com endereço completo
- ✅ Registro em whatsapp_notifications
- ✅ Logs detalhados: enviados, erros, pulados
- ✅ Pula silenciosamente se sem telefone

### 2. jobs/send24hBefore.js
- ✅ Cron às 09:00 (America/Sao_Paulo)
- ✅ Busca agendamentos para hoje + 1 dia
- ✅ Filtro: status IN ('agendado', 'confirmado')
- ✅ NÃO envia se status = 'cancelado'
- ✅ Verificação de duplicatas (notification_type = '24h')
- ✅ Mesma lógica de normalização e formatação
- ✅ Mesma mensagem do job 3 dias
- ✅ Logs com prefix [24h]

### 3. jobs/sendImmediate.js
- ✅ Função assíncrona exportada
- ✅ Busca appointment por ID
- ✅ Retorna erro se não encontrado
- ✅ Retorna erro se sem telefone
- ✅ Retorna erro se cancelado
- ✅ Verificação de duplicatas (notification_type = 'imediato')
- ✅ Mensagem "Agendamento Confirmado"
- ✅ Registro em whatsapp_notifications
- ✅ Logs detalhados

### 4. test-jobs.js (NOVO)
Script de teste manual para os 3 jobs:
- ✅ `node test-jobs.js 3dias` - testa job 3 dias
- ✅ `node test-jobs.js 24h` - testa job 24h
- ✅ `node test-jobs.js imediato <id>` - testa notificação imediata
- ✅ Logs coloridos e detalhados
- ✅ Mostra cada passo do processo

### 5. TESTING_GUIDE.md (NOVO)
Guia completo de testes:
- ✅ Como testar configuração
- ✅ Como testar cada job
- ✅ Como testar servidor
- ✅ Como verificar banco de dados
- ✅ Cenários de teste das regras de negócio
- ✅ Como testar webhook
- ✅ Troubleshooting

### 6. package.json
Adicionados scripts de teste:
- ✅ `npm run test:3dias`
- ✅ `npm run test:24h`
- ✅ `npm run test:setup`

## Regras de Negócio Implementadas

### ✅ Regra 1: Consulta 3+ dias antes
- Envia mensagem 3 dias antes (08:00)
- Envia mensagem 24h antes (09:00)
- Ambas são enviadas normalmente

### ✅ Regra 2: Consulta 1-3 dias antes
- NÃO envia mensagem 3 dias antes (data já passou)
- Envia APENAS mensagem 24h antes (09:00)

### ✅ Regra 3: Consulta < 24h
- Envia IMEDIATAMENTE ao agendar
- Via endpoint POST /notify/immediate
- Chamado pelo sistema principal

### ✅ Regra 4: Paciente cancelou
- Job 24h verifica status
- NÃO envia se status = 'cancelado'
- Evita mensagem desnecessária

### ✅ Regra 5: Paciente confirmou na 1ª
- Job 24h inclui status 'confirmado' no filtro
- Envia 2ª mensagem normalmente
- Reforça confirmação

### ✅ Regra 6: NUNCA duplicar
- Verifica whatsapp_notifications antes de enviar
- Checa por appointment_id + notification_type
- Pula silenciosamente se já enviado

## Funcionalidades Adicionais

### Normalização de Telefone
```javascript
function normalizePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}
```

### Formatação de Data
```javascript
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR'); // dd/MM/yyyy
}
```

### Logs Estruturados
```
[3dias] Iniciando job...
[3dias] Buscando agendamentos para 2026-03-19
[3dias] Encontrados 5 agendamentos
[3dias] Enviado para João Silva
[3dias] PULAR: já enviado para Maria Santos
[3dias] Erro ao processar Pedro Costa: Invalid phone
[3dias] Concluído: 2 enviados, 1 erros, 2 pulados
```

## Mensagens WhatsApp

### Template Padrão (3 dias e 24h)
```
Título: Confirmação de Consulta

Prezado(a) {nome},

Você possui uma consulta em 3 dias:

🩺 Médico: {médico}
📅 Data: {dd/MM/yyyy}
🕐 Horário: {HH:mm}
📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH

Por favor, confirme sua presença:

[✅ Confirmar] [❌ Cancelar] [📅 Reagendar]

Footer: Clínica Carijós — Especialidades Médicas
```

### Template Imediato
```
Título: Agendamento Confirmado

Prezado(a) {nome},

Seu agendamento foi realizado:

🩺 Médico: {médico}
📅 Data: {dd/MM/yyyy}
🕐 Horário: {HH:mm}
📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH

Confirme sua presença:

[✅ Confirmar] [❌ Cancelar] [📅 Reagendar]

Footer: Clínica Carijós — Especialidades Médicas
```

## Testes Realizados

### ✅ Teste 1: Configuração
```bash
npm run test:setup
```
- Verifica variáveis de ambiente
- Testa conexão Supabase
- Verifica tabela whatsapp_notifications

### ✅ Teste 2: Job 3 dias
```bash
npm run test:3dias
```
- Busca agendamentos corretos
- Verifica duplicatas
- Envia mensagens
- Registra no banco

### ✅ Teste 3: Job 24h
```bash
npm run test:24h
```
- Inclui status 'confirmado'
- Exclui status 'cancelado'
- Verifica duplicatas
- Envia mensagens

### ✅ Teste 4: Notificação imediata
```bash
node test-jobs.js imediato <id>
```
- Busca por ID específico
- Valida telefone e status
- Verifica duplicata
- Envia mensagem

## Critérios de Aceite

### ✅ Logs "Cron job registrado" aparecem ao iniciar
```
[3dias] Cron job registrado (diariamente às 08:00 - America/Sao_Paulo)
[24h] Cron job registrado (diariamente às 09:00 - America/Sao_Paulo)
```

### ✅ Executar manualmente insere registros
```sql
SELECT * FROM whatsapp_notifications 
WHERE notification_type = '3dias' 
ORDER BY sent_at DESC;
```

### ✅ POST /notify/immediate funciona
```bash
curl -X POST http://localhost:3000/notify/immediate \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "uuid"}'
```

### ✅ Não duplica se rodar duas vezes
- Primeira execução: envia
- Segunda execução: pula (log "já enviado")

### ✅ Ignora silenciosamente sem telefone
- Não gera erro
- Apenas incrementa contador "pulados"

## Próximos Passos (Sprint 3)

1. Implementar handlers de webhook
   - buttonHandler.js
   - textHandler.js
   - webhookHandler.js

2. Implementar actions
   - confirmAppointment.js
   - cancelAppointment.js
   - rescheduleFlow.js

3. Integrar DeepSeek AI
   - Classificação de intenções
   - Processamento de texto

4. Testes end-to-end
   - Fluxo completo de confirmação
   - Fluxo completo de cancelamento
   - Fluxo completo de reagendamento

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Testar configuração
npm run test:setup

# Testar jobs
npm run test:3dias
npm run test:24h
node test-jobs.js imediato <id>

# Iniciar servidor
npm run dev

# Health check
curl http://localhost:3000/health

# Notificação imediata
curl -X POST http://localhost:3000/notify/immediate \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "uuid"}'
```

## Status Final

🎉 Sprint 2 COMPLETA - Todos os jobs implementados e testados!
