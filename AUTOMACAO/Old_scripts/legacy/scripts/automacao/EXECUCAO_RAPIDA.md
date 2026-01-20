# 🚀 EXECUÇÃO RÁPIDA - CASCATA VCM AUTOMAÇÃO

## ⚡ ORDEM OBRIGATÓRIA DE EXECUÇÃO

Execute **SEMPRE** nesta sequência para a empresa ARVA Tech Solutions:

```bash
# 1️⃣ BIOGRAFIAS (Base de tudo - PRIMEIRO)
node 01_generate_biografias.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 2️⃣ COMPETÊNCIAS (Baseado nas biografias)  
node 02_generate_competencias.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 3️⃣ AVATARES (Baseado no perfil completo)
node 03_generate_avatares.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 4️⃣ ESPECIFICAÇÕES TÉCNICAS
node 04_generate_tech_specs.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 5️⃣ BASE DE CONHECIMENTO RAG
node 05_generate_rag_knowledge.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17

# 6️⃣ ANÁLISE DE WORKFLOWS (Final)
node 06_generate_fluxos_sdr.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17
```

## 🎯 LÓGICA DA SEQUÊNCIA

1. **Biografias** → Perfil base das personas
2. **Competências** → Skills baseadas na biografia  
3. **Avatares** → Visual baseado no perfil completo
4. **Tech Specs** → Especificações técnicas da empresa
5. **Knowledge Base** → Consolida todos os dados
6. **Workflows** → Análise final de processos

## ⏱️ TIMING RECOMENDADO

- **Pausa entre scripts**: 30 segundos
- **Pausa entre personas**: 2 segundos (automática)
- **Tempo total estimado**: 20-30 minutos

## 🔍 VERIFICAÇÃO DE STATUS

Após cada script, verificar em:
- `empresas.scripts_status` no Supabase
- Console logs para erros
- Dashboard PersonaDetail para visualizar dados

## 🚨 EM CASO DE ERRO

1. Verificar `.env` e chaves de API
2. Aguardar rate limits (60 req/min Gemini)
3. Re-executar script individual que falhou
4. Scripts são idempotentes (podem ser re-executados)

## ✅ RESULTADO FINAL

Sistema VCM completo com:
- Biografias estruturadas
- Competências mapeadas  
- Avatares visuais
- Especificações técnicas
- Base de conhecimento RAG
- Fluxos de trabalho mapeados