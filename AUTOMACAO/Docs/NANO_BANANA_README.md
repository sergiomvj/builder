# 🎨 Nano Banana - Gerador de Imagens de Avatares

Sistema de geração de imagens hiper-realistas usando **Gemini 2.5 Flash Image** ("Nano Banana") com sistema de fila persistente que respeita os limites da conta gratuita do Google AI.

## 📋 Pré-requisitos

### 1. Executar Script 05 (Avatares JSON)
Antes de gerar imagens, você precisa ter os dados de avatar gerados:

```bash
node 05_generate_avatares.js --empresaId=YOUR_EMPRESA_ID
```

Este script gera as descrições físicas das personas e salva em `avatar_url`.

### 2. Criar Colunas no Banco de Dados
Execute o SQL no Supabase SQL Editor:

```bash
# Arquivo: add_avatar_image_columns.sql
```

Isso adiciona as colunas:
- `avatar_image_url` - URL da imagem gerada
- `avatar_image_generated_at` - Timestamp da geração
- `avatar_image_prompt` - Prompt usado (auditoria)

E cria o bucket `persona-avatars` no Supabase Storage.

### 3. Verificar API Key do Google AI
Certifique-se de que `GOOGLE_AI_API_KEY` está configurada no `.env.local`.

## 🚀 Como Usar

### Criar Fila de Processamento

```bash
node 05.5_generate_avatar_images_nanobana.js --empresaId=58234085-d661-4171-8664-4149b5559a3c
```

Isso cria um arquivo `nanobana_queue.json` com todas as personas da empresa que têm avatar JSON mas não têm imagem ainda.

### Ver Status da Fila

```bash
node 05.5_generate_avatar_images_nanobana.js --status
```

Saída:
```
======================================================================
📊 STATUS DA FILA NANO BANANA
======================================================================
🏢 Empresa: 58234085-d661-4171-8664-4149b5559a3c
📅 Criada em: 02/12/2025 15:30:45
🔄 Última atualização: 02/12/2025 16:45:12

📈 ESTATÍSTICAS:
   Total: 21
   ⏳ Pendentes: 8
   ✅ Completos: 13
   ❌ Falhas: 0
   📸 Hoje: 13/15
   📅 Último reset: 2025-12-02

⏳ PRÓXIMAS NA FILA:
   1. João Silva - Desenvolvedor Senior
   2. Maria Santos - Designer UX
   3. Pedro Costa - Product Manager
   ... e mais 5 personas
```

### Processar Fila (Continuar de onde Parou)

```bash
node 05.5_generate_avatar_images_nanobana.js
```

O script automaticamente:
1. Carrega a fila existente
2. Verifica se mudou de dia (reseta contador)
3. Processa até 15 imagens respeitando rate limit de 2 minutos
4. Salva progresso após cada imagem
5. Para se atingir limite diário

### Processar com Limite Customizado (Mais Conservador)

```bash
node 05.5_generate_avatar_images_nanobana.js --maxDaily=10
```

Útil se você quiser ser mais conservador com a quota.

### Resetar Fila Completamente

```bash
node 05.5_generate_avatar_images_nanobana.js --reset
```

**⚠️ CUIDADO:** Isso apaga todo o progresso e você terá que criar a fila novamente.

## 📊 Limites e Rate Limiting

### Conta Google AI Free Tier

| Métrica | Limite |
|---------|--------|
| **Rate Limit** | 1 requisição a cada 120 segundos (2 minutos) |
| **Limite Diário** | 10-15 imagens por dia |
| **Reset Diário** | Meia-noite horário do Pacífico (04:00-05:00 AM Brasil) |

### Como o Script Respeita os Limites

1. **Rate Limit:** Aguarda 120 segundos entre cada requisição com countdown visual
2. **Limite Diário:** Para automaticamente ao atingir 15 imagens
3. **Reset Automático:** Detecta mudança de dia e zera contador
4. **Quota Exceeded:** Se receber erro 429, para imediatamente e salva progresso

## 🗂️ Estrutura da Fila (nanobana_queue.json)

```json
{
  "empresaId": "58234085-d661-4171-8664-4149b5559a3c",
  "personas": [
    {
      "id": "uuid-persona-1",
      "full_name": "João Silva",
      "role": "Desenvolvedor Senior",
      "nacionalidade": "brasileiro",
      "genero": "masculino",
      "status": "completed",
      "attempts": 1,
      "last_attempt": "2025-12-02T16:30:00.000Z",
      "image_url": "https://xxx.supabase.co/storage/v1/object/public/persona-avatars/uuid.png",
      "error_message": null
    },
    {
      "id": "uuid-persona-2",
      "full_name": "Maria Santos",
      "role": "Designer UX",
      "status": "pending",
      "attempts": 0,
      "last_attempt": null,
      "image_url": null,
      "error_message": null
    }
  ],
  "stats": {
    "total": 21,
    "pending": 8,
    "completed": 13,
    "failed": 0,
    "daily_count": 13,
    "last_reset_date": "2025-12-02"
  },
  "created_at": "2025-12-02T15:30:00.000Z",
  "updated_at": "2025-12-02T16:45:00.000Z"
}
```

## 📸 Onde as Imagens São Salvas

### 1. Backup Local
`AUTOMACAO/nanobana_images/{persona_id}.png`

### 2. Supabase Storage (Produção)
```
Bucket: persona-avatars
Path: /{persona_id}.png
URL: https://fzyokrvdyeczhfqlwxzb.supabase.co/storage/v1/object/public/persona-avatars/{persona_id}.png
```

A URL pública é salva em `personas.avatar_image_url`.

## 🔄 Workflow Multi-Dia

### Dia 1 (Segunda-feira)
```bash
node 05.5_generate_avatar_images_nanobana.js --empresaId=58234085-d661-4171-8664-4149b5559a3c
```
- Cria fila com 21 personas
- Processa 15 imagens (2h de execução)
- 6 pendentes restantes

### Dia 2 (Terça-feira)
```bash
node 05.5_generate_avatar_images_nanobana.js
```
- Detecta novo dia, reseta contador
- Processa as 6 pendentes restantes
- ✅ Todas as 21 imagens completas!

## 🎨 Qualidade das Imagens

O Nano Banana gera imagens **hiper-realistas** de nível profissional:

- 📐 Formato: PNG
- 🎯 Orientação: Retrato (headshot)
- 🖼️ Resolução: Alta (HD)
- 💼 Estilo: Foto corporativa profissional
- 🎨 Background: Neutro (cinza claro/azul suave)
- 💡 Iluminação: Studio lighting com sombras suaves
- 👁️ Expressão: Confiante e acessível
- 👔 Vestimenta: Profissional apropriada ao cargo

## 🐛 Troubleshooting

### Erro: "QUOTA_EXCEEDED"
**Causa:** Limite diário atingido  
**Solução:** Aguarde até o reset (04:00-05:00 AM Brasil) e execute novamente

### Erro: "Avatar não encontrado"
**Causa:** Persona não tem `avatar_url` preenchido  
**Solução:** Execute primeiro o Script 05 (`05_generate_avatares.js`)

### Erro: "Upload failed"
**Causa:** Bucket do Supabase não existe ou sem permissões  
**Solução:** Execute `add_avatar_image_columns.sql` no Supabase SQL Editor

### Fila Travada
**Causa:** Script foi interrompido no meio  
**Solução:** Execute novamente - ele retoma automaticamente de onde parou

### Muitas Falhas
Se uma persona falha 3 vezes, ela é marcada como `failed`. Para reprocessar:

```bash
# Abra nanobana_queue.json e mude o status da persona para "pending"
# Depois execute novamente
node 05.5_generate_avatar_images_nanobana.js
```

## 📊 Monitoramento

### Ver Progresso em Tempo Real
O script mostra:
- Contador de progresso (1/15, 2/15, etc.)
- Countdown visual durante rate limit
- Status de cada operação (prompt, geração, upload)
- Resumo final da sessão

### Verificar no Banco
```sql
SELECT 
  full_name,
  role,
  avatar_image_url,
  avatar_image_generated_at
FROM personas
WHERE empresa_id = '58234085-d661-4171-8664-4149b5559a3c'
  AND avatar_image_url IS NOT NULL
ORDER BY avatar_image_generated_at DESC;
```

## 🎯 Estimativas de Tempo

| Personas | Dias Necessários | Tempo Total |
|----------|------------------|-------------|
| 15 | 1 dia | ~2 horas |
| 30 | 2 dias | ~4 horas |
| 45 | 3 dias | ~6 horas |
| 100 | 7 dias | ~14 horas |

**Nota:** Cada imagem leva ~2 minutos (rate limit) + tempo de processamento (~30s).

## 💡 Dicas

1. **Execute no fim de tarde:** O script leva ~2h para 15 imagens. Comece às 15h para terminar antes das 17h.

2. **Monitore o --status:** Use `--status` frequentemente para acompanhar progresso sem iniciar processamento.

3. **Backup automático:** Mesmo com upload para Supabase, as imagens ficam salvas localmente em `nanobana_images/`.

4. **Seja conservador:** Use `--maxDaily=10` se quiser garantir que nunca vai atingir o limite.

5. **Multi-empresa:** Você pode ter filas diferentes rodando em dias diferentes para empresas diferentes.

## 🚀 Próximos Passos

Após gerar as imagens:

1. **Visualizar no Dashboard:**
   ```bash
   npm run dev
   # Acesse http://localhost:3001/personas
   ```

2. **Executar Scripts Seguintes:**
   ```bash
   node 06_analyze_tasks_for_automation.js --empresaId=58234085-d661-4171-8664-4149b5559a3c
   node 07_generate_n8n_workflows.js --empresaId=58234085-d661-4171-8664-4149b5559a3c
   # etc...
   ```

3. **Auditoria Final:**
   ```bash
   node 09_generate_auditoria.js --empresaId=58234085-d661-4171-8664-4149b5559a3c --full
   ```

## 📞 Suporte

Para problemas ou dúvidas, verifique:
- Logs do console (mostram erros detalhados)
- Arquivo `nanobana_queue.json` (estado atual)
- Supabase Dashboard > Storage > persona-avatars (imagens uploadadas)

---

**🍌 Powered by Gemini 2.5 Flash Image (Nano Banana)**  
*O modelo de IA mais realista para geração de rostos humanos do Google*
