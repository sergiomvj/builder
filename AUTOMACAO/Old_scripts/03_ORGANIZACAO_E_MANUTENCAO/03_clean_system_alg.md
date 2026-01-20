# 🎯 ALGORITMO - Clean System

**Arquivo:** `03_clean_system.py`  
**Função:** Limpeza completa do sistema removendo arquivos desnecessários  
**Linhas de Código:** 198  
**Versão:** 1.0.0 (LIMPADOR DE SISTEMA ATIVO)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **LIMPADOR COMPLETO** do sistema que remove arquivos temporários, logs, outputs de teste e documentação desnecessária, mantendo apenas os arquivos essenciais para funcionamento do sistema em produção.

### 🎯 **OBJETIVO PRINCIPAL:**
Executar limpeza profunda do sistema VCM, removendo tudo que não é essencial para funcionamento, criando um ambiente limpo e otimizado com apenas os arquivos necessários para produção.

---

## 🏗️ **ARQUITETURA DE FUNÇÃO**

### **clean_virtual_company_generator()**
```python
def clean_virtual_company_generator():
    """Execute limpeza completa do sistema"""
```

**Responsabilidade:** Orquestrar limpeza completa removendo pastas, arquivos e criando documentação limpa final.

---

## 🔧 **FUNÇÕES FUNDAMENTAIS**

### 1️⃣ **clean_virtual_company_generator()**
**Algoritmo MASTER de limpeza:**
```
1. LOCALIZAÇÃO DO SISTEMA:
   base_path = Path("VIRTUAL_COMPANY_GENERATOR")
   
   VALIDAÇÃO:
   Se base_path não existe:
   - Log de erro
   - return False

2. DEFINIÇÃO DE ARQUIVOS ESSENCIAIS (proteção):
   essential_files = {
     "README.md",
     "core/create_project_template.py",
     "core/project_company_generator.py"
   }
   
   essential_paths = {base_path / file para file em essential_files}

3. REMOÇÃO DE PASTAS COMPLETAS:
   folders_to_remove = [
     "config",           # Configurações temporárias
     "logs",             # Logs de execução
     "output",           # Outputs de teste
     "templates",        # Templates antigos
     "core/__pycache__"  # Cache Python
   ]
   
   Para cada folder em folders_to_remove:
   - Se folder_path.exists():
     - shutil.rmtree(folder_path)
     - Log da remoção
     - removed_count++

4. REMOÇÃO DE ARQUIVOS DA RAIZ:
   root_files_to_remove = [
     "DEMONSTRACAO_EASY123.md",
     "DEMONSTRACAO_EASY123_CORRIGIDA.md",
     "generate_company.bat", 
     "GUIA_EASY123.md",
     "LOCALIZACAO_ARQUIVOS_EASY123.md",
     "ORGANIZACAO_POR_PROJETO.md",
     "SISTEMA_MASTER_PRONTO.md",
     "AUDITORIA_LIMPEZA.md"  # Remove a própria auditoria
   ]
   
   Para cada file em root_files_to_remove:
   - Se file_path.exists():
     - file_path.unlink()
     - Log da remoção
     - removed_count++

5. REMOÇÃO DE ARQUIVOS CORE DESNECESSÁRIOS:
   core_files_to_remove = [
     "migrate_existing.py",        # Script de migração antigo
     "setup_project_generator.py", # Setup antigo
     "virtual_company_generator.py" # Gerador antigo
   ]
   
   Para cada file em core_files_to_remove:
   - Se file_path.exists():
     - file_path.unlink()
     - Log da remoção
     - removed_count++

6. CRIAÇÃO DE README LIMPO:
   Se README.md não existe:
   - Criar README.md com estrutura limpa
   - Incluir instruções de uso simplificadas
   - Documentar arquivos restantes

7. AUDITORIA FINAL:
   - Listar todos os arquivos restantes
   - Contar total de arquivos
   - Validar se sistema está ultra-limpo (≤ 5 arquivos)
   - Log de estatísticas finais

8. RETORNO:
   return True  # Limpeza executada com sucesso
```

**Entrada:** Nenhuma (hardcoded path)  
**Saída:** Sistema completamente limpo  
**Algoritmo Crítico:** Limpeza segura com proteção de arquivos essenciais  

### 2️⃣ **main()**
**Algoritmo de confirmação e execução:**
```
1. AVISO DE SEGURANÇA:
   - "🚨 ATENÇÃO: Esta operação irá DELETAR permanentemente arquivos!"
   - Listar arquivos que serão mantidos
   - Mostrar arquivos essenciais protegidos

2. CONFIRMAÇÃO EXPLÍCITA:
   response = input("Tem certeza? (digite 'SIM' para confirmar): ")
   
   VALIDAÇÃO:
   Se response.upper() == 'SIM':
   - Executar clean_virtual_company_generator()
   Senão:
   - Log "❌ Operação cancelada."
   - Terminar sem executar

3. PROTEÇÃO CONTRA EXECUÇÃO ACIDENTAL:
   - Requer input exato 'SIM' (case insensitive)
   - Qualquer outra resposta cancela operação
   - Aviso claro sobre natureza destrutiva
```

**Entrada:** Input do usuário (confirmação)  
**Saída:** Execução ou cancelamento da limpeza  
**Funcionalidade Crítica:** Proteção contra deleção acidental  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Arquivos Essenciais (Protegidos):**
```python
essential_files = {
    "README.md",                      # Documentação principal
    "core/create_project_template.py", # Criador de template
    "core/project_company_generator.py" # Gerador de empresa
}
```

### **Pastas para Remoção Completa:**
```python
folders_to_remove = [
    "config",           # Configurações temporárias/teste
    "logs",             # Logs de execução históricos
    "output",           # Outputs de desenvolvimento/teste
    "templates",        # Templates antigos/experimentais
    "core/__pycache__"  # Cache Python gerado
]
```

### **Arquivos da Raiz para Remoção:**
```python
root_files_to_remove = [
    "DEMONSTRACAO_EASY123.md",          # Documentação de demo
    "DEMONSTRACAO_EASY123_CORRIGIDA.md", # Correções de demo
    "generate_company.bat",             # Script batch antigo
    "GUIA_EASY123.md",                 # Guia de demo
    "LOCALIZACAO_ARQUIVOS_EASY123.md", # Localização de demo
    "ORGANIZACAO_POR_PROJETO.md",      # Documentação organizacional
    "SISTEMA_MASTER_PRONTO.md",        # Status do sistema
    "AUDITORIA_LIMPEZA.md"             # Auto-remoção da auditoria
]
```

### **Arquivos Core para Remoção:**
```python
core_files_to_remove = [
    "migrate_existing.py",        # Script de migração legacy
    "setup_project_generator.py", # Setup antigo/obsoleto
    "virtual_company_generator.py" # Gerador antigo/substituído
]
```

### **Estrutura Final Esperada:**
```
VIRTUAL_COMPANY_GENERATOR/
├── README.md                      # Documentação limpa
└── core/
    ├── create_project_template.py # Template creator
    └── project_company_generator.py # Company generator
```

### **README Limpo Auto-Gerado:**
```markdown
# Virtual Company Generator

Sistema para criar empresas virtuais com 16 personas organizacionais dentro de projetos específicos.

## 🚀 Como Usar
### 1. Criar Template de Projeto
### 2. Gerar Empresa no Projeto  
### 3. Resultado

## 📁 Estrutura
## ✨ Características
- ✅ Empresa criada DENTRO do projeto
- ✅ 16 personas organizacionais
- ✅ Sistema autocontido
- ✅ Sem dependências externas
- ✅ Múltiplos setores suportados
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Limpeza Inteligente:**
- **Proteção de arquivos essenciais** através de whitelist
- **Remoção segura** com tratamento de exceções
- **Confirmação obrigatória** para evitar execução acidental
- **Auditoria final** para validar resultado

### 🌍 **Remoção Abrangente:**
- **Pastas completas** removidas com shutil.rmtree()
- **Arquivos individuais** removidos com unlink()
- **Cache Python** limpo automaticamente
- **Documentação obsoleta** removida

### 📝 **Criação de Documentação Limpa:**
- **README.md** auto-gerado se não existir
- **Instruções de uso** simplificadas
- **Estrutura final** documentada
- **Características do sistema** listadas

### 🔧 **Auditoria e Validação:**
- **Contagem de itens removidos** durante execução
- **Lista de arquivos restantes** pós-limpeza
- **Validação de limpeza** (≤ 5 arquivos = ultra-limpo)
- **Estatísticas finais** para confirmação

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os, shutil
from pathlib import Path
```

**Path Hardcoded:**
```python
base_path = Path("C:/Users/Sergio Castro/Documents/Projetos/1NewTools/VIRTUAL_COMPANY_GENERATOR")
```

**Operações de Sistema:**
- **shutil.rmtree()** para remoção de diretórios completos
- **Path.unlink()** para remoção de arquivos individuais
- **os.walk()** para auditoria final
- **Tratamento de exceções** em todas as operações

---

## 🎯 **STATUS NO SISTEMA**

### **Funcionalidade Ativa:**
✅ Limpador de sistema principal  
✅ Proteção de arquivos essenciais  
✅ Confirmação obrigatória de segurança  
✅ Auditoria completa pós-limpeza  

### **Uso em Produção:**
✅ Preparação de sistema para produção  
✅ Remoção de arquivos de desenvolvimento  
✅ Otimização de espaço e organização  
✅ Criação de ambiente limpo  

---

## 🎉 **RESULTADO FINAL**

O algoritmo produz **SISTEMA ULTRA-LIMPO** que:

✅ **Remove todo conteúdo desnecessário** (logs, outputs, cache)  
✅ **Preserva arquivos essenciais** protegidos  
✅ **Cria documentação limpa** automaticamente  
✅ **Valida resultado final** com auditoria  
✅ **Protege contra execução acidental** com confirmação  
✅ **Otimiza sistema** para ambiente de produção  

**Sistema pronto para:** ambiente de produção limpo e otimizado.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Clean System v1.0.0 (ATIVA)*  
*📊 Complexidade: 198 linhas, limpeza segura, proteção de arquivos*