# Setup Instructions - WhatsApp Worker

## 1. Instalar dependências

```bash
cd whatsapp-worker
npm install
```

## 2. Configurar variáveis de ambiente

Copiar `.env.example` para `.env` e preencher:

```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:
- Evolution API (URL, API Key, Instance)
- DeepSeek API Key
- Supabase (URL já está correto: hkhvswfewjdrokugdqcd)
- Supabase Service Role Key (buscar no Supabase Dashboard > Settings > API)

## 3. Criar tabela no Supabase

Abrir Supabase SQL Editor e executar:
```
whatsapp-worker/CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql
```

## 4. Testar configuração

```bash
node test-setup.js
```

Deve mostrar:
- ✅ All environment variables set
- ✅ Supabase connected successfully
- ✅ Table exists

## 5. Executar localmente

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

Acessar: http://localhost:3000/health

Deve retornar:
```json
{
  "status": "ok",
  "ts": "2026-03-16T..."
}
```

## 6. Configurar webhook na Evolution API

No painel da Evolution API, configurar webhook:

**URL**: `https://seu-dominio.railway.app/webhook/evolution`

**Eventos**:
- ✅ messages.upsert

## 7. Deploy no Railway

1. Criar conta no Railway (https://railway.app)
2. New Project > Deploy from GitHub repo
3. Selecionar repositório do whatsapp-worker
4. Configurar variáveis de ambiente (mesmas do .env)
5. Deploy automático

## 8. Testar notificação imediata

```bash
curl -X POST https://seu-dominio.railway.app/notify/immediate \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "uuid-do-agendamento"}'
```

## Estrutura de Jobs

- **3 dias antes**: Roda todo dia às 9h
- **24h antes**: Roda todo dia às 10h
- **Imediato**: Via POST /notify/immediate

## Fluxo de Resposta

1. Paciente recebe mensagem com 3 botões
2. Clica em botão OU envia texto
3. Worker processa via webhook
4. Se texto: IA classifica intenção
5. Executa ação (confirmar/cancelar/reagendar)
6. Atualiza banco de dados
7. Envia confirmação ao paciente

## Troubleshooting

### Erro 401 na Evolution API
- Verificar EVOLUTION_API_KEY no .env
- Verificar se a instância está ativa

### Erro ao conectar Supabase
- Verificar SUPABASE_SERVICE_KEY (não é a anon key!)
- Verificar se a URL está correta

### Tabela não existe
- Executar CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql no SQL Editor

### Jobs não executam
- Verificar logs do Railway
- Testar localmente com npm run dev
- Verificar timezone do servidor
