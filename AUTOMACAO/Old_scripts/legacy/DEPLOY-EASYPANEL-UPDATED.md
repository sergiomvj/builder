# 🚀 VCM Dashboard - Deploy no Easypanel (ARQUITETURA ÚNICA)

## ✅ ATUALIZAÇÃO: Single Service Architecture 

### 🔧 O Que Mudou:
- ✅ **Eliminado Backend Separado** - Tudo integrado no Next.js
- ✅ **APIs Locais** - `/api/health`, `/api/status`, `/api/automation`
- ✅ **Sem Dependências** - Não precisa mais de dois serviços
- ✅ **Deploy Simplificado** - Apenas um container

## 🎯 DEPLOY NO EASYPANEL

### 📋 **PASSO 1: Criar Serviço**
```
1. Ir para Easypanel → Services
2. Clicar em "+ New Service"
3. Selecionar "From Source Code"
```

### ⚙️ **PASSO 2: Configurar Repository**
```
Repository: https://github.com/sergiomvj/vcmdashboard.git
Branch: master
Build Command: (deixar vazio - usa Dockerfile)
Start Command: (deixar vazio - usa CMD do Dockerfile)
```

### 🔧 **PASSO 3: Environment Variables OBRIGATÓRIAS**

**⚠️ IMPORTANTE: Configure no Easypanel Settings → Environment**

```bash
# SUPABASE (VCM CENTRAL) - OBRIGATÓRIO
VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VCM_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY

# APIs (OPCIONAL - para automação)
OPENAI_API_KEY=sua-chave-openai
GOOGLE_AI_API_KEY=sua-chave-google-ai

# NODE.JS SETTINGS
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

### 📡 **PASSO 4: Build Args (Docker)**
```bash
# Configure em Easypanel → Settings → Build Args
VCM_SUPABASE_URL=${VCM_SUPABASE_URL}
VCM_SUPABASE_ANON_KEY=${VCM_SUPABASE_ANON_KEY}
```

### 🔍 **PASSO 5: Health Check**
```bash
# Easypanel irá automaticamente detectar:
Endpoint: /api/health
Port: 3000
```

### 🚀 **PASSO 6: Deploy**
```bash
1. Salvar configurações
2. Clicar em "Deploy"
3. Aguardar build (~3-5 minutos)
4. Verificar logs em tempo real
```

## 🧪 TESTE APÓS DEPLOY

### 🌐 URLs para Testar:
```bash
# Health Check
GET https://seu-dominio.app/api/health

# Dashboard
GET https://seu-dominio.app/

# Status API
GET https://seu-dominio.app/api/status
```

### ✅ Resposta Esperada de /api/health:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T15:30:00.000Z",
  "service": "VCM Dashboard API"
}
```

## 🔧 TROUBLESHOOTING

### ❌ Problema: Build Falha
```bash
# Verificar:
1. Environment Variables configuradas
2. Build Args corretos
3. Logs de build no Easypanel
```

### ❌ Problema: Container não Inicia
```bash
# Verificar:
1. Port 3000 está configurado
2. Health check endpoint ativo
3. NODE_ENV=production
```

### ❌ Problema: APIs não Funcionam
```bash
# Verificar:
1. NEXT_PUBLIC_* variables
2. Build arguments passados
3. Runtime environment variables
```

## 📊 VANTAGENS DA NOVA ARQUITETURA

### ✅ **Simplificação:**
- **Antes:** 2 serviços (Next.js + FastAPI)
- **Agora:** 1 serviço (Next.js com API Routes)

### ✅ **Performance:**
- **Menos latência** - APIs locais
- **Menos recursos** - Single container
- **Mais estabilidade** - Menos dependências

### ✅ **Manutenção:**
- **Deploy mais simples**
- **Configuração reduzida**
- **Logs centralizados**

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Deploy Funcionando** - Container subindo com sucesso
2. 🔄 **Integração Python** - Conectar com scripts AUTOMACAO/
3. 🔄 **Supabase Sync** - Dados reais das empresas
4. 🔄 **Monitoramento** - Logs e métricas

---

**🚀 Arquitetura otimizada para produção!**