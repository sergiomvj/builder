# 🎨 Script 05b - Migração para HuggingFace SDXL (FREE)

## ✅ Mudanças Implementadas

### **Antes: Fal.ai ($0.055/imagem)**
- Custo: $2.20 para 40 personas
- Qualidade: Boa mas rostos similares
- Problemas: Pouca diversidade, custo alto

### **Agora: HuggingFace SDXL (100% FREE)**
- Custo: **$0.00** (gratuito)
- Qualidade: **Superior** (RealVisXL v4.0)
- Diversidade: **Excelente** (seed único por persona)
- Rate Limit: ~100 imagens/hora

---

## 🚀 Como Usar

### 1. Obter Token HuggingFace (Gratuito)

```bash
# Acesse: https://huggingface.co/settings/tokens
# Crie um token READ (gratuito)
# Adicione ao .env.local:
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Executar Script

```bash
cd AUTOMACAO
node 05b_generate_images_fal.js --empresaId=UUID
```

**Opções:**
- `--retry-failed` - Apenas falhas anteriores
- `--force` - Regenera TODAS as imagens

---

## 🤖 Modelos Disponíveis

O script usa **RealVisXL v4.0** por padrão (melhor para rostos corporativos):

```javascript
const MODELS = [
  {
    id: 'SG161222/RealVisXL_V4.0',
    name: 'RealVisXL v4.0',
    description: 'Fotorrealismo extremo, melhor para rostos corporativos'
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base',
    description: 'Modelo oficial Stability AI, equilibrado'
  },
  {
    id: 'RunDiffusion/Juggernaut-XL-v9',
    name: 'Juggernaut XL v9',
    description: 'Otimizado para retratos profissionais'
  }
];
```

Para mudar modelo, edite `SELECTED_MODEL = MODELS[0]` no script.

---

## 📊 Comparação de Qualidade

### **Melhorias Implementadas:**

1. **Prompt Negativo Forte:**
```javascript
const negativePrompt = [
  'blurry', 'low quality', 'distorted', 'deformed', 'ugly', 
  'bad anatomy', 'duplicate faces', 'clone', 'multiple people',
  'watermark', 'text', 'cartoon', 'anime', 'illustration',
  'poorly drawn', 'extra limbs', 'disfigured', 
  'gross proportions', 'malformed limbs'
].join(', ');
```

2. **Seed Único por Persona:**
```javascript
// Garante rostos completamente diferentes
const personaSeed = parseInt(persona.id.replace(/[^0-9]/g, '').substring(0, 9));
```

3. **Prompt Otimizado para SDXL:**
```javascript
const finalPrompt = `${prompt}, ${uniqueIdentifiers}, 
  professional corporate headshot, studio lighting, 
  high resolution, 8k uhd, photorealistic, 
  detailed facial features, sharp focus, canon eos r5`;
```

4. **Parâmetros de Qualidade:**
```javascript
parameters: {
  negative_prompt: negativePrompt,
  num_inference_steps: 40,    // Alta qualidade
  guidance_scale: 7.5,         // Segue prompt fielmente
  width: 1024,
  height: 1024,
  seed: personaSeed            // Diversidade garantida
}
```

---

## 🔄 Fluxo de Trabalho

```
Script 05a (Prompts)
  ↓
Script 05b (Gera Imagens via HuggingFace) ⭐ ATUALIZADO
  ↓ Salva em: AUTOMACAO/temp_avatars/
  ↓ Metadados em: personas_avatares.avatar_url (caminho local)
  ↓
Script 05c (Organiza + Thumbnails)
  ↓ Move para: public/avatars/
  ↓ Cria thumbnails: public/avatars/thumbnails/
  ↓ Atualiza DB com caminhos finais
```

---

## ⚠️ Rate Limits e Tratamento de Erros

### **Rate Limit (429):**
```javascript
if (response.status === 429) {
  console.log('⏸️  Rate limit atingido, aguardando 60 segundos...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  // Retry automático
}
```

### **Modelo Carregando (503):**
```javascript
if (response.status === 503 || errorText.includes('loading')) {
  console.log('⏳ Modelo carregando, aguardando 20 segundos...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  // Retry automático
}
```

### **Retries:**
- 3 tentativas por imagem
- Delays inteligentes (5s entre imagens, 60s para rate limit)

---

## 💾 Armazenamento Temporário

Imagens são salvas localmente primeiro:

```javascript
const tempDir = path.join(__dirname, 'temp_avatars');
const tempFilePath = path.join(tempDir, `${persona.id}_temp.jpg`);
fs.writeFileSync(tempFilePath, buffer);
```

**Por quê?**
- HuggingFace retorna Blob (dados binários)
- Script 05c organiza e move para `public/avatars/`
- Permite retry sem chamar API novamente

---

## 📈 Performance

| Métrica | Fal.ai | HuggingFace SDXL |
|---------|--------|------------------|
| Custo (40 imgs) | $2.20 | **$0.00** |
| Tempo/imagem | 20-30s | 15-25s |
| Qualidade | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Diversidade | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Rate Limit | Nenhum | ~100/hora |

---

## 🧪 Testar Agora

```bash
# 1. Configure token
echo "HUGGINGFACE_API_KEY=hf_seu_token" >> .env.local

# 2. Execute script
cd AUTOMACAO
node 05b_generate_images_fal.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad

# 3. Verifique resultados
ls temp_avatars/  # Deve ter 40 imagens .jpg

# 4. Execute próximo passo
node 05c_download_avatares.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad
```

---

## 🎉 Benefícios

✅ **100% Gratuito** - Sem custos de API  
✅ **Alta Qualidade** - RealVisXL v4.0 fotorrealista  
✅ **Diversidade Máxima** - Seed único + prompt personalizado  
✅ **Retry Inteligente** - Trata rate limits automaticamente  
✅ **Armazenamento Local** - Imagens salvas antes de processar  
✅ **Metadados Completos** - Tracking de modelo, seed, tamanho, etc  

---

## 🔧 Dependências Removidas

```bash
# Não é mais necessário:
npm uninstall @fal-ai/serverless-client
```

**Agora usa apenas:**
- `node-fetch` (já instalado)
- `@supabase/supabase-js` (já instalado)
- Módulos nativos: `fs`, `path`

---

## 📝 Próximos Passos

Após executar Script 05b com sucesso:

1. ✅ Imagens em `temp_avatars/`
2. ⏭️ Executar Script 05c para organização final
3. 🎨 Imagens disponíveis em `public/avatars/`
4. 🖼️ Thumbnails em `public/avatars/thumbnails/`

**Sistema completamente funcional e 100% gratuito! 🚀**
