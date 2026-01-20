# 🔄 RECOMEÇO TOTAL - VCM

**Data:** 30 de Novembro de 2025  
**Decisão:** Parar loops, começar do ZERO de forma organizada

## 📋 Checklist para Recomeço

### Etapa 1: Entender o que EXISTE
- [ ] Descobrir schema REAL da tabela `empresas` no Supabase
- [ ] Descobrir schema REAL da tabela `personas` no Supabase
- [ ] Listar todas as colunas, tipos, constraints
- [ ] Documentar campos obrigatórios vs opcionais

### Etapa 2: Limpar Inconsistências
- [ ] Deletar todas as empresas antigas
- [ ] Deletar todas as personas antigas
- [ ] Verificar tabelas vazias

### Etapa 3: Criar Estrutura Mínima Válida
- [ ] Criar 1 empresa ARVA com campos MÍNIMOS necessários
- [ ] Testar que a empresa foi criada corretamente
- [ ] Anotar o ID da empresa para uso posterior

### Etapa 4: Criar Personas Básicas
- [ ] Criar 15 personas com campos MÍNIMOS necessários
- [ ] Usar apenas campos que EXISTEM na tabela
- [ ] Validar que todas foram criadas

### Etapa 5: Executar Pipeline de Automação
- [ ] Script 00: Avatares
- [ ] Script 01: Biografias
- [ ] Script 01.5: Atribuições
- [ ] Script 02: Competências
- [ ] Script 02.5: Análise de Automação
- [ ] Script 03: Workflows N8N

## 🎯 Objetivo
Ter 1 empresa funcionando com 15 personas completamente processadas pelos scripts LLM.

## ❌ O que NÃO fazer
- Assumir estrutura de campos
- Usar dados antigos/cached
- Executar scripts sem validar env vars
- Continuar se houver erro

## 📝 Próximos Passos Imediatos
1. Executar script de descoberta de schema
2. Documentar campos reais
3. Criar script de criação com campos corretos
