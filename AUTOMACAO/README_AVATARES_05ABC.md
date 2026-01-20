# 🎭 Pipeline de Avatares - Scripts 05a, 05b, 05c

## 📋 Visão Geral

Sistema modular em 3 etapas para geração de avatares profissionais fotorrealistas:

1. **Script 05a**: Gera descrições físicas e prompts otimizados via LLM
2. **Script 05b**: Gera imagens via Fal.ai (flux-pro ou flux-dev)
3. **Script 05c**: Baixa e armazena imagens localmente com thumbnails

---

## 🚀 Instalação de Dependências

```bash
npm install sharp
```

Verifique se já instalado:
- `@fal-ai/serverless-client` ✅ (já no package.json)
- `openai` ✅ (já no package.json)
- `sharp` ⚠️ (precisa instalar)

---

## 🔧 Configuração

Adicione ao `.env.local`:

```env
# OpenAI (para Script 05a - geração de prompts)
OPENAI_API_KEY=sk-proj-...

# Fal.ai (para Script 05b - geração de imagens)
FAL_KEY=sua-chave-fal-ai
```

**Obter chave Fal.ai:**
1. Acesse https://fal.ai/dashboard
2. Crie conta (grátis)
3. Vá em Settings > API Keys
4. Crie nova chave

---

## 📖 Uso Passo a Passo

### **Passo 1: Gerar Prompts Físicos (Rápido, ~3 min)**

```bash
cd AUTOMACAO
node 05a_generate_avatar_prompts.js --empresaId=UUID
```

**O que faz:**
- ✅ Busca biografia, atribuições, competências
- ✅ Gera descrição física detalhada via OpenAI
- ✅ Cria prompt otimizado para Fal.ai
- ✅ Salva `system_prompt` em tabela `personas`
- ✅ Salva metadados em `personas_avatares` (sem imagem)

**Resultado:**
- Tabela `personas`: Campo `system_prompt` preenchido
- Tabela `personas_avatares`: Registro criado com `prompt_usado`

**Modo força (regenerar tudo):**
```bash
node 05a_generate_avatar_prompts.js --empresaId=UUID --force
```

---

### **Passo 2: Gerar Imagens via Fal.ai (~15 min, $0.75 para 15 personas)**

```bash
node 05b_generate_images_fal.js --empresaId=UUID
```

**Opções:**

```bash
# Modelo rápido e barato (Flux-Dev: $0.025/imagem)
node 05b_generate_images_fal.js --empresaId=UUID --model=flux-dev

# Modelo de alta qualidade (Flux-Pro: $0.05/imagem) - PADRÃO
node 05b_generate_images_fal.js --empresaId=UUID --model=flux-pro

# Tentar novamente falhas
node 05b_generate_images_fal.js --empresaId=UUID --retry-failed
```

**O que faz:**
- ✅ Busca prompts de `personas_avatares`
- ✅ Chama Fal.ai API (assíncrono)
- ✅ Aguarda geração (~20-30s por imagem)
- ✅ Salva URLs em `avatar_url` e `avatar_thumbnail_url`
- ✅ Marca `ativo=true`

**Resultado:**
- Tabela `personas_avatares`: Campos `avatar_url` e `avatar_thumbnail_url` preenchidos
- URLs apontam para CDN do Fal.ai

**Custo estimado:**
- Flux-Dev: $0.025 × 15 personas = **$0.375**
- Flux-Pro: $0.05 × 15 personas = **$0.75**

---

### **Passo 3: Download Local (~2 min)**

```bash
node 05c_download_avatares.js --empresaId=UUID
```

**O que faz:**
- ✅ Busca `avatar_url` de `personas_avatares`
- ✅ Baixa imagens do Fal.ai CDN
- ✅ Salva em `/public/avatars/{empresaId}/{personaId}.jpg`
- ✅ Gera thumbnails 200x200 (otimizados)
- ✅ Atualiza `avatar_local_path` no banco

**Resultado:**
- Pasta `/public/avatars/{empresaId}/` com:
  - `{personaId}.jpg` (1024×1024, ~200-400KB)
  - `{personaId}_thumb.jpg` (200×200, ~20-40KB)
- Tabela `personas_avatares`: Campos `avatar_local_path` e `avatar_thumbnail_local_path` preenchidos

**Tentar novamente falhas:**
```bash
node 05c_download_avatares.js --empresaId=UUID --retry-failed
```

---

## 📊 Estrutura de Dados

### Tabela `personas`
```json
{
  "system_prompt": {
    "descricao_fisica_completa": {
      "idade_aparente": "30-35",
      "etnia": "caucasiano",
      "pele_tom": "morena clara",
      "olhos": { "cor": "castanhos escuros" },
      "cabelo": {
        "cor": "castanho escuro",
        "comprimento": "curto",
        "estilo": "bem penteado"
      },
      "tipo_fisico": "atlético",
      "altura_aproximada": "1.75m"
    }
  }
}
```

### Tabela `personas_avatares`
```json
{
  "persona_id": "uuid",
  "prompt_usado": "Professional portrait of...",
  "avatar_url": "https://fal.media/files/...",
  "avatar_thumbnail_url": "https://fal.media/files/...",
  "avatar_local_path": "/avatars/{empresaId}/{personaId}.jpg",
  "avatar_thumbnail_local_path": "/avatars/{empresaId}/{personaId}_thumb.jpg",
  "servico_usado": "fal_ai_flux-pro",
  "ativo": true,
  "biometrics": { ... },
  "metadados": { ... }
}
```

---

## 🔄 Pipeline Completo (Exemplo Real)

```bash
# ID da empresa de teste
EMPRESA_ID="7761ddfd-0ecc-4a11-95fd-5ee913a6dd17"

# Passo 1: Prompts (3 min, grátis)
node 05a_generate_avatar_prompts.js --empresaId=$EMPRESA_ID

# Passo 2: Imagens Fal.ai (15 min, $0.75)
node 05b_generate_images_fal.js --empresaId=$EMPRESA_ID --model=flux-pro

# Passo 3: Download (2 min, grátis)
node 05c_download_avatares.js --empresaId=$EMPRESA_ID
```

**Tempo total:** ~20 minutos  
**Custo total:** $0.75 USD (15 personas)

---

## 🎯 Vantagens da Separação em 3 Scripts

### ✅ **Controle Granular**
- Revisar prompts antes de gastar créditos
- Pausar entre etapas se necessário
- Ajustar parâmetros individuais

### ✅ **Resiliência**
- Se Fal.ai falhar, não precisa regenerar prompts
- Se download falhar, não precisa regenerar imagens
- Retry seletivo com `--retry-failed`

### ✅ **Economia**
- LLM (barato) separado de Fal.ai (pago)
- Testar prompts antes de gastar
- Escolher modelo Flux-Dev (barato) vs Flux-Pro (qualidade)

### ✅ **Escalabilidade**
- Gerar 100 prompts rápido (5 min)
- Gerar imagens em lotes controlados
- Download paralelo futuro (se necessário)

---

## 🐛 Troubleshooting

### Erro: `FAL_KEY not found`
```bash
# Adicione ao .env.local:
FAL_KEY=sua-chave-aqui
```

### Erro: `OPENAI_API_KEY not found`
```bash
# Adicione ao .env.local:
OPENAI_API_KEY=sk-proj-...
```

### Erro: `Cannot find module 'sharp'`
```bash
npm install sharp
```

### Nenhuma persona processada
```bash
# Verifique se Script 05a foi executado antes:
node 05a_generate_avatar_prompts.js --empresaId=UUID

# Ou force regeneração:
node 05a_generate_avatar_prompts.js --empresaId=UUID --force
```

### Download falhou
```bash
# Tente novamente apenas as falhas:
node 05c_download_avatares.js --empresaId=UUID --retry-failed
```

---

## 📁 Arquivos Gerados

```
/public/avatars/
└── {empresaId}/
    ├── {personaId1}.jpg         (1024×1024, ~300KB)
    ├── {personaId1}_thumb.jpg   (200×200, ~30KB)
    ├── {personaId2}.jpg
    ├── {personaId2}_thumb.jpg
    └── ...
```

---

## 🎨 Próximos Passos

Após executar os 3 scripts, os avatares estarão prontos para:

1. **Frontend**: Exibir em cards de personas
2. **API**: Servir via `/avatars/{empresaId}/{personaId}.jpg`
3. **Export**: Incluir em relatórios/apresentações
4. **Redes sociais**: Posts automatizados com rostos da equipe

**Uso no frontend:**
```tsx
<img 
  src={persona.avatar_local_path} 
  alt={persona.full_name}
  className="w-24 h-24 rounded-full"
/>
```

---

## 📊 Comparação de Modelos Fal.ai

| Modelo | Qualidade | Velocidade | Custo | Uso Recomendado |
|--------|-----------|------------|-------|-----------------|
| **Flux-Pro** | ⭐⭐⭐⭐⭐ | 30s | $0.05 | Produção final |
| **Flux-Dev** | ⭐⭐⭐⭐ | 20s | $0.025 | Testes/protótipos |

**Recomendação:** Use **Flux-Dev** para testar, depois regenere com **Flux-Pro** para produção.

---

**🎉 Pipeline de Avatares Completo e Modular!**
