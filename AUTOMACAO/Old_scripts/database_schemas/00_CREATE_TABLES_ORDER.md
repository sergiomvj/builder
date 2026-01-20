# 🚀 ORDEM CORRETA DE CRIAÇÃO DAS TABELAS

**⚠️ IMPORTANTE:** Execute os SQL nesta ordem EXATA para evitar erros de dependência.

---

## 📋 Ordem de Execução no Supabase Dashboard

### 1️⃣ **PRIMEIRO:** personas_workflows.sql
```
✅ Esta tabela NÃO depende de automation_opportunities
✅ Pode ser criada primeiro sem problemas
```

**Ação:**
1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql/new
2. Copie TODO o conteúdo de `personas_workflows.sql`
3. Cole no editor e clique **Run**

---

### 2️⃣ **DEPOIS:** automation_opportunities.sql  
```
✅ Referencia personas_workflows via workflow_id
✅ Precisa que personas_workflows já exista
```

**Ação:**
1. Nova query no mesmo Dashboard
2. Copie TODO o conteúdo de `automation_opportunities.sql`
3. Cole no editor e clique **Run**

---

### 3️⃣ **POR ÚLTIMO:** Adicionar Foreign Key (opcional)

Se quiser adicionar constraint de foreign key entre as tabelas:

```sql
-- Adicionar FK de automation_opportunities → personas_workflows
ALTER TABLE automation_opportunities
ADD CONSTRAINT fk_automation_opportunities_workflow
FOREIGN KEY (workflow_id) 
REFERENCES personas_workflows(id) 
ON DELETE SET NULL;
```

---

## ✅ Verificação Pós-Instalação

Execute no terminal:
```bash
cd AUTOMACAO
node check_tables.cjs
```

Deve retornar:
```
✅ SISTEMA PRONTO!
Ambas tabelas estao criadas e acessiveis.
```

---

## 🐛 Troubleshooting

### Erro: "relation personas_workflows does not exist"
**Causa:** Você executou `automation_opportunities.sql` ANTES de `personas_workflows.sql`

**Solução:**
1. Execute `personas_workflows.sql` primeiro
2. Depois execute `automation_opportunities.sql`

### Erro: "schema cache"
**Causa:** Tabela existe mas precisa de refresh

**Solução:**
Execute uma query simples para forçar cache refresh:
```sql
SELECT COUNT(*) FROM personas_workflows;
SELECT COUNT(*) FROM automation_opportunities;
```

---

**Data:** 28/11/2025  
**Autor:** VCM System
