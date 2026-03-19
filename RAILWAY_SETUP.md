# 🚂 Configuração Railway - WhatsApp Worker

## Erro Atual
```
Error: supabaseUrl is required.
```

O worker está crashando porque as variáveis de ambiente não estão configuradas no Railway.

---

## ✅ Variáveis de Ambiente Necessárias

Acesse o dashboard do Railway e configure as seguintes variáveis:

### 1. Supabase (OBRIGATÓRIO)

```env
SUPABASE_URL=https://hkhvswfewjdrokugdqcd.supabase.co
SUPABASE_SERVICE_KEY=<pegar do dashboard Supabase>
```

**Como obter a SUPABASE_SERVICE_KEY:**
1. Acesse: https://supabase.com/dashboard/project/hkhvswfewjdrokugdqcd/settings/api
2. Copie o valor de "service_role" (secret key)
3. ⚠️ NUNCA compartilhe essa chave publicamente!

### 2. Evolution API (OBRIGATÓRIO)

```env
EVOLUTION_API_URL=<url da sua instância Evolution API>
EVOLUTION_API_KEY=<api key da Evolution>
EVOLUTION_INSTANCE=carijos-clinica
```

**Exemplo:**
```env
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=B6D9F8E3-A7C2-4F1B-9E8D-3C5A7B2F1E9D
EVOLUTION_INSTANCE=carijos-clinica
```

### 3. DeepSeek AI (OBRIGATÓRIO)

```env
DEEPSEEK_API_KEY=<sua chave da DeepSeek>
```

**Como obter:**
1. Acesse: https://platform.deepseek.com
2. Crie uma conta ou faça login
3. Vá em API Keys e gere uma nova chave

### 4. Servidor (OPCIONAL)

```env
PORT=3000
WEBHOOK_SECRET=<gere uma string aleatória segura>
```

**Gerar WEBHOOK_SECRET:**
```bash
# No terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 Configurar no Railway

### Via Dashboard Web

1. Acesse seu projeto no Railway
2. Clique na aba "Variables"
3. Adicione cada variável:
   - Clique em "New Variable"
   - Cole o nome (ex: `SUPABASE_URL`)
   - Cole o valor
   - Clique em "Add"

### Via Railway CLI (alternativa)

```bash
# Instalar CLI (se não tiver)
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Adicionar variáveis
railway variables set SUPABASE_URL=https://hkhvswfewjdrokugdqcd.supabase.co
railway variables set SUPABASE_SERVICE_KEY=<sua-key>
railway variables set EVOLUTION_API_URL=<sua-url>
railway variables set EVOLUTION_API_KEY=<sua-key>
railway variables set EVOLUTION_INSTANCE=carijos-clinica
railway variables set DEEPSEEK_API_KEY=<sua-key>
railway variables set PORT=3000
railway variables set WEBHOOK_SECRET=<seu-secret>
```

---

## 🚀 Após Configurar

1. O Railway vai fazer redeploy automaticamente
2. Verifique os logs para confirmar que iniciou sem erros
3. Você deve ver:

```
🚀 WhatsApp Worker iniciado na porta 3000
📋 Rotas disponíveis:
  GET  /health
  POST /webhook
  POST /send-immediate
  POST /test-3days
  POST /test-24h
```

---

## 🧪 Testar a Instalação

### 1. Health Check

```bash
curl https://seu-app.railway.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-03-19T..."
}
```

### 2. Testar Job de 3 Dias

```bash
curl -X POST https://seu-app.railway.app/test-3days
```

### 3. Testar Job de 24h

```bash
curl -X POST https://seu-app.railway.app/test-24h
```

---

## 📊 Monitorar Logs

No Railway dashboard:
1. Clique na aba "Deployments"
2. Clique no deployment ativo
3. Veja os logs em tempo real

Procure por:
- ✅ "WhatsApp Worker iniciado" - servidor rodando
- ✅ "Notificações enviadas" - jobs funcionando
- ❌ Erros de conexão - verificar credenciais

---

## 🔍 Troubleshooting

### Erro: "supabaseUrl is required"
- Verifique se `SUPABASE_URL` está configurada
- Certifique-se que não tem espaços extras

### Erro: "Invalid API key"
- Verifique se `SUPABASE_SERVICE_KEY` está correta
- Use a "service_role" key, não a "anon" key

### Erro: "Evolution API connection failed"
- Verifique se `EVOLUTION_API_URL` está acessível
- Teste a URL no navegador
- Confirme que `EVOLUTION_API_KEY` está correta

### Erro: "DeepSeek API error"
- Verifique se `DEEPSEEK_API_KEY` está válida
- Confirme que tem créditos na conta DeepSeek

---

## 📝 Checklist de Configuração

- [ ] SUPABASE_URL configurada
- [ ] SUPABASE_SERVICE_KEY configurada
- [ ] EVOLUTION_API_URL configurada
- [ ] EVOLUTION_API_KEY configurada
- [ ] EVOLUTION_INSTANCE configurada
- [ ] DEEPSEEK_API_KEY configurada
- [ ] PORT configurada (opcional)
- [ ] WEBHOOK_SECRET configurada (opcional)
- [ ] Deploy realizado com sucesso
- [ ] Health check respondendo
- [ ] Logs sem erros
- [ ] Teste de job funcionando

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/hkhvswfewjdrokugdqcd
- **Supabase API Keys:** https://supabase.com/dashboard/project/hkhvswfewjdrokugdqcd/settings/api
- **DeepSeek Platform:** https://platform.deepseek.com
- **Railway Docs:** https://docs.railway.app

---

**Criado em:** 19/03/2026  
**Versão:** 1.0.0
