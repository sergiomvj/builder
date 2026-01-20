# 🔧 RESOLVENDO ERRO DE API DESCONECTADA

## ❌ Problema
```
:8000/health:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## ✅ Solução Rápida

### Opção 1: Iniciar servidor backend manualmente
```bash
cd "c:\Users\Sergio Castro\Documents\Projetos\1NewTools\vcm_vite_react"
python api_bridge_real.py
```

### Opção 2: Usar script de inicialização automática
```bash
# PowerShell
.\start-vcm-dashboard.ps1

# Ou Python
python start_vcm_dashboard.py
```

## 📋 Status dos Serviços

### ✅ Funcionando Corretamente
- **Frontend (Next.js)**: http://localhost:3001 ✅
- **Backend (FastAPI)**: http://localhost:8000 ✅

### 🔧 Como Verificar

1. **Frontend**: Acesse http://localhost:3001
   - Deve mostrar o dashboard VCM
   - Banner amarelo indica API desconectada

2. **Backend**: Acesse http://localhost:8000/health
   - Deve retornar JSON com status

3. **Documentação API**: http://localhost:8000/docs
   - Interface Swagger para testar endpoints

## 🔄 Modificações Feitas

### 1. Hooks Resilientes (`src/lib/hooks.ts`)
- ✅ Detecta automaticamente se API está disponível
- ✅ Usa dados mock quando API está offline
- ✅ Mostra erros úteis ao usuário
- ✅ Não trava o frontend

### 2. Notificação Visual
- ✅ Banner amarelo quando API desconectada
- ✅ Instruções claras para resolver
- ✅ Status visual no cabeçalho

### 3. Scripts de Inicialização
- ✅ `start-vcm-dashboard.ps1` (Windows PowerShell)
- ✅ `start_vcm_dashboard.py` (Cross-platform)

## 🚀 Próximos Passos

1. **Para desenvolver sem backend**:
   - Frontend funciona independentemente
   - Funcionalidades CRUD de Empresas/Configurações operacionais
   - Scripts VCM ficam desabilitados (requer backend)

2. **Para usar sistema completo**:
   - Sempre iniciar backend antes
   - Usar scripts de inicialização automática
   - Monitorar logs de ambos os serviços

## 💡 Dicas

- **Backend travou?** Restart com Ctrl+C e `python api_bridge_real.py`
- **Frontend lento?** Normal na primeira compilação
- **Erros de CORS?** Backend já configurado para porta 3001
- **API não responde?** Verificar se porta 8000 está livre

---

## 🎯 Status Atual: ✅ RESOLVIDO

- ✅ Frontend operacional
- ✅ Backend operacional  
- ✅ Conexão funcionando
- ✅ Notificações implementadas
- ✅ Scripts de inicialização criados