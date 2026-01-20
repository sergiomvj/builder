# Script 01.3 - Geração de Imagens de Avatares

## 🎯 Objetivo
Gera imagens customizadas e realistas para os avatares das personas usando **fal.ai FLUX Schnell**, baseado nas descrições físicas detalhadas criadas pelo Script 00.

## 📋 Pré-requisitos
1. ✅ Script 00 (Avatares) já executado - descrições físicas criadas
2. ✅ `FAL_AI_API_KEY` configurada no `.env.local`
3. ✅ Diretório `public/avatars/` criado automaticamente

## 🚀 Uso

```bash
cd AUTOMACAO
node 01.3_generate_avatar_images.cjs --empresaId=SEU_ID_AQUI
```

### Exemplo (ARVA Tech Solutions):
```bash
node 01.3_generate_avatar_images.cjs --empresaId=58234085-d661-4171-8664-4149b5559a3c
```

## 🎨 O que o script faz:

1. **Lê os avatares** da tabela `avatares_personas` que ainda não têm imagem local
2. **Constrói prompts detalhados** usando os biometrics (cor de cabelo, olhos, pele, etc.)
3. **Gera imagem via fal.ai** (modelo FLUX Schnell - rápido e gratuito)
4. **Baixa e salva** a imagem em `public/avatars/[persona_code].jpg`
5. **Atualiza o banco** com a URL local (`/avatars/persona.jpg`)

## 📊 Progresso
O script atualiza `script-progress.json` em tempo real. Você pode monitorar pela interface web.

## 💾 Saída
- **Imagens**: `public/avatars/[persona_code].jpg`
- **URL no banco**: `/avatars/[persona_code].jpg`
- **Metadados**: Salvos no campo `metadados` da tabela `avatares_personas`

## 🎭 Modelo Usado
- **Modelo**: `fal-ai/flux/schnell`
- **Resolução**: 1024x1024
- **Formato**: JPEG
- **Steps**: 4 (otimizado para Schnell)
- **Guidance Scale**: 3.5

## 🔍 Visualização
Acesse a página de detalhes da persona para ver:
- ✨ Imagem gerada em alta qualidade
- 🎨 Metadados da geração (modelo, prompt usado, etc.)
- 📋 Características biométricas usadas

## ⚙️ Rate Limits
- Delay de **3 segundos** entre cada geração
- Para 25 personas: ~2 minutos total
- Fal.ai tier gratuito: limite generoso

## 🐛 Troubleshooting

### Erro: "FAL_AI_API_KEY não encontrada"
```bash
# Verifique se está no .env.local:
FAL_AI_API_KEY=sua_key_aqui
```

### Imagem não aparece na interface
1. Verifique se o arquivo existe: `public/avatars/[persona_code].jpg`
2. Reinicie o servidor Next.js: `npm run dev`
3. Limpe o cache do navegador

### Erro: "No endpoints found"
- Verifique sua API key do fal.ai
- Confirme que tem créditos disponíveis

## 📈 Próximos Passos
Após gerar as imagens:
1. ✅ Visualize na página de detalhes das personas
2. ✅ As imagens são usadas automaticamente em toda a interface
3. ✅ Continue com os próximos scripts (02, 02.5, 03...)
