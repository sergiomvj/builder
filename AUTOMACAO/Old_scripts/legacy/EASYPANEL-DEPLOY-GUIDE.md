# 🚀 VCM Dashboard - Deploy via Easypanel

## 📱 **Método 1: Git Deploy (Recomendado)**

### 1. **Commit e Push para GitHub**
```bash
# Na sua máquina Windows
cd "c:\Users\Sergio Castro\Documents\Projetos\1NewTools\vcm_vite_react\vcm-dashboard-real"

# Commit tudo
git add .
git commit -m "feat: Setup completo Docker para Easypanel"
git push origin master
```

### 2. **Easypanel Interface**
1. Acessar Easypanel: `https://seu-servidor.com:3000`
2. **Apps → Create App**
3. **Source → GitHub**
4. **Repository**: `sergiomvj/vcmdashboard`
5. **Branch**: `master`
6. **Build Path**: `/vcm-dashboard-real`

### 3. **Configuração Automática**
- Easypanel detecta `Dockerfile` automaticamente
- Build automático a cada push no GitHub
- Deploy automático após build

---

## 📱 **Método 2: Upload Direto via Easypanel**

### 1. **Easypanel Interface**
1. **Apps → Create App**
2. **Source → Upload**
3. **Upload ZIP** da pasta `vcm-dashboard-real`

### 2. **Configuração Manual**
- **Build Command**: `docker build -t vcm-dashboard .`
- **Run Command**: `docker run -p 3000:3000 vcm-dashboard`

---

## 📱 **Método 3: Docker Compose via Easypanel**

### 1. **Create App**
- **Type**: `Docker Compose`
- **Source**: `Upload` ou `GitHub`

### 2. **Docker Compose Config**
```yaml
version: '3.8'

services:
  vcm-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vcm-dashboard.rule=Host(\`seu-dominio.com\`)"
      - "traefik.http.routers.vcm-dashboard.tls=true"
      - "traefik.http.routers.vcm-dashboard.tls.certresolver=letsencrypt"
```

---

## 🔧 **Configuração de Variáveis no Easypanel**

### **Environment Variables Tab:**
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
OPENAI_API_KEY=sua_chave_openai
ANTHROPIC_API_KEY=sua_chave_anthropic
```

---

## 🌐 **Configuração de Domínio no Easypanel**

### **Domains Tab:**
1. **Add Domain**: `seu-dominio.com`
2. **SSL**: Enable (Let's Encrypt automático)
3. **Force HTTPS**: Enable

---

## 📊 **Full Stack no Easypanel**

### **Multi-App Setup:**

#### **App 1: Frontend**
```yaml
# vcm-frontend
version: '3.8'
services:
  frontend:
    build: .
    dockerfile: Dockerfile
    ports:
      - "3000:3000"
```

#### **App 2: Backend**  
```yaml
# vcm-backend
version: '3.8'
services:
  backend:
    build: .
    dockerfile: Dockerfile.python
    ports:
      - "8000:8000"
```

#### **App 3: Database**
```yaml
# vcm-database
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=vcm_db
      - POSTGRES_USER=vcm
      - POSTGRES_PASSWORD=vcmpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

---

## ⚡ **Deploy Automático via Webhooks**

### **GitHub Actions + Easypanel:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Easypanel

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Easypanel
        run: |
          curl -X POST ${{ secrets.EASYPANEL_WEBHOOK_URL }} \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_TOKEN }}" \
            -d '{"ref": "refs/heads/master"}'
```

---

## 🔄 **Atualizações Automáticas**

### **Git Auto-Deploy:**
1. **Settings → Git**
2. **Auto Deploy**: Enable
3. **Branch**: `master`
4. **Build Path**: `/vcm-dashboard-real`

### **Webhook URL:**
```
https://seu-servidor.com:3000/api/deploy/webhook/sua-app-id
```

---

## 📱 **Interface Easypanel: Passo a Passo Visual**

### **1. Criar App**
```
Dashboard → Apps → Create App
├── App Name: vcm-dashboard
├── Source: GitHub Repository
├── Repository: sergiomvj/vcmdashboard
├── Branch: master
└── Build Path: /vcm-dashboard-real
```

### **2. Configurar Build**
```
Settings → Build
├── Build Command: (auto-detectado)
├── Start Command: npm start
├── Port: 3000
└── Environment: production
```

### **3. Variáveis de Ambiente**
```
Settings → Environment
├── NEXT_PUBLIC_SUPABASE_URL=...
├── NEXT_PUBLIC_SUPABASE_ANON_KEY=...
├── OPENAI_API_KEY=...
└── [todas as outras variáveis]
```

### **4. Configurar Domínio**
```
Settings → Domains
├── Domain: seu-dominio.com
├── SSL: Auto (Let's Encrypt)
└── Force HTTPS: Yes
```

### **5. Deploy**
```
Overview → Deploy
└── Status: Building → Running
```

---

## 🎯 **Easypanel vs Manual**

| Método | Complexidade | Automação | SSL | Monitoring |
|--------|-------------|-----------|-----|------------|
| **SCP Manual** | Alta | ❌ | Manual | Manual |
| **Easypanel** | Baixa | ✅ | Auto | ✅ Built-in |

---

## ✅ **Checklist Easypanel**

- [ ] Easypanel instalado na VPS
- [ ] Código commitado no GitHub
- [ ] App criada no Easypanel
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado (opcional)
- [ ] SSL habilitado
- [ ] Deploy executado
- [ ] Health check passando

---

## 🚀 **Comando Mágico: Zero SSH!**

Com Easypanel você não precisa de `scp` nem SSH manual:

1. **Commit → GitHub**
2. **Easypanel → Auto Deploy**
3. **✅ Pronto!**

**Easypanel gerencia tudo: build, deploy, SSL, monitoramento!**