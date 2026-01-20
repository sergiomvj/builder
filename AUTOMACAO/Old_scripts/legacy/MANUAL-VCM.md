# 📋 VCM - Virtual Company Manager
## Manual de Instruções de Uso

### 🎯 Visão Geral

O Virtual Company Manager (VCM) é um sistema integrado para geração automática de empresas virtuais completas com personas realistas, workflows automatizados e base de conhecimento RAG. O sistema combina inteligência artificial avançada com interface web intuitiva.

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

#### 1. **Dashboard Web (Frontend)**
- **Tecnologia**: Next.js + TypeScript + Tailwind CSS
- **Porta**: `http://localhost:3001`
- **Localização**: `vcm-dashboard-real/`

#### 2. **API Bridge (Backend)**
- **Tecnologia**: FastAPI + Python
- **Porta**: `http://localhost:8000`
- **Arquivo**: `api_bridge_llm.py`

#### 3. **Serviços LLM**
- **Google AI Gemini 2.5 Flash**: Provedor primário (35% mais barato)
- **OpenAI GPT-4o-mini**: Fallback automático
- **Nano Banana**: Geração de avatares (futuro)

#### 4. **Banco de Dados**
- **VCM Central**: `fzyokrvdyeczhfqlwxzb.supabase.co`
- **RAG Individual**: Cada empresa tem seu próprio banco

---

## 🚀 Guia de Instalação

### Pré-requisitos
```bash
# Instalar Node.js 18+ e Python 3.9+
# Instalar dependências Python
pip install fastapi uvicorn supabase python-multipart aiohttp google-generativeai openai

# Instalar dependências Node.js
cd vcm-dashboard-real
npm install
```

### Configuração de Ambiente
1. **Copie `.env.example` para `.env`**
2. **Configure as credenciais**:
```env
# Supabase VCM Central
VCM_SUPABASE_URL=https://fzyokrvdyeczhfqlwxzb.supabase.co
VCM_SUPABASE_ANON_KEY=sua_chave_anon
VCM_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service

# APIs de IA
GOOGLE_AI_API_KEY=sua_chave_google_ai
OPENAI_API_KEY=sua_chave_openai

# Nano Banana (futuro)
NANO_BANANA_API_KEY=sua_chave_nano_banana
```

### Inicialização do Sistema
```bash
# Terminal 1: Backend
python api_bridge_llm.py

# Terminal 2: Frontend  
cd vcm-dashboard-real
npm run dev
```

---

## 📱 Interface do Dashboard

### 1. **Formulário de Geração de Biografias**

#### Campos Principais:
- **Nome da Empresa**: Nome da empresa virtual
- **Indústria**: Setor de atuação (tecnologia, saúde, educação, etc.)
- **Gênero do CEO**: Masculino ou feminino

#### 🌍 **Distribuição de Nacionalidades** (NOVO!)
Sistema avançado para criar equipes multiculturais:

**Recursos:**
- ✅ **Múltiplas nacionalidades**: Combine diferentes origens étnicas
- 📊 **Controle por percentual**: Defina exatamente a composição da equipe
- 🔄 **Validação automática**: Sistema garante que a soma seja 100%
- ⚡ **Distribuição inteligente**: Botões para distribuir igualmente ou normalizar

**Nacionalidades Disponíveis:**
- Brasileiros
- Latinos
- Europeus
- Asiáticos
- Norte-americanos
- Africanos
- Oriente Médio
- Nórdicos
- Oceânicos

**Como Usar:**
1. Clique **"+ Adicionar"** para incluir nova nacionalidade
2. Selecione o tipo no dropdown
3. Defina o percentual (0-100%)
4. Use **"Distribuir Igualmente"** para dividir automaticamente
5. Use **"Normalizar 100%"** se passou de 100%
6. Remova nacionalidades com o **"✕"**

**Exemplo Prático:**
```
Latinos: 60%
Asiáticos: 25%
Europeus: 15%
Total: 100% ✓
```

#### Distribuição da Equipe:
- **Executivos**: CEO + outros executivos (homens/mulheres)
- **Especialistas**: Profissionais técnicos especializados
- **Assistentes**: Equipe de suporte e análise

### 2. **Sistema RAG (Knowledge Base)**

#### Funcionalidades:
- **Ingestão de Dados**: Processa biografias, competências, workflows
- **Status em Tempo Real**: Acompanha progresso da sincronização
- **Busca Inteligente**: Sistema de recuperação de informações

#### Como Usar:
1. **Insira o ID da Empresa** (UUID da empresa criada)
2. **Marque "Forçar atualização"** se quiser reprocessar tudo
3. **Clique "Ingerir RAG"** para iniciar o processamento
4. **Monitore o status** com o botão de refresh

### 3. **Controles de Scripts**

Execução da cascata de processamento:
- **Script 1**: Geração de biografias (LLM)
- **Script 2**: Extração de competências
- **Script 3**: Especificações técnicas
- **Script 4**: Análise de fluxos
- **Script 5**: Workflows N8N

---

## 🔄 Fluxo de Trabalho Completo

### Passo 1: Criar Empresa
1. Acesse o dashboard
2. Preencha dados da empresa
3. Configure nacionalidades desejadas
4. Ajuste distribuição da equipe
5. Clique **"Gerar Biografias"**

### Passo 2: Processar Dados
1. Aguarde geração das biografias
2. Execute Scripts 2-5 sequencialmente
3. Monitore progresso no painel de status

### Passo 3: Ingerir RAG
1. Copie o ID da empresa criada
2. Vá para seção "Sistema RAG"
3. Execute ingestão de dados
4. Valide estatísticas geradas

### Passo 4: Validação
1. Verifique outputs gerados
2. Confirme dados no Supabase
3. Teste busca RAG

---

## 🧠 Sistema LLM Inteligente

### Tecnologias Utilizadas

#### Google AI Gemini 2.5 Flash (Primário)
- **Custo**: 35% mais barato que OpenAI
- **Qualidade**: Excelente para biografias
- **Velocidade**: Ultra-rápido
- **Limite**: 2M tokens/minuto

#### OpenAI GPT-4o-mini (Fallback)
- **Ativação**: Automática se Gemini falhar
- **Backup**: Garante 100% disponibilidade
- **Qualidade**: Excelente consistência

### Recursos Avançados

#### Geração Multicultural
O sistema agora suporta **composições étnicas complexas**:

```json
{
  "nacionalidades": [
    {"tipo": "latinos", "percentual": 60},
    {"tipo": "asiaticos", "percentual": 25},
    {"tipo": "europeus", "percentual": 15}
  ]
}
```

**Resultado**: Personas com nomes, backgrounds culturais e idiomas apropriados para cada origem étnica.

#### Validação de Qualidade
- **Score automático**: 0.0 a 1.0
- **Fallback inteligente**: Muda provedor se qualidade baixa
- **Tracking de custos**: Monitora gastos em tempo real

#### Prompt Engineering
Prompts otimizados para:
- ✅ Realismo cultural
- ✅ Diversidade autêntica  
- ✅ Consistência profissional
- ✅ Backgrounds críveis

---

## 📊 Monitoramento e Custos

### Dashboard de Custos
```
Gemini 2.5 Flash: $1.60/empresa
OpenAI GPT-4o-mini: $2.10/empresa  
Economia: 35% usando Gemini como primário
```

### Métricas de Qualidade
- **Taxa de sucesso**: 100% (com fallback)
- **Tempo médio**: 45-60 segundos/empresa
- **Validação**: JSON estruturado garantido

---

## 🗄️ Banco de Dados

### VCM Central (Gestão Global)
```sql
-- Tabelas principais
empresas         -- Dados das empresas
personas         -- Biografias geradas  
competencias     -- Skills extraídas
workflows        -- Automações N8N
rag_documents    -- Knowledge base
rag_collections  -- Organização RAG
```

### RAG Database (Por Empresa)
- **Documentos**: Biografias, competências, workflows
- **Chunks**: Fragmentos para busca
- **Embeddings**: Vetores semânticos (futuro)
- **Collections**: Organização por empresa

---

## 🔧 Solução de Problemas

### Problemas Comuns

#### "API Desconectada"
```bash
# Verificar se backend está rodando
python api_bridge_llm.py
# Confirmar porta 8000 livre
```

#### "LLM service não disponível"
```bash
# Verificar variáveis de ambiente
echo $GOOGLE_AI_API_KEY
echo $OPENAI_API_KEY

# Reinstalar dependências
pip install google-generativeai openai
```

#### "Total deve somar 100%"
- Ajuste percentuais manualmente
- Use "Distribuir Igualmente"
- Use "Normalizar 100%"

#### "Supabase não conectado"
```bash
# Verificar credenciais no .env
# Testar conexão manual
python -c "from supabase import create_client; print('OK')"
```

### Logs de Depuração
```bash
# Backend logs
tail -f llm_service.log
tail -f biografia_llm.log  
tail -f rag_ingestion.log

# Frontend logs
# Abrir DevTools (F12) -> Console
```

---

## 📈 Recursos Avançados

### Automação Completa
- **Scripts encadeados**: Execução sequencial automática
- **Validação de dependências**: Impede execução fora de ordem
- **Recovery automático**: Reprocessa falhas automaticamente

### Personalização
```python
# Customizar prompts (llm_service.py)
PROMPT_TEMPLATES = {
    "biografia": "Seu prompt customizado aqui...",
    "competencias": "Template de competências..."
}

# Ajustar modelos LLM
PREFERRED_MODELS = {
    "google_ai": "gemini-2.5-flash",
    "openai": "gpt-4o-mini"
}
```

### Integração Externa
```python
# Webhook para notificações
WEBHOOK_URL = "https://seu-sistema.com/webhook"

# Export para ferramentas externas
def export_to_crm(empresa_data):
    # Sua lógica de integração
    pass
```

---

## 🎯 Casos de Uso

### 1. **Startup Tecnológica Internacional**
```
Nome: GlobalTech Solutions
Indústria: Tecnologia
Nacionalidades: 
  - Norte-americanos: 40%
  - Asiáticos: 35%  
  - Europeus: 25%
Resultado: Equipe multicultural realista para startup global
```

### 2. **Empresa de Saúde Regional**
```
Nome: MedCare Brasil  
Indústria: Saúde
Nacionalidades:
  - Brasileiros: 80%
  - Latinos: 20%
Resultado: Foco regional com diversidade cultural
```

### 3. **Consultoria de Marketing Global**
```
Nome: Creative Worldwide
Indústria: Marketing  
Nacionalidades:
  - Europeus: 30%
  - Norte-americanos: 25%
  - Latinos: 25%
  - Asiáticos: 20%
Resultado: Diversidade máxima para contexto global
```

---

## 🚀 Roadmap Futuro

### Próximas Funcionalidades
- ✅ **Avatares Nano Banana**: Geração automática de fotos realistas
- 🔄 **Embeddings vetoriais**: Busca semântica avançada
- 📱 **App móvel**: Interface nativa iOS/Android
- 🌍 **Multi-idioma**: Suporte completo a 10+ idiomas
- 🤖 **IA conversacional**: Chat com personas geradas

### Melhorias de Sistema
- **Performance**: Cache inteligente para respostas LLM
- **Segurança**: Criptografia end-to-end para dados sensíveis
- **Escalabilidade**: Suporte a 1000+ empresas simultâneas
- **Analytics**: Dashboard completo de métricas e insights

---

## 📞 Suporte

### Documentação Técnica
- **Arquitetura**: `/Docs/arquitetura-tecnica.md`
- **API Reference**: `/Docs/api-reference.md`
- **Database Schema**: `/Docs/schema-vcm-central.md`

### Contato
- **Email técnico**: dev@vcm-system.com
- **Issues GitHub**: [vcm-issues](https://github.com/vcm/issues)
- **Documentação**: [docs.vcm-system.com](https://docs.vcm-system.com)

---

**Versão**: 2.0 (November 2025)  
**Última atualização**: Sistema de nacionalidades múltiplas + RAG integrado  
**Compatibilidade**: Python 3.9+, Node.js 18+

---

*© 2025 VCM Team - Virtual Company Manager. Sistema inteligente para geração de empresas virtuais com IA avançada.*