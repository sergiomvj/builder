# 🚀 Guia de Deploy VPS - VCM Dashboard

Este guia contém todas as instruções necessárias para fazer deploy do **Virtual Company Manager Dashboard** em sua VPS própria.

## 📋 Pré-requisitos

### Sistema Operacional
- ✅ **Ubuntu 20.04+** (recomendado)
- ✅ **CentOS 8+**
- ✅ **Debian 11+**
- ✅ **Windows Server 2019+** (com Docker Desktop)

### Software Necessário
```bash
# Docker (versão 20.10+)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose (versão 1.29+)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Hardware Mínimo
- 🖥️ **CPU**: 2 cores
- 💾 **RAM**: 4GB (8GB recomendado)
- 💿 **Disco**: 20GB livres
- 🌐 **Rede**: Conexão estável à internet

## ⚙️ Configuração Inicial

### 1. Clone do Repositório
```bash
git clone <seu-repositorio>
cd vcm_vite_react
```

### 2. Configuração de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.vps .env.production

# Edite as variáveis necessárias
nano .env.production
```

### 3. Variáveis Obrigatórias
Edite o arquivo `.env.production` com seus dados:

```env
# === SUPABASE (OBRIGATÓRIO) ===
NEXT_PUBLIC_VCM_SUPABASE_URL=https://seu-projeto.supabase.co
VCM_SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# === DOMÍNIO (OPCIONAL) ===
SERVER_NAME=seu-dominio.com
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# === SEGURANÇA (GERE NOVAS CHAVES) ===
JWT_SECRET=sua_chave_jwt_32_caracteres
NEXTAUTH_SECRET=sua_chave_nextauth
```

## 🚀 Deploy Automático

### Linux/macOS
```bash
# Tornar script executável
chmod +x scripts/deploy.sh

# Executar deploy
./scripts/deploy.sh
```

### Windows
```powershell
# Executar no PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Deploy
.\scripts\deploy-windows.ps1
```

## 🐳 Deploy Manual (Passo a Passo)

### 1. Build da Imagem
```bash
docker build -f Dockerfile.prod -t vcm-dashboard .
```

### 2. Iniciar Serviços
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verificar Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 4. Health Check
```bash
curl http://localhost:3000/api/health
```

## 🌐 Configuração de Domínio

### Nginx (Incluído no Docker)
O Nginx já está configurado e será iniciado automaticamente. Para personalizar:

1. Edite `nginx/conf.d/vcm.conf`
2. Substitua `vcm.exemplo.com` pelo seu domínio
3. Reinicie: `docker-compose restart nginx`

### SSL/HTTPS (Opcional)
Para habilitar HTTPS:

1. Obtenha certificados SSL (Let's Encrypt recomendado)
2. Coloque os certificados em `nginx/ssl/`
3. Descomente a seção HTTPS em `nginx/conf.d/vcm.conf`
4. Reinicie o Nginx

```bash
# Let's Encrypt (exemplo)
sudo apt install certbot
sudo certbot certonly --standalone -d seu-dominio.com
```

## 📊 Monitoramento

### Logs em Tempo Real
```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas aplicação
docker-compose -f docker-compose.prod.yml logs -f vcm-dashboard

# Apenas Nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Status dos Serviços
```bash
# Status geral
docker-compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Saúde da aplicação
curl http://localhost/api/health
```

## 🔧 Comandos Úteis

### Controle de Serviços
```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart vcm-dashboard

# Rebuild completo
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backup Manual
```bash
# Backup do container
docker export vcm-dashboard > backup-$(date +%Y%m%d).tar

# Backup dos logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### Limpeza
```bash
# Limpar imagens antigas
docker image prune -f

# Limpar tudo (cuidado!)
docker system prune -f
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Container não inicia
```bash
# Ver logs de erro
docker-compose -f docker-compose.prod.yml logs vcm-dashboard

# Verificar configurações
docker-compose -f docker-compose.prod.yml config
```

#### 2. Aplicação não responde
```bash
# Verificar se a porta está aberta
netstat -tulpn | grep :3000

# Verificar health check
curl -v http://localhost:3000/api/health
```

#### 3. Problemas de banco de dados
```bash
# Verificar variáveis de ambiente
docker exec vcm-dashboard env | grep SUPABASE

# Testar conexão
docker exec vcm-dashboard curl -f $NEXT_PUBLIC_VCM_SUPABASE_URL
```

#### 4. Problemas de memória
```bash
# Verificar uso de recursos
docker stats --no-stream

# Aumentar limite de memória (se necessário)
# Edite docker-compose.prod.yml e adicione:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### Logs de Debug
```bash
# Logs detalhados da aplicação
docker exec vcm-dashboard cat /app/.next/standalone/server.js

# Logs do sistema
journalctl -u docker -f
```

## 🔄 Atualizações

### Atualização Automática
O Watchtower está configurado para verificar atualizações a cada hora.

### Atualização Manual
```bash
# Pull das mudanças
git pull

# Rebuild e restart
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🛡️ Segurança

### Recomendações
- 🔐 Use HTTPS em produção
- 🚪 Configure firewall (apenas portas 80, 443, 22)
- 🔑 Use chaves SSH para acesso à VPS
- 📊 Monitore logs regularmente
- 🔄 Faça backups regulares

### Configuração de Firewall (Ubuntu)
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ver status
sudo ufw status
```

## 📞 Suporte

### Links Úteis
- 📖 **Manual Completo**: http://seu-dominio.com/manual-instrucoes.html
- 🏥 **Health Check**: http://seu-dominio.com/api/health
- 🐛 **Issues**: [Link do repositório]

### Contato de Emergência
Para problemas críticos, documente:
1. Mensagem de erro exata
2. Logs relevantes (`docker-compose logs`)
3. Configuração de ambiente (sem valores sensíveis)
4. Passos para reproduzir o problema

---

## 🎉 Deploy Bem-sucedido!

Se chegou até aqui e tudo funcionou, parabéns! Seu **VCM Dashboard** está rodando em produção.

### Próximos Passos
1. ✅ Acesse http://seu-dominio.com
2. ✅ Verifique o health check
3. ✅ Configure backups automáticos
4. ✅ Configure monitoramento
5. ✅ Leia o manual completo

**Bom trabalho! 🚀**