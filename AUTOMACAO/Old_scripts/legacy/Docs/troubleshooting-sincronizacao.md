# 🔧 Guia de Troubleshooting - Sincronização VCM

## 🚨 Problema Resolvido: "Nomes Indefinidos" nas Personas

### 📋 Sintomas
- Personas aparecem no dashboard mas com "Nome não definido" 
- Contador de personas correto (ex: 21) mas dados incorretos
- Sincronização executa sem erros mas campos vazios

### 🔍 Diagnóstico
```bash
# 1. Investigar estrutura do banco origem
python debug_lifeway_structure.py

# 2. Verificar logs de sincronização  
tail -f sync_lifeway_personas.log

# 3. Verificar dados no VCM Central via Supabase Dashboard
```

### ✅ Solução
**Problema**: Mapeamento incorreto de campos entre RAG e VCM Central

**Causa**: Script assumia campos `nome_completo` e `cargo` mas banco usa `full_name` e `role`

**Correção**: 
```python
# ANTES (incorreto)
'full_name': rag_persona.get('nome_completo', rag_persona.get('name', 'Nome não definido')),
'role': rag_persona.get('cargo', rag_persona.get('role', 'Cargo não definido')),

# DEPOIS (correto)  
'full_name': rag_persona.get('full_name', 'Nome não definido'),
'role': rag_persona.get('role', 'Cargo não definido'),
```

## 🔄 Processo de Sincronização Corrigido

### Etapas
1. **Limpeza** - Remove personas incorretas existentes
2. **Investigação** - Debug da estrutura de dados  
3. **Mapeamento** - Campos corretos RAG → VCM Central
4. **Sincronização** - Inserção com dados corretos
5. **Validação** - Verificar no dashboard

### Logs de Debug Adicionados
```python
logger.info(f"🔄 Mapeando: {rag_persona.get('full_name', 'SEM_NOME')} -> {vcm_persona['full_name']}")
```

## 🛠️ Scripts de Troubleshooting

### 1. Debug Estrutura de Dados
```bash
python debug_lifeway_structure.py
```
- Mostra estrutura real do banco RAG
- Identifica campos disponíveis  
- Lista tipos de dados

### 2. Sincronização com Limpeza
```bash
python sync_lifeway_personas.py
```
- Remove dados incorretos existentes
- Reinsere com mapeamento correto
- Logs detalhados de cada etapa

### 3. Verificação Manual
```sql
-- No Supabase SQL Editor (VCM Central)
SELECT full_name, role, empresa_id 
FROM personas 
WHERE empresa_id = 'e3685f6c-8c6c-46f1-8a44-aaf7ffc11c9e'
ORDER BY full_name;
```

## 📊 Resultados Esperados

### Antes da Correção
```
❌ Nome: "Nome não definido"
❌ Cargo: "Cargo não definido"  
❌ Dados úteis: 0%
```

### Após Correção
```
✅ Nome: "VCM System Admin", "Alex Rowen", "Lia Rodrigues"...
✅ Cargo: "System Administrator", "CEO", "Immigration Attorney"...
✅ Dados úteis: 100%
```

## 🔮 Prevenção para Novas Empresas

### Estrutura Padrão (Unified Database)
Para novas empresas, usar sempre a estrutura padrão:
```sql
CREATE TABLE personas (
    id UUID PRIMARY KEY,
    persona_code VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,        -- ✅ Nome padrão
    role VARCHAR NOT NULL,             -- ✅ Cargo padrão
    specialty VARCHAR,
    department VARCHAR,
    email VARCHAR,
    whatsapp VARCHAR,
    empresa_id UUID NOT NULL,
    -- ... outros campos
);
```

### Validação Automática
```python
# Validar campos obrigatórios antes da sincronização
required_fields = ['full_name', 'role', 'empresa_id']
for field in required_fields:
    if not rag_persona.get(field):
        logger.error(f"❌ Campo obrigatório faltando: {field}")
        continue
```

## 🎯 Lições Aprendidas

1. **Sempre investigar estrutura** antes de assumir campos
2. **Logs detalhados** são essenciais para debug
3. **Limpeza antes de re-sincronização** evita duplicatas
4. **Validação de campos** previne dados incorretos
5. **Testes em ambiente controlado** antes de produção

## 🚀 Próximos Passos

1. **✅ LifewayUSA funcionando** - Personas com nomes corretos
2. **🔄 Automatizar validação** - Scripts de verificação
3. **🔄 Monitoramento** - Alerts para dados incorretos
4. **🔄 Documentação** - Padrões para novas empresas

---

**Este troubleshooting garante que futuras sincronizações sejam feitas corretamente e problemas similares sejam evitados.**