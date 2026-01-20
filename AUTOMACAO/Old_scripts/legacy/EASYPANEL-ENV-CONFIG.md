# 🔐 Configuração de Variáveis de Ambiente no Easypanel

## ⚠️ IMPORTANTE: NÃO commitar chaves de API no Git!

As variáveis de ambiente devem ser configuradas DIRETAMENTE no Easypanel para segurança.

## 📋 Variáveis Obrigatórias para o Easypanel

### **1. Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA_CHAVE_ANON_AQUI]
SUPABASE_SERVICE_ROLE_KEY=[SUA_CHAVE_SERVICE_ROLE_AQUI]
```

### **2. AI API Keys** 
```
OPENAI_API_KEY=[SUA_CHAVE_OPENAI_AQUI]
ANTHROPIC_API_KEY=[SUA_CHAVE_ANTHROPIC_AQUI]
GOOGLE_AI_API_KEY=[SUA_CHAVE_GOOGLE_AQUI]
```

### **3. Application Settings**
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=http://vcm-backend:8000
```

### **4. Database Configuration** (se usar full stack)
```
DATABASE_URL=postgresql://vcm:vcmpassword@postgres:5432/vcm_db
REDIS_URL=redis://redis:6379
```

### **5. Security Settings**
```
SECRET_KEY=[GERE_UMA_CHAVE_SECRETA_LONGA]
ACCESS_TOKEN_EXPIRE_MINUTES=30
FORCE_HTTPS=true
```

## 🖥️ Como Configurar no Easypanel

### **Passo 1: Acessar Configurações**
```
1. Login no Easypanel
2. Selecionar sua App (vcm-dashboard)
3. Settings → Environment Variables
```

### **Passo 2: Adicionar Variáveis**
```
1. Clicar em "Add Variable"
2. Name: NEXT_PUBLIC_SUPABASE_URL
3. Value: https://fzyokrvdyeczhfqlwxzb.supabase.co
4. Repetir para todas as variáveis
```

### **Passo 3: Salvar e Redeploy**
```
1. Save Changes
2. Deploy → Restart/Rebuild
```

## 📱 Interface Visual do Easypanel

### **Environment Variables Tab:**
```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│ [+] Add Variable                           │
│                                            │
│ ┌─ NEXT_PUBLIC_SUPABASE_URL ─────────────┐ │
│ │ https://fzyokrvdyeczhfqlwxzb.supabase.co│ │
│ └──────────────────────────────────────────┘ │
│                                            │
│ ┌─ NEXT_PUBLIC_SUPABASE_ANON_KEY ────────┐ │
│ │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...│ │
│ └──────────────────────────────────────────┘ │
│                                            │
│ ┌─ OPENAI_API_KEY ──────────────────────┐ │
│ │ sk-proj-...                            │ │
│ └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 🔑 Onde Encontrar suas Chaves

### **Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Projeto: fzyokrvdyeczhfqlwxzb
3. Settings → API
4. Copiar:
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### **OpenAI:**
1. Acesse: https://platform.openai.com/api-keys
2. Create new secret key
3. Copiar → `OPENAI_API_KEY`

### **Anthropic:**
1. Acesse: https://console.anthropic.com/
2. API Keys → Create Key
3. Copiar → `ANTHROPIC_API_KEY`

### **Google AI:**
1. Acesse: https://makersuite.google.com/app/apikey
2. Create API Key
3. Copiar → `GOOGLE_AI_API_KEY`

## ✅ Checklist de Configuração

- [ ] Easypanel app criada
- [ ] Todas as variáveis adicionadas
- [ ] Chaves de API válidas
- [ ] Deploy realizado
- [ ] Aplicação funcionando
- [ ] Logs verificados (sem erros de auth)

## 🔍 Verificar Configuração

### **1. Logs do Container**
```
Easypanel → Apps → vcm-dashboard → Logs
```

### **2. Testar APIs**
```
# No browser, verificar se carrega sem erros
https://sua-app.easypanel.host

# Verificar console do browser (F12)
# Não deve haver erros de "API key not found"
```

### **3. Health Check**
```
# Se configurou backend também:
https://sua-app.easypanel.host/api/health
```

## 🚨 Troubleshooting

### **Erro "API key not found":**
- Verificar se variável foi salva corretamente
- Restart da aplicação no Easypanel
- Verificar nome da variável (case sensitive)

### **Erro de conexão Supabase:**
- Verificar URL do projeto
- Verificar se chaves são válidas
- Verificar se projeto Supabase está ativo

### **Build/Deploy falhando:**
- Verificar logs no Easypanel
- Verificar se todas variáveis obrigatórias estão presentes
- Verificar sintaxe das variáveis

## 💡 Dicas de Segurança

1. **Nunca commitar .env** no Git
2. **Usar variáveis diferentes** para desenvolvimento/produção
3. **Renovar chaves** periodicamente
4. **Monitorar logs** para vazamentos acidentais
5. **Backup das configurações** do Easypanel

## 📞 Suporte

Se tiver problemas:
1. Verificar logs do Easypanel
2. Testar variáveis localmente primeiro
3. Verificar documentação específica de cada API
4. Contatar suporte do Easypanel se necessário