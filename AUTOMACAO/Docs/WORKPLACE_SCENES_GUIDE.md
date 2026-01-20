# 🎬 Guia de Geração de Cenas de Trabalho Multi-Persona

## 🎯 Objetivo

Gerar imagens **ultra-realistas** de situações profissionais envolvendo **múltiplas personas** da empresa, mantendo **consistência absoluta** das características físicas de cada pessoa em todas as gerações.

## 🔑 Vantagem Competitiva

Com os **System Prompts detalhados** salvos no banco de dados, você pode:

1. ✅ **Consistência perfeita** - Mesma pessoa sempre com mesma aparência
2. ✅ **Cenários multi-persona** - Múltiplas pessoas na mesma cena
3. ✅ **Realismo fotográfico** - Qualidade 4K profissional
4. ✅ **Uso em marketing** - Materiais corporativos, site, apresentações
5. ✅ **Escalabilidade** - Gerar infinitas cenas sem fotógrafos

---

## 📋 Cenários Disponíveis

### 1. **Reunião Estratégica**
- **Personas**: CEO, CFO, CTO
- **Ambiente**: Sala de reuniões executiva
- **Uso**: Apresentações institucionais, relatórios anuais

### 2. **Apresentação de Projeto**
- **Personas**: CTO, Engenheiro, Designer
- **Ambiente**: Sala de apresentação tech
- **Uso**: Materiais técnicos, blog posts

### 3. **Brainstorm Criativo**
- **Personas**: Designer, Marketing, Product Manager
- **Ambiente**: Espaço colaborativo moderno
- **Uso**: Conteúdo sobre inovação, cultura empresarial

### 4. **Videochamada com Cliente**
- **Personas**: CEO, Sales Manager
- **Ambiente**: Home office executivo
- **Uso**: Materiais de vendas, cases de sucesso

### 5. **Trabalho Colaborativo**
- **Personas**: Engenheiro, Designer, QA
- **Ambiente**: Coworking moderno
- **Uso**: Vagas de emprego, cultura da empresa

### 6. **Treinamento de Equipe**
- **Personas**: HR Manager, Assistentes
- **Ambiente**: Sala de treinamento
- **Uso**: Materiais de RH, onboarding

---

## 🚀 Como Usar

### **Passo 1: Executar o Script**

```bash
cd AUTOMACAO
node 06_generate_workplace_scenes.js --empresaId=<ID_EMPRESA>
```

**Exemplo**:
```bash
node 06_generate_workplace_scenes.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

### **Passo 2: Verificar Outputs**

O script gera **2 arquivos por cenário** em `AUTOMACAO/workplace_scenes_prompts/`:

1. **`.txt`** - Prompt completo para copiar/colar
2. **`.json`** - Metadata (personas usadas, timestamp, etc)

**Exemplo**:
```
workplace_scenes_prompts/
├── reuniao_estrategica_2025-11-28T15-30-00.txt
├── reuniao_estrategica_2025-11-28T15-30-00.json
├── apresentacao_projeto_2025-11-28T15-30-05.txt
├── apresentacao_projeto_2025-11-28T15-30-05.json
└── ...
```

### **Passo 3: Gerar Imagens**

#### **Opção A: Midjourney (Recomendado)**

1. Abra o Discord do Midjourney
2. Use comando `/imagine`
3. Cole o prompt do arquivo `.txt`
4. Adicione parâmetros: `--ar 16:9 --q 2 --style raw`

**Exemplo completo**:
```
/imagine [PROMPT COMPLETO AQUI] --ar 16:9 --q 2 --style raw --v 6
```

#### **Opção B: DALL-E 3 (OpenAI)**

```python
import openai

with open('reuniao_estrategica_2025-11-28T15-30-00.txt', 'r') as f:
    prompt = f.read()

response = openai.images.generate(
    model="dall-e-3",
    prompt=prompt,
    size="1792x1024",  # 16:9 ratio
    quality="hd",
    n=1
)

image_url = response.data[0].url
```

#### **Opção C: Stable Diffusion XL**

```bash
# ComfyUI ou Automatic1111
# Carregar prompt do .txt
# Settings:
# - Steps: 30-50
# - CFG Scale: 7-9
# - Sampler: DPM++ 2M Karras
# - Size: 1344x768 (16:9)
```

### **Passo 4: Salvar e Organizar**

```
public/images/workplace_scenes/
├── arva_tech/
│   ├── reuniao_estrategica.jpg
│   ├── apresentacao_projeto.jpg
│   └── brainstorm_criativo.jpg
└── carntrack/
    └── ...
```

---

## 🎨 Estrutura do Prompt Gerado

Cada prompt contém **4 seções principais**:

### **1. Descrição do Cenário**
```
CENÁRIO: Reunião Estratégica
DESCRIÇÃO: Reunião de diretoria discutindo estratégia empresarial
```

### **2. Especificações Técnicas**
```
AMBIENTE: Sala de reuniões executiva, mesa de vidro...
COMPOSIÇÃO: Visão de conjunto mostrando 3 pessoas...
ILUMINAÇÃO: Iluminação profissional de escritório...
ÂNGULO: Ângulo de 3/4, capturando interação...
```

### **3. Descrição Física das Personas** (CRÍTICO)
```
PERSONA Sarah Mitchell (CEO):
- Tom de pele: pele clara levemente bronzeada
- Rosto: oval, traços refinados
- Olhos: azuis claros, amendoados
- Cabelo: loiro areia, comprimento médio, liso
- Tipo físico: atlético, elegante
- Estilo vestuário: executivo formal
- Acessórios: óculos discretos, relógio elegante
```

### **4. Parâmetros Técnicos**
```
- Estilo: Fotografia corporativa profissional, realista
- Qualidade: 4K, ultra-high resolution
- Câmera: DSLR full-frame, 35mm ou 50mm lens
- Formato: 16:9 landscape
```

---

## 🔐 Garantia de Consistência

### **Por que funciona?**

1. **System Prompt salvo** - Descrição física idêntica em todas as gerações
2. **Parâmetros fixos** - Mesmos termos (ex: "loiro areia" sempre, não "loiro")
3. **Ordem consistente** - Características listadas na mesma sequência
4. **Detalhamento extremo** - 15+ parâmetros essenciais por pessoa

### **Teste de Consistência**

Para validar que a mesma pessoa aparece igual em múltiplas cenas:

1. Gere 3 cenários diferentes com a mesma persona
2. Compare: cabelo, rosto, expressão, vestuário
3. Devem ser **reconhecíveis como a mesma pessoa**

---

## 📊 Use Cases Práticos

### **1. Website Institucional**
- Hero sections com equipe real
- Seções "Nosso Time" com cenas dinâmicas
- Páginas de cultura e valores

### **2. Materiais de Vendas**
- Apresentações corporativas
- Cases de sucesso
- Propostas comerciais

### **3. Redes Sociais**
- Posts sobre dia-a-dia da empresa
- Conteúdo "behind the scenes"
- Depoimentos visuais

### **4. Recrutamento**
- Vagas de emprego com ambiente real
- Páginas de carreira
- Vídeos de onboarding

### **5. Treinamentos Internos**
- Materiais didáticos
- Manuais de processos
- Apresentações de RH

---

## ⚙️ Customização

### **Adicionar Novo Cenário**

Edite `06_generate_workplace_scenes.js`:

```javascript
const WORKPLACE_SCENARIOS = [
  // ... cenários existentes
  {
    id: 'seu_cenario',
    nome: 'Nome do Cenário',
    descricao: 'Descrição breve',
    personas_necessarias: ['CEO', 'CFO'], // Cargos
    ambiente: 'Descrição detalhada do ambiente',
    composicao: 'Como as pessoas estão posicionadas',
    iluminacao: 'Tipo de iluminação',
    angulo: 'Ângulo da câmera'
  }
];
```

### **Ajustar Prompts**

Para alterar estilo geral, edite a função `buildMultiPersonaPrompt()`:

```javascript
// Mudar de "corporativo profissional" para "casual startup"
- Estilo: Fotografia corporativa profissional, realista
+ Estilo: Fotografia casual de startup, ambiente descontraído
```

---

## 🎯 Melhores Práticas

### ✅ **DO**

1. **Sempre use System Prompts salvos** - Não improvise características
2. **Mantenha iluminação consistente** - Mesma qualidade em todas as cenas
3. **Respeite hierarquia visual** - CEO em destaque, assistentes em segundo plano
4. **Use cenários plausíveis** - Situações reais de trabalho
5. **Salve metadata** - Registre quais personas foram usadas

### ❌ **DON'T**

1. **Não misture estilos** - Não coloque foto realista com cartoon
2. **Não ignore acessórios** - Se persona usa óculos, sempre incluir
3. **Não mude características** - Cabelo loiro não vira castanho
4. **Não exagere na edição** - Manter naturalidade
5. **Não reusar prompts genéricos** - Sempre use os personalizados

---

## 🐛 Troubleshooting

### **Problema: Personas não parecem as mesmas**

**Solução**:
1. Verifique se System Prompt está salvo no banco
2. Execute novamente `00_generate_avatares.js`
3. Use parâmetros mais específicos (ex: "loiro areia" não "loiro")

### **Problema: Imagem de baixa qualidade**

**Solução**:
1. Use `--q 2` no Midjourney
2. DALL-E 3: usar `quality="hd"`
3. Stable Diffusion: aumentar steps (50+)

### **Problema: Composição incorreta**

**Solução**:
1. Ajuste o campo `composicao` no cenário
2. Adicione mais detalhes sobre posicionamento espacial
3. Use referências visuais (grid layout)

### **Problema: Script não encontra personas**

**Solução**:
1. Verifique cargos no banco (devem corresponder aos cenários)
2. Execute `00_generate_avatares.js` primeiro
3. Confirme que `system_prompt` não está NULL

---

## 📈 Próximos Passos

### **Fase 1: Validação** ✅
- [x] System Prompts salvos no banco
- [x] Script de geração de prompts
- [ ] Gerar 2-3 cenas teste
- [ ] Validar consistência visual

### **Fase 2: Produção**
- [ ] Gerar todos os 6 cenários
- [ ] Criar variações (diferentes ângulos)
- [ ] Organizar biblioteca de assets

### **Fase 3: Integração**
- [ ] Upload no Supabase Storage
- [ ] Tabela `workplace_scenes` no banco
- [ ] API endpoint para buscar cenas
- [ ] Componente React para exibir

### **Fase 4: Automação**
- [ ] Webhook para geração automática
- [ ] Integração direta com Midjourney API
- [ ] Processamento em lote
- [ ] CDN para distribuição

---

## 💡 Insights Técnicos

### **Por que 16:9?**
- Formato universal para apresentações e web
- Compatível com PowerPoint, Google Slides
- Ideal para hero sections de websites

### **Por que 4K?**
- Alta resolução para impressão
- Zoom sem perda de qualidade
- Versátil para diferentes usos

### **Por que DSLR style?**
- Profundidade de campo natural
- Qualidade fotográfica, não CGI
- Mais crível para uso corporativo

---

## 📞 Suporte

**Problemas?** Abra uma issue com:
1. Arquivo `.json` da cena problemática
2. Screenshot do resultado obtido
3. Resultado esperado
4. Plataforma usada (Midjourney/DALL-E/SD)

---

## 🎓 Referências

- [Midjourney Prompting Guide](https://docs.midjourney.com/docs/prompts)
- [DALL-E 3 Best Practices](https://platform.openai.com/docs/guides/images)
- [Descricao_Fisica_Personagens.md](./02_PROCESSAMENTO_PERSONAS/Descricao_Fisica_Personagens.md)
- [System Prompt Schema](../src/lib/supabase.ts)

---

**Versão**: 1.0.0  
**Última atualização**: 28/11/2025  
**Autor**: VCM Development Team
