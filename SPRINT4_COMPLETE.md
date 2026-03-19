# Sprint 4 - Actions Completas - COMPLETO ✅

## Objetivo
Implementar lógica completa das actions com busca real de horários disponíveis, atualização de campos de auditoria e mensagens personalizadas.

## Arquivos Atualizados

### 1. actions/confirmAppointment.js
✅ Atualiza appointments:
  - status = 'confirmado'
  - confirmed_by_name = 'WhatsApp IA'
  - confirmed_at = NOW()
  - updated_at = NOW()

✅ Atualiza whatsapp_notifications:
  - status = 'confirmado'

✅ Mensagem personalizada:
  - Nome do médico
  - Data formatada (dd/MM/yyyy)
  - Horário (HH:mm)
  - Endereço completo

✅ Log: "[confirm] {patient_name} confirmou"

### 2. actions/cancelAppointment.js
✅ Atualiza appointments:
  - status = 'cancelado'
  - updated_at = NOW()
  - Horário fica automaticamente liberado

✅ Atualiza whatsapp_notifications:
  - status = 'cancelado'

✅ Mensagem com contato:
  - Telefone: (31) 3222-1000
  - Site: grupocarijos.com.br

✅ Log: "[cancel] {patient_name} cancelou"

### 3. actions/rescheduleFlow.js
✅ Busca especialidade do médico:
  - Prioriza specialties[0]
  - Fallback para specialty

✅ Busca médicos com mesma especialidade:
  - Filtro: specialty = X OR X IN specialties
  - Apenas ativos e não deletados

✅ Busca schedule_slots:
  - Próximos 20 slots
  - Data > hoje
  - JOIN com appointments

✅ Gera horários de cada slot:
  - start_time → end_time
  - Intervalo de interval_minutes
  - Exemplo: 14:00 → 18:00 com 30min = [14:00, 14:30, 15:00, ...]

✅ Verifica disponibilidade:
  - Horário ocupado = appointment com status != 'cancelado' AND deleted_at IS NULL
  - Coleta até 3 horários livres

✅ Salva opções em patient_response (JSON):
  ```json
  [
    {
      "doctor_id": "uuid",
      "doctor_name": "Dr. João",
      "date": "2026-03-20",
      "time": "14:00"
    }
  ]
  ```

✅ Atualiza whatsapp_notifications:
  - status = 'aguardando_reagendamento'

✅ Mensagem formatada:
  - Especialidade
  - Nome do médico
  - Data com dia da semana
  - Horário
  - Instrução para responder com número

✅ Se sem horários: orienta contato manual

✅ Log: "[reschedule] Opções enviadas para {patient_name}"

## Funções Auxiliares

### formatDate() - confirmAppointment.js
```javascript
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
```
Entrada: "2026-03-20"
Saída: "20/03/2026"

### formatDate() - rescheduleFlow.js
```javascript
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const [year, month, day] = dateStr.split('-');
  const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const weekday = weekdays[date.getDay()];
  return `${day}/${month}/${year} (${weekday})`;
}
```
Entrada: "2026-03-20"
Saída: "20/03/2026 (sexta)"

### generateTimeSlots()
```javascript
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }
  
  return slots;
}
```
Entrada: "14:00", "18:00", 30
Saída: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"]

## Fluxos Completos

### Fluxo 1: Confirmação
```
1. Paciente clica "✅ Confirmar" ou envia "sim"
2. confirmAppointment() é chamada
3. UPDATE appointments:
   - status = 'confirmado'
   - confirmed_by_name = 'WhatsApp IA'
   - confirmed_at = '2026-03-16T10:30:00Z'
4. UPDATE whatsapp_notifications:
   - status = 'confirmado'
5. Paciente recebe:
   "✅ Sua consulta foi confirmada com sucesso!
   
   🩺 Dr. João Silva
   📅 20/03/2026 às 14:30
   
   Aguardamos sua presença na Clínica Carijós.
   📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH"
```

### Fluxo 2: Cancelamento
```
1. Paciente clica "❌ Cancelar" ou envia "não posso"
2. cancelAppointment() é chamada
3. UPDATE appointments:
   - status = 'cancelado'
4. UPDATE whatsapp_notifications:
   - status = 'cancelado'
5. Horário fica automaticamente liberado
6. Paciente recebe:
   "❌ Sua consulta foi cancelada.
   
   Quando desejar remarcar, entre em contato:
   📞 (31) 3222-1000
   🌐 grupocarijos.com.br
   
   Agradecemos a comunicação. Clínica Carijós."
```

### Fluxo 3: Reagendamento Completo
```
1. Paciente clica "📅 Reagendar"
2. rescheduleFlow() é chamada
3. Busca especialidade do médico original
4. Busca todos os médicos com essa especialidade
5. Busca schedule_slots dos próximos dias
6. Para cada slot:
   - Gera todos os horários (start → end com interval)
   - Verifica appointments existentes
   - Marca horários ocupados
   - Coleta horários livres
7. Coleta até 3 horários livres no total
8. UPDATE whatsapp_notifications:
   - status = 'aguardando_reagendamento'
   - patient_response = JSON com opções
9. Paciente recebe:
   "📅 Horários disponíveis para Cardiologia:
   
   1. Dr. João Silva — 20/03/2026 (sexta) às 14:00
   2. Dra. Maria Santos — 21/03/2026 (sábado) às 10:30
   3. Dr. João Silva — 22/03/2026 (domingo) às 16:00
   
   Responda com o número da opção desejada (1, 2 ou 3)."

10. Paciente envia "2"
11. webhookHandler processa (já implementado no Sprint 3):
    - Carrega opções do patient_response
    - Cria novo appointment com dados da opção 2
    - Cancela appointment original
    - UPDATE whatsapp_notifications: status = 'reagendado'
12. Paciente recebe:
    "✅ Reagendamento confirmado!
    
    🩺 Dra. Maria Santos
    📅 21/03/2026
    🕐 10:30
    📍 Rua dos Carijós, 141 - 6º Andar, Centro - BH
    
    Aguardamos você!"
```

## Exemplo de Dados

### schedule_slots
```sql
id | doctor_id | date       | start_time | end_time | interval_minutes
---|-----------|------------|------------|----------|------------------
1  | uuid-1    | 2026-03-20 | 14:00:00   | 18:00:00 | 30
2  | uuid-2    | 2026-03-21 | 09:00:00   | 12:00:00 | 30
```

### appointments (ocupados)
```sql
id | doctor_id | date       | time     | status    | deleted_at
---|-----------|------------|----------|-----------|------------
a1 | uuid-1    | 2026-03-20 | 14:00:00 | agendado  | NULL
a2 | uuid-1    | 2026-03-20 | 14:30:00 | cancelado | NULL
a3 | uuid-1    | 2026-03-20 | 15:00:00 | agendado  | NULL
```

### Horários gerados do slot 1
```
14:00 → OCUPADO (a1 com status 'agendado')
14:30 → LIVRE (a2 com status 'cancelado')
15:00 → OCUPADO (a3 com status 'agendado')
15:30 → LIVRE
16:00 → LIVRE
16:30 → LIVRE
17:00 → LIVRE
17:30 → LIVRE
```

### Opções coletadas (até 3)
```json
[
  {
    "doctor_id": "uuid-1",
    "doctor_name": "Dr. João Silva",
    "date": "2026-03-20",
    "time": "14:30"
  },
  {
    "doctor_id": "uuid-1",
    "doctor_name": "Dr. João Silva",
    "date": "2026-03-20",
    "time": "15:30"
  },
  {
    "doctor_id": "uuid-1",
    "doctor_name": "Dr. João Silva",
    "date": "2026-03-20",
    "time": "16:00"
  }
]
```

## Banco de Dados

### Campos de Auditoria - appointments
```sql
-- Confirmação
status = 'confirmado'
confirmed_by_name = 'WhatsApp IA'
confirmed_at = '2026-03-16T10:30:00Z'

-- Cancelamento
status = 'cancelado'

-- Novo appointment (reagendamento)
status = 'agendado'
created_by = 'paciente'
created_by_name = 'WhatsApp IA'
```

### Status - whatsapp_notifications
```sql
-- Após confirmação
status = 'confirmado'

-- Após cancelamento
status = 'cancelado'

-- Aguardando escolha de reagendamento
status = 'aguardando_reagendamento'
patient_response = '[{"doctor_id":"...","date":"...","time":"..."}]'

-- Após reagendamento concluído
status = 'reagendado'
```

## Queries SQL Úteis

### Ver confirmações
```sql
SELECT 
  patient_name,
  doctor_name,
  date,
  time,
  confirmed_by_name,
  confirmed_at
FROM appointments
WHERE status = 'confirmado'
  AND confirmed_by_name = 'WhatsApp IA'
ORDER BY confirmed_at DESC;
```

### Ver cancelamentos via WhatsApp
```sql
SELECT 
  a.patient_name,
  a.doctor_name,
  a.date,
  a.time,
  wn.responded_at
FROM appointments a
JOIN whatsapp_notifications wn ON wn.appointment_id = a.id
WHERE a.status = 'cancelado'
  AND wn.status = 'cancelado'
ORDER BY wn.responded_at DESC;
```

### Ver reagendamentos
```sql
SELECT 
  wn.patient_name,
  wn.doctor_name AS doctor_original,
  wn.appointment_date AS date_original,
  a.doctor_name AS doctor_novo,
  a.date AS date_novo,
  a.time AS time_novo
FROM whatsapp_notifications wn
JOIN appointments a ON a.patient_phone = wn.patient_phone
WHERE wn.status = 'reagendado'
  AND a.created_by_name = 'WhatsApp IA'
  AND a.status = 'agendado'
ORDER BY a.created_at DESC;
```

### Ver horários disponíveis para reagendamento
```sql
WITH time_slots AS (
  SELECT 
    ss.doctor_id,
    d.name AS doctor_name,
    ss.date,
    generate_series(
      ss.start_time::time,
      ss.end_time::time - interval '1 minute',
      (ss.interval_minutes || ' minutes')::interval
    )::time AS time_slot
  FROM schedule_slots ss
  JOIN doctors d ON d.id = ss.doctor_id
  WHERE ss.date > CURRENT_DATE
)
SELECT 
  ts.doctor_name,
  ts.date,
  ts.time_slot
FROM time_slots ts
LEFT JOIN appointments a ON 
  a.doctor_id = ts.doctor_id 
  AND a.date = ts.date 
  AND a.time::time = ts.time_slot
  AND a.status != 'cancelado'
  AND a.deleted_at IS NULL
WHERE a.id IS NULL
ORDER BY ts.date, ts.time_slot
LIMIT 10;
```

## Testes

### Teste 1: Confirmação
```bash
# Criar notificação de teste
# Clicar CONFIRMAR via test-webhook.js
node test-webhook.js button 5531999999999 CONFIRMAR

# Verificar no banco
SELECT status, confirmed_by_name, confirmed_at 
FROM appointments 
WHERE id = 'appointment-id';
```

### Teste 2: Cancelamento
```bash
# Clicar CANCELAR
node test-webhook.js button 5531999999999 CANCELAR

# Verificar no banco
SELECT status FROM appointments WHERE id = 'appointment-id';
SELECT status FROM whatsapp_notifications WHERE id = 'notification-id';
```

### Teste 3: Reagendamento
```bash
# Clicar REAGENDAR
node test-webhook.js button 5531999999999 REAGENDAR

# Verificar mensagem recebida com 3 opções
# Escolher opção 2
node test-webhook.js reagendar 5531999999999 2

# Verificar no banco
SELECT * FROM appointments 
WHERE patient_phone = '5531999999999' 
  AND created_by_name = 'WhatsApp IA'
ORDER BY created_at DESC LIMIT 1;
```

## Critérios de Aceite

### ✅ Clicar CONFIRMAR
- appointment.status = 'confirmado'
- appointment.confirmed_by_name = 'WhatsApp IA'
- appointment.confirmed_at preenchido
- whatsapp_notifications.status = 'confirmado'
- Mensagem personalizada enviada

### ✅ Clicar CANCELAR
- appointment.status = 'cancelado'
- whatsapp_notifications.status = 'cancelado'
- Mensagem com contato enviada

### ✅ Clicar REAGENDAR
- Busca horários reais disponíveis
- Verifica appointments existentes
- Coleta até 3 opções
- whatsapp_notifications.status = 'aguardando_reagendamento'
- patient_response contém JSON com opções
- Mensagem formatada com dia da semana

### ✅ Responder "2"
- Novo appointment criado
- Appointment original cancelado
- whatsapp_notifications.status = 'reagendado'
- Mensagem de confirmação enviada

### ✅ Sem horários disponíveis
- Não causa crash
- Mensagem orienta contato manual

## Status Final

🎉 Sprint 4 COMPLETA - Actions implementadas com busca real de horários!
