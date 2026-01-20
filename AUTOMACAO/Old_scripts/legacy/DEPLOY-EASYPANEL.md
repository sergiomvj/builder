# VCM Dashboard - Deploy no Easypanel

## 📋 Pré-requisitos

- VPS com Docker instalado
- Easypanel configurado na VPS
- Acesso SSH à VPS
- Domínio configurado (opcional)

## 🚀 Passos para Deploy

### 1. Preparar Arquivos na VPS

```bash
# Conectar na VPS via SSH
ssh usuario@seu-servidor.com

# Criar diretório para o projeto
mkdir -p /home/vcm-dashboard
cd /home/vcm-dashboard

# Clonar o repositório (ou upload via SFTP)
git clone https://github.com/sergiomvj/vcmdashboard.git .
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```bash
# VCM Dashboard Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
NEXT_PUBLIC_API_URL=https://seu-dominio.com/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. Deploy via Easypanel

#### Método 1: Via Interface Web do Easypanel

1. **Acessar Easypanel**: `https://seu-servidor.com:3000`

2. **Criar Nova Aplicação**:
   - Nome: `vcm-dashboard`
   - Tipo: `Docker Compose`

3. **Configurar Docker Compose**:
   ```yaml
   version: '3.8'
   services:
     vcm-dashboard:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: vcm-dashboard
       restart: unless-stopped
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - NEXT_TELEMETRY_DISABLED=1
         - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
   ```

4. **Configurar Variáveis de Ambiente** na aba Environment

5. **Configurar Domínio** (opcional):
   - Adicionar domínio personalizado
   - Configurar SSL automático

#### Método 2: Via CLI

```bash
# Build da imagem Docker
docker build -t vcm-dashboard .

# Executar container
docker run -d \
  --name vcm-dashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://fzyokrvdyeczhfqlwxzb.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave" \
  -e SUPABASE_SERVICE_ROLE_KEY="sua_chave" \
  -e NEXT_PUBLIC_API_URL="https://seu-dominio.com/api" \
  vcm-dashboard
```

### 4. Configuração de Reverse Proxy (Nginx)

Se usar Nginx como proxy reverso, criar configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoramento

### Verificar Status do Container
```bash
docker ps | grep vcm-dashboard
docker logs vcm-dashboard
```

### Health Check
```bash
curl http://localhost:3000
```

### Métricas de Performance
```bash
docker stats vcm-dashboard
```

## 🔄 Atualizações

### Deploy de Nova Versão
```bash
# Parar container atual
docker stop vcm-dashboard
docker rm vcm-dashboard

# Atualizar código
git pull origin master

# Rebuild e restart
docker build -t vcm-dashboard .
docker run -d \
  --name vcm-dashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  vcm-dashboard
```

### Backup e Restore
```bash
# Backup da configuração
docker exec vcm-dashboard tar -czf /tmp/vcm-backup.tar.gz /app/.next

# Restore (se necessário)
docker cp vcm-dashboard:/tmp/vcm-backup.tar.gz ./backup.tar.gz
```

## 🛡️ Segurança

### Variáveis de Ambiente Seguras
- **NUNCA** commitar chaves no repositório
- Usar secrets do Easypanel para dados sensíveis
- Configurar firewall para portas necessárias

### SSL/TLS
- Configurar certificados SSL via Let's Encrypt
- Easypanel pode configurar automaticamente

### Updates de Segurança
```bash
# Atualizar imagem base
docker pull node:18-alpine
docker build -t vcm-dashboard .
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Container não inicia**:
   ```bash
   docker logs vcm-dashboard
   ```

2. **Variáveis de ambiente não carregam**:
   - Verificar arquivo `.env`
   - Confirmar sintaxe no docker-compose.yml

3. **Build falha**:
   ```bash
   docker build --no-cache -t vcm-dashboard .
   ```

4. **Performance lenta**:
   - Verificar recursos da VPS
   - Monitorar logs de aplicação

### Logs Úteis
```bash
# Logs do container
docker logs -f vcm-dashboard

# Logs do sistema
journalctl -u docker

# Logs do Easypanel
docker logs easypanel
```

## 📱 Acesso

- **Aplicação**: `http://seu-servidor:3000`
- **Easypanel**: `https://seu-servidor:3000` (porta padrão)
- **Logs**: Via interface do Easypanel ou CLI

## ✅ Checklist Final

- [ ] VPS configurada com Docker
- [ ] Easypanel instalado e funcionando
- [ ] Código clonado/uploaded na VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Container buildado e rodando
- [ ] Aplicação acessível via browser
- [ ] SSL configurado (se aplicável)
- [ ] Backup strategy definida
- [ ] Monitoramento ativo

## 🆘 Suporte

Em caso de problemas:
1. Verificar logs do container
2. Testar build local primeiro
3. Conferir configuração de rede
4. Validar variáveis de ambiente

**Status do Deploy**: 🟢 Pronto para produção!