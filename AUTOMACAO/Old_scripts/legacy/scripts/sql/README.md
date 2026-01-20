# Scripts SQL para Manutenção do VCM

Este diretório contém scripts SQL essenciais para manutenção do sistema VCM.

## 📁 Scripts Disponíveis

### 🔧 Manutenção de Empresas
- **`template-exclusao-empresa.sql`**: Template padrão para exclusão segura de empresas
- **`fix-cascade-final.sql`**: Script para resolução de conflitos de trigger durante exclusão
- **`debug-triggers-final.sql`**: Diagnóstico de triggers problemáticos

### 📊 Schema e Estrutura
- **`schema_atual.sql`**: Schema completo atual do banco de dados

## 🚀 Como Usar

### Para Excluir uma Empresa:
1. Copie o conteúdo de `template-exclusao-empresa.sql`
2. Substitua `EMPRESA_ID_AQUI` pelo ID real da empresa
3. Execute no Supabase SQL Editor

### Para Resolver Conflitos de Trigger:
1. Execute `fix-cascade-final.sql` se houver erro de trigger de auditoria
2. Use `debug-triggers-final.sql` para investigar problemas específicos

## ⚠️ Importante
- Sempre faça backup antes de executar scripts de exclusão
- Execute em ambiente de desenvolvimento primeiro
- Verifique os IDs antes da execução

## 📝 Histórico
- **2025-11-17**: Criação dos scripts de manutenção
- **2025-11-17**: Resolução do conflito de trigger audit_table_changes()