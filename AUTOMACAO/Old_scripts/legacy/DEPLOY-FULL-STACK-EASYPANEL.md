# 🐳 VCM Dashboard - Deploy Full Stack no Easypanel

## 🎯 Resposta à Pergunta: **NÃO é necessário instalar Python na VPS!**

Todo o sistema Python está **containerizado** e rodará dentro de containers Docker. A VPS só precisa ter:
- ✅ Docker 
- ✅ Docker Compose
- ✅ Easypanel

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────┐
│                    VPS + Easypanel                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Nginx     │ │  Frontend   │ │   Backend   │      │
│  │   Proxy     │ │   Next.js   │ │   Python    │      │
│  │   :80/443   │ │   :3000     │ │   :8000     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│         │               │               │              │
│         └───────────────┼───────────────┘              │
│                         │                              │
│  ┌─────────────┐ ┌─────────────┐                      │
│  │ PostgreSQL  │ │    Redis    │                      │
│  │   :5432     │ │   :6379     │                      │
│  └─────────────┘ └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## 📦 O que está incluído

### 1. **Frontend Container** (Next.js)
- Dashboard web responsivo
- Todas as páginas funcionais
- Interface de execução de scripts
- Conecta com backend via API

### 2. **Backend Container** (Python)
- **Todos os scripts de AUTOMACAO**
- FastAPI para APIs REST
- Integração com Supabase
- Processamento de personas
- Execução de workflows
- **Sem necessidade de Python na VPS**

### 3. **Database Container** (PostgreSQL)
- Logs de execução
- Cache de processamento
- Filas de tarefas

### 4. **Cache Container** (Redis)
- Cache de sessões
- Filas de background jobs

## 🚀 Deploy no Easypanel

### Método 1: Interface Web do Easypanel

1. **Acessar Easypanel**
   ```
   https://seu-servidor:3000
   ```

2. **Criar Nova Aplicação**
   - Nome: `vcm-full-stack`
   - Tipo: `Docker Compose`

3. **Docker Compose Config**
   ```yaml
   version: '3.8'
   
   services:
     vcm-dashboard:
       image: vcm-dashboard:latest
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
         - NEXT_PUBLIC_API_URL=http://vcm-backend:8000
       depends_on:
         - vcm-backend
   
     vcm-backend:
       image: vcm-backend:latest  
       build:
         context: .
         dockerfile: Dockerfile.python
       ports:
         - "8000:8000"
       environment:
         - ENVIRONMENT=production
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
         - DATABASE_URL=postgresql://vcm:vcmpassword@postgres:5432/vcm_db
       depends_on:
         - postgres
         - redis
   
     postgres:
       image: postgres:15-alpine
       environment:
         - POSTGRES_DB=vcm_db
         - POSTGRES_USER=vcm
         - POSTGRES_PASSWORD=vcmpassword
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

4. **Configurar Variáveis de Ambiente**
   ```env
   # Supabase
   SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anon
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   
   # AI APIs  
   OPENAI_API_KEY=sua_chave_openai
   ANTHROPIC_API_KEY=sua_chave_anthropic
   GOOGLE_AI_API_KEY=sua_chave_google
   
   # Database
   DATABASE_URL=postgresql://vcm:vcmpassword@postgres:5432/vcm_db
   ```

### Método 2: Upload e Script Automático

```bash
# 1. Upload dos arquivos para VPS
scp -r ./vcm-dashboard-real usuario@servidor:/home/vcm/

# 2. Conectar na VPS  
ssh usuario@servidor

# 3. Entrar no diretório
cd /home/vcm/vcm-dashboard-real

# 4. Dar permissões aos scripts
chmod +x deploy-full-stack.sh validate-docker.sh

# 5. Configurar variáveis de ambiente
cp .env.production .env
nano .env  # Editar com suas chaves

# 6. Deploy automático
./deploy-full-stack.sh
```

## ⚙️ Configuração de Variáveis

### Variáveis Obrigatórias
```env
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# === AI APIS ===
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# === SECURITY ===
SECRET_KEY=sua_chave_secreta_longa_e_segura
```

### Variáveis Opcionais
```env
# Personalização
DEFAULT_COMPANY_INDUSTRY=Tecnologia
DEFAULT_PERSONAS_COUNT=20
DEFAULT_LANGUAGE=pt-br

# Performance
SCRIPT_TIMEOUT=3600
MAX_CONCURRENT_EXECUTIONS=3
RATE_LIMIT_REQUESTS=100
```

## 🔧 Comandos de Gerenciamento

### Via Script
```bash
# Status dos serviços
./deploy-full-stack.sh --status

# Logs em tempo real
./deploy-full-stack.sh --logs

# Logs de serviço específico
./deploy-full-stack.sh --logs vcm-backend

# Restart de serviço
./deploy-full-stack.sh --restart vcm-dashboard

# Parar tudo
./deploy-full-stack.sh --stop
```

### Via Docker Compose
```bash
# Ver status
docker-compose ps

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild
docker-compose up --build -d

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## 📊 Monitoramento

### Health Checks Automáticos
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000/health`
- **Database**: Verificação interna de conectividade
- **Redis**: Ping/Pong automático

### Endpoints de Monitoramento
```bash
# Health check geral
curl http://localhost:8000/health

# Métricas do sistema
curl http://localhost:8000/metrics

# Status dos scripts
curl http://localhost:8000/api/v1/scripts/status

# Logs recentes
curl http://localhost:8000/api/v1/logs/recent
```

## 🛡️ Segurança

### Configuração SSL (Easypanel)
- Configuração automática de SSL via Let's Encrypt
- Redirecionamento HTTP → HTTPS
- Headers de segurança automáticos

### Firewall
```bash
# Portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Easypanel (se não usar proxy)

# Aplicar regras
ufw enable
```

### Backup Automático
```bash
# Backup do banco
docker exec vcm-postgres pg_dump -U vcm vcm_db > backup.sql

# Backup dos volumes
docker run --rm -v vcm_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## 🔄 Atualizações

### Deploy de Nova Versão
```bash
# 1. Backup
./deploy-full-stack.sh --stop
docker system prune -f

# 2. Atualizar código
git pull origin master

# 3. Deploy
./deploy-full-stack.sh
```

### Rollback
```bash
# 1. Parar serviços
./deploy-full-stack.sh --stop

# 2. Voltar para versão anterior
git checkout versao-anterior

# 3. Deploy
./deploy-full-stack.sh
```

## 📈 Performance

### Recursos Recomendados (VPS)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (recomendado 8GB)
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps

### Otimizações
- **Database**: Índices automáticos criados
- **Cache**: Redis para cache de sessões
- **Static Files**: Servidos pelo Next.js otimizado
- **Images**: Otimização automática pelo Next.js

## 🐛 Troubleshooting

### Problemas Comuns

1. **Container não inicia**
   ```bash
   docker-compose logs vcm-backend
   docker-compose ps
   ```

2. **Erro de conexão com database**
   ```bash
   docker-compose restart postgres
   docker-compose logs postgres
   ```

3. **API não responde**
   ```bash
   # Verificar se backend está rodando
   curl http://localhost:8000/health
   
   # Ver logs
   docker-compose logs vcm-backend
   ```

4. **Frontend não carrega**
   ```bash
   # Verificar build
   docker-compose logs vcm-dashboard
   
   # Verificar variáveis de ambiente
   docker-compose exec vcm-dashboard printenv | grep NEXT_
   ```

### Logs Úteis
```bash
# Todos os logs
docker-compose logs -f

# Logs específicos com timestamp
docker-compose logs -f --timestamps vcm-backend

# Últimas 100 linhas
docker-compose logs --tail=100 vcm-dashboard
```

## ✅ Checklist de Deploy

- [ ] VPS configurada com Docker + Easypanel
- [ ] Código uploaded/clonado na VPS
- [ ] Arquivo `.env` configurado com todas as chaves
- [ ] Scripts de deploy com permissões de execução
- [ ] Portas 80, 443, 3000, 8000 liberadas no firewall
- [ ] Domínio apontado para VPS (opcional)
- [ ] SSL configurado via Easypanel
- [ ] Health checks passando
- [ ] Backup strategy definida

## 🎯 Resultado Final

Após o deploy bem-sucedido, você terá:

- ✅ **Frontend funcional** em `https://seu-dominio.com`
- ✅ **Backend Python completo** com todos os scripts de automação
- ✅ **Database PostgreSQL** para logs e cache
- ✅ **Redis** para performance
- ✅ **SSL automático** via Easypanel
- ✅ **Monitoramento** e health checks
- ✅ **Zero instalação manual** de Python na VPS

**🔥 Sistema 100% containerizado e pronto para produção!**