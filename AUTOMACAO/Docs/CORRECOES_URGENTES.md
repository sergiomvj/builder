# 🚨 CORREÇÕES URGENTES NECESSÁRIAS

## Problemas Identificados

### 1. ❌ IDIOMAS
**Problema:** Todas personas têm apenas `['Português']`
**Esperado:** 5 idiomas por persona conforme configuração da empresa
**Local atual:** `personas.idiomas` (array vazio ou só português)
**Solução:** Atualizar script de criação de personas para definir idiomas

### 2. ❌ TABELAS SEPARADAS VAZIAS
**Problema:** `personas_atribuicoes` e `personas_biografias` com 0 registros
**Dados reais estão em:** `personas.ia_config`
- Atribuições → `ia_config.atribuicoes_especificas`
- Biografias → `ia_config.biografia_estruturada`

**Decisão necessária:**
- Opção A: Manter em `ia_config` (mais simples, já funciona)
- Opção B: Migrar para tabelas separadas (normalizado, mas requer refatoração)

### 3. ❌ COMPETÊNCIAS
**Problema:** Você disse que não há registros
**Realidade:** Estão em `personas.ia_config.tarefas_metas`
**Tabela separada:** `competencias` existe mas está vazia

## Ações Imediatas

### CORREÇÃO 1: Adicionar idiomas às personas

```javascript
// Script para atualizar idiomas de todas personas
const idiomas = [
  'Português (Nativo)',
  'Inglês (Fluente)',
  'Espanhol (Intermediário)',
  'Francês (Básico)',
  'Mandarim (Básico)'
];

await supabase
  .from('personas')
  .update({ idiomas: idiomas })
  .eq('empresa_id', EMPRESA_ID);
```

### CORREÇÃO 2: Decisão sobre estrutura

**Se manter em ia_config (RECOMENDADO):**
- ✅ Já funciona
- ✅ Mais rápido
- ✅ Menos tabelas
- ❌ Menos normalizado

**Se migrar para tabelas separadas:**
- ✅ Mais normalizado
- ✅ Queries mais eficientes
- ❌ Requer refatoração de 3+ scripts
- ❌ Mais complexo

## Status Real dos Dados

| Dado | Local Atual | Status | Registros |
|------|-------------|--------|-----------|
| Biografias | `ia_config.biografia_estruturada` | ✅ Salvos | 25/25 |
| Atribuições | `ia_config.atribuicoes_especificas` | ✅ Salvos | 25/25 |
| Competências | `ia_config.tarefas_metas` | ✅ Salvos | 25/25 |
| Idiomas | `personas.idiomas` | ❌ Só PT | 25/25 |
| Tabela `personas_atribuicoes` | - | ❌ Vazia | 0 |
| Tabela `personas_biografias` | - | ❌ Vazia | 0 |
| Tabela `competencias` | - | ❌ Vazia | 0 |

## Próximos Passos

1. **URGENTE**: Corrigir idiomas (script abaixo)
2. **DECIDIR**: Manter ia_config ou migrar para tabelas?
3. **DOCUMENTAR**: Onde cada dado está salvo
