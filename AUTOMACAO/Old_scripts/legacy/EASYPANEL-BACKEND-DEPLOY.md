# Guia para Deploy do Backend VCM no Easypanel

## 🚀 Passos para Deploy

### 1. Criar Novo Serviço no Easypanel
1. **Nome**: `vcm-backend`
2. **Tipo**: Source Code (GitHub)
3. **Repository**: `sergiomvj/vcmdashboard`
4. **Branch**: `master`
5. **Dockerfile**: `Dockerfile.python`

### 2. Configurar Environment Variables
Adicione todas as variáveis do .env no painel do Easypanel:

```bash
# === SUPABASE ===
VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VCM_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VCM_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === LIFEWAY ===
LIFEWAY_SUPABASE_URL=https://neaoblaycbdunfxgunjo.supabase.co
LIFEWAY_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === AI APIs ===
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# === SYSTEM ===
VCM_ENVIRONMENT=production
VCM_DEBUG=false
VCM_LOG_LEVEL=INFO
```

### 3. Configurar Domínio
- **Domain**: `vcm-backend.yourdomain.com` ou usar URL do Easypanel
- **Port**: 8000 (ou deixar automático)

### 4. Conectar Frontend ao Backend
Adicionar no frontend service (vcm-dashboard):

```bash
NEXT_PUBLIC_API_URL=https://vcm-backend.yourdomain.com
```

## 🔗 Endpoints Disponíveis

Após deploy, o backend terá:
- `GET /health` - Health check
- `POST /biografias/gerar` - Gerar biografias
- `POST /scripts/executar` - Executar scripts
- `GET /empresas` - Listar empresas
- `GET /personas/{empresa_id}` - Personas da empresa

## ✅ Verificação

1. **Backend Health**: `https://vcm-backend.yourdomain.com/health`
2. **Frontend API**: Verificar se dashboard conecta ao backend
3. **Logs**: Monitorar logs no Easypanel para debug

## 🐛 Troubleshooting

- **CORS Error**: Verificar se CORS está habilitado no FastAPI
- **Environment Variables**: Confirmar se todas as vars estão configuradas
- **Port Issues**: Backend usa PORT do Easypanel automaticamente