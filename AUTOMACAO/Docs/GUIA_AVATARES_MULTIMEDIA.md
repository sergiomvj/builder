# 🎭 Guia Completo - Avatares Multimedia

## 📋 Visão Geral

Sistema completo para gerar imagens e vídeos de personas individuais ou em grupo usando múltiplos serviços de IA:

- **Fal.ai** (Flux models) - Rápido, barato, alta qualidade ⭐ RECOMENDADO
- **DALL-E 3** (OpenAI) - Alta qualidade, bom seguimento de prompts
- **Midjourney** - Máxima qualidade, requer processo manual

## 🚀 Instalação

### 1. Instalar Dependências

```bash
npm install @fal-ai/serverless-client
```

### 2. Configurar API Keys

Adicione ao `.env.local`:

```env
# OpenAI (para DALL-E 3)
OPENAI_API_KEY=sk-proj-...

# Fal.ai (para Flux models)
FAL_KEY=sua-chave-fal
```

Para obter a chave Fal.ai:
1. Acesse https://fal.ai
2. Crie uma conta (grátis)
3. Vá em Settings > API Keys
4. Crie uma nova chave

## 📸 Uso Básico

### Avatares Individuais (Recomendado: Fal.ai)

```bash
cd AUTOMACAO

# Gerar avatares profissionais de todas as personas via Fal.ai
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal --style=professional

# Gerar apenas para uma persona específica
node 06_generate_avatares_multimedia.js --empresaId=UUID --personaId=PERSONA_UUID --service=fal

# Estilo casual
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal --style=casual
```

### Fotos de Equipe

```bash
# Foto da equipe executiva via Fal.ai
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal --multi --style=professional

# Foto casual da equipe via DALL-E
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=dalle --multi --style=casual
```

### Usar DALL-E 3

```bash
# Avatar individual via DALL-E 3
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=dalle --style=professional

# Foto de equipe via DALL-E 3
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=dalle --multi
```

### Usar Midjourney (Processo Manual)

```bash
# Gera prompts otimizados para Midjourney
node 06_generate_avatares_multimedia.js --empresaId=UUID --service=midjourney --style=professional

# O script exibirá os prompts - copie e use no Discord:
# /imagine prompt: [COLE O PROMPT AQUI]
```

## 🎨 Estilos Disponíveis

### `--style=professional` (Padrão)
- Fundo neutro
- Roupa formal/corporativa
- Iluminação de estúdio
- Ideal para: LinkedIn, website corporativo, email signatures

### `--style=casual`
- Ambiente natural
- Roupa smart casual
- Iluminação natural
- Ideal para: About page, blog posts, redes sociais

### `--style=creative`
- Fundo artístico
- Styling moderno
- Iluminação dramática
- Ideal para: Agências criativas, startups de tech

### `--style=corporate`
- Ambiente executivo/boardroom
- Terno formal
- Iluminação profissional
- Ideal para: C-level executives, investidores

## 📊 Comparação de Serviços

| Serviço | Qualidade | Velocidade | Custo | Facilidade |
|---------|-----------|------------|-------|------------|
| **Fal.ai (Flux)** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 💰 | 🟢 Automático |
| **DALL-E 3** | ⭐⭐⭐⭐ | ⚡⚡ | 💰💰 | 🟢 Automático |
| **Midjourney** | ⭐⭐⭐⭐⭐ | ⚡ | 💰💰💰 | 🟡 Manual |

### 🎯 Recomendações

**Para produção em massa:** Use Fal.ai
- Mais rápido
- Mais barato
- Qualidade excelente
- Totalmente automático

**Para qualidade premium:** Use DALL-E 3
- Melhor seguimento de prompts
- Resultados mais consistentes
- Bom para avatares individuais

**Para campanhas especiais:** Use Midjourney
- Máxima qualidade artística
- Requer processo manual
- Melhor para hero images

## 💾 Estrutura de Dados Salva

Cada avatar é salvo em `avatares_multimedia` com:

```json
{
  "id": "uuid",
  "empresa_id": "uuid",
  "avatar_type": "photo",
  "avatar_category": "profile",
  "personas_ids": ["uuid1", "uuid2"],
  "personas_metadata": [
    {
      "persona_id": "uuid1",
      "name": "Sarah Johnson",
      "role": "CEO",
      "position": "center"
    }
  ],
  "file_url": "https://fal.media/...",
  "title": "Sarah Johnson - CEO professional portrait",
  "prompt_used": "professional corporate headshot...",
  "generation_metadata": {
    "service": "fal",
    "model": "fal-ai/flux-pro",
    "size": "landscape_16_9"
  },
  "style": "professional",
  "use_cases": ["website_hero", "linkedin_profile"],
  "status": "completed"
}
```

## 🔍 Queries Úteis

### Buscar avatares de uma persona

```sql
SELECT * FROM get_avatares_by_persona('persona-uuid');
```

### Buscar fotos de equipe

```sql
SELECT * FROM get_multi_persona_avatares('empresa-uuid');
```

### Estatísticas de uso

```sql
SELECT * FROM avatares_multimedia_stats 
WHERE empresa_id = 'empresa-uuid';
```

## 📈 Casos de Uso

### 1. Website Hero Section
```bash
# Gerar avatar profissional do CEO
node 06_generate_avatares_multimedia.js \
  --empresaId=UUID \
  --personaId=CEO_UUID \
  --service=fal \
  --style=professional
```

### 2. Página "Sobre Nós" (Team Page)
```bash
# Gerar foto da equipe executiva
node 06_generate_avatares_multimedia.js \
  --empresaId=UUID \
  --service=fal \
  --multi \
  --style=corporate
```

### 3. LinkedIn Profiles (Em Massa)
```bash
# Gerar avatares profissionais de todos
node 06_generate_avatares_multimedia.js \
  --empresaId=UUID \
  --service=fal \
  --style=professional
```

### 4. Blog Posts / Social Media
```bash
# Avatares casuais para conteúdo
node 06_generate_avatares_multimedia.js \
  --empresaId=UUID \
  --service=fal \
  --style=casual
```

## 🎬 Roadmap Futuro

### Vídeos (HeyGen / Runway)
- [ ] Integração com HeyGen para avatares falantes
- [ ] Vídeos de apresentação personalizados
- [ ] Lip-sync com scripts de vendas

### Avatares Animados
- [ ] GIFs animados para chat/email
- [ ] Expressões faciais variadas
- [ ] Gestos e movimentos

### 3D Renders
- [ ] Modelos 3D das personas
- [ ] Personalização de roupas/acessórios
- [ ] Exportação para Unity/Unreal

## 💡 Dicas de Otimização

### 1. Rate Limiting
O script inclui pausa de 3 segundos entre gerações para respeitar limites de API.

### 2. Custos
- **Fal.ai Flux-Pro**: ~$0.05 por imagem
- **DALL-E 3 HD**: ~$0.08 por imagem
- **Midjourney**: ~$0.10-0.20 por imagem (assinatura)

### 3. Qualidade vs Velocidade
```bash
# Modo rápido (Fal.ai Flux-Dev - mais barato)
# Edite o script linha 245: model = 'fal-ai/flux/dev'

# Modo premium (Flux-Pro)
# model = 'fal-ai/flux-pro' (padrão)
```

## 🐛 Troubleshooting

### Erro: "FAL_KEY not configured"
```bash
# Adicione ao .env.local:
FAL_KEY=sua-chave-aqui
```

### Erro: "OPENAI_API_KEY not configured"
```bash
# Adicione ao .env.local:
OPENAI_API_KEY=sk-proj-...
```

### Imagens de baixa qualidade
- Use `--service=fal` com Flux-Pro
- Ou use `--service=dalle` para consistência
- Refine os prompts editando funções `buildPrompt*`

### Rate limit atingido
- Aumente o delay entre gerações (linha 460)
- Use batch menor de personas
- Distribua entre múltiplas API keys

## 📞 Suporte

Para dúvidas ou issues:
1. Verifique logs em `avatares_multimedia_output/log_*.json`
2. Consulte documentação da API usada
3. Teste com uma persona individual primeiro

## 🎯 Próximos Passos

1. **Gerar avatares para ARVA Tech:**
```bash
node 06_generate_avatares_multimedia.js \
  --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 \
  --service=fal \
  --style=professional
```

2. **Criar foto de equipe executiva:**
```bash
node 06_generate_avatares_multimedia.js \
  --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17 \
  --service=fal \
  --multi \
  --style=corporate
```

3. **Integrar no frontend:**
- Criar galeria de avatares no PersonaDetail
- Adicionar botão "Gerar Avatar" no dashboard
- Exibir avatares no Team Page

---

**🎭 Sistema de Avatares Multimedia - VCM v1.0**
