# 🎯 ALGORITMO - Reorganize Structure

**Arquivo:** `01_reorganize_structure.py`  
**Função:** Reorganização completa da estrutura de pastas do sistema  
**Linhas de Código:** 286  
**Versão:** 1.0.0 (ORGANIZADOR ESTRUTURAL ATIVO)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **REORGANIZADOR ESTRUTURAL** do sistema VCM que transforma a estrutura de arquivos desorganizada em uma hierarquia otimizada, organizando personas por scripts sequenciais e criando estrutura padronizada para fácil navegação e manutenção.

### 🎯 **OBJETIVO PRINCIPAL:**
Reorganizar completamente a estrutura de pastas do sistema, movendo workflows e TaskTodo para dentro das pastas de personas, renomeando diretórios para sequência lógica, e criando estrutura otimizada para os Scripts 1-5.

---

## 🏗️ **ARQUITETURA DE FUNÇÃO**

### **reorganize_structure()**
```python
def reorganize_structure():
    """Reorganiza toda a estrutura de pastas"""
```

**Responsabilidade:** Orquestrar reorganização completa do sistema, desde renomeação de diretórios até movimentação de arquivos específicos de personas.

---

## 🔧 **FUNÇÕES FUNDAMENTAIS**

### 1️⃣ **reorganize_structure()**
**Algoritmo MASTER de reorganização:**
```
1. DEFINIÇÃO DE MAPEAMENTO DE RENOMEAÇÃO:
   rename_mappings = {
     "01_DOCUMENTACAO" → "01_DOCUMENTACAO_GERAL",
     "02_SCRIPTS" → "02_SCRIPTS_AUTOMACAO",
     "03_N8N_WORKFLOWS" → "03_WORKFLOWS_LEGADO",
     "04_PERSONAS_COMPLETAS" → "04_PERSONAS_SCRIPTS_1_2_3",
     "05_WORKFLOWS_N8N" → "TEMP_WORKFLOWS_N8N",  # Temporário
     "06_TEMPLATES" → "05_TEMPLATES_SISTEMA",
     "07_RAG_KNOWLEDGE_BASE" → "06_RAG_KNOWLEDGE_BASE",
     "08_EMAIL_TEMPLATES" → "07_EMAIL_TEMPLATES",
     "09_DATABASE_SCHEMAS" → "08_DATABASE_SCHEMAS",
     "10_MONITORING" → "09_MONITORING_LOGS"
   }

2. EXECUÇÃO DE RENOMEAÇÃO SEQUENCIAL:
   Para cada (old_name, new_name) em rename_mappings:
   - Verificar se old_path existe e new_path não existe
   - old_path.rename(new_path)
   - Log da operação

3. REORGANIZAÇÃO DE PERSONAS:
   personas_dir = "04_PERSONAS_SCRIPTS_1_2_3"
   Para cada categoria_dir em personas_dir:
   - Para cada persona_dir em categoria_dir:
     - reorganize_persona_folder(persona_dir, categoria)

4. MOVIMENTAÇÃO DE ARQUIVOS ESPECIALIZADOS:
   - move_workflows_to_personas(base_dir)
   - move_tasktodo_to_personas(base_dir)

5. ORGANIZAÇÃO DE TEMPLATES:
   - organize_templates_folder(base_dir)

6. LIMPEZA FINAL:
   - Remover pasta TEMP_WORKFLOWS_N8N
   - print_final_structure(base_dir)
```

**Entrada:** Nenhuma (hardcoded path)  
**Saída:** Estrutura completamente reorganizada  
**Algoritmo Crítico:** Reorganização sem perda de dados  

### 2️⃣ **reorganize_persona_folder(persona_dir, categoria)**
**Algoritmo de reorganização individual de persona:**
```
1. DEFINIÇÃO DE ESTRUTURA SEQUENCIAL:
   script_folders = {
     "script1_competencias": "competencias",      # Mapeamento para renomeação
     "script2_tech_specs": "tech_specs",
     "script3_rag": "rag",
     "script4_tasktodo": None,                    # Será criada depois
     "script5_workflows_n8n": None               # Será criada depois
   }

2. RENOMEAÇÃO DE PASTAS EXISTENTES:
   Para cada (new_folder, old_folder) em script_folders:
   - Se old_folder existe E new_folder não existe:
     - old_path.rename(new_path)
     - Log: "old_folder → new_folder"

3. RESULTADO:
   persona_dir/
   ├── persona_bio.md
   ├── script1_competencias/     # Renomeado de competencias/
   ├── script2_tech_specs/       # Renomeado de tech_specs/
   ├── script3_rag/              # Renomeado de rag/
   ├── script4_tasktodo/         # Criado por move_tasktodo_to_personas()
   └── script5_workflows_n8n/    # Criado por move_workflows_to_personas()
```

**Entrada:** Path da persona + nome da categoria  
**Saída:** Estrutura sequencial reorganizada  
**Funcionalidade Crítica:** Manter dados + criar sequência lógica  

### 3️⃣ **move_workflows_to_personas(base_dir)**
**Algoritmo de movimentação de workflows:**
```
1. LOCALIZAÇÃO DE ARQUIVOS:
   workflows_dir = "TEMP_WORKFLOWS_N8N"
   personas_dir = "04_PERSONAS_SCRIPTS_1_2_3"

2. MAPEAMENTO DE WORKFLOWS PARA PERSONAS:
   Para cada workflow_file em workflows_dir.glob("workflow_*.json"):
   - persona_name = extrair do nome do arquivo (workflow_{persona_name}.json)
   - persona_path = find_persona_path(personas_dir, persona_name)

3. CRIAÇÃO DE PASTA SCRIPT5:
   Se persona_path encontrada:
   - script5_dir = persona_path / "script5_workflows_n8n"
   - script5_dir.mkdir(exist_ok=True)

4. MOVIMENTAÇÃO DE ARQUIVOS RELACIONADOS:
   files_to_move = [
     f"workflow_{persona_name}.json",      # Workflow principal
     f"validation_{persona_name}.json",    # Validação
     f"README_{persona_name}.md"           # Documentação
   ]
   
   Para cada arquivo:
   - Se existe: shutil.move(src, dest)
   - Log da movimentação

5. RESULTADO:
   persona_dir/script5_workflows_n8n/
   ├── workflow_{persona_name}.json
   ├── validation_{persona_name}.json
   └── README_{persona_name}.md
```

**Entrada:** Base directory  
**Saída:** Workflows organizados por persona  
**Algoritmo Crítico:** Mapeamento inteligente workflow → persona  

### 4️⃣ **move_tasktodo_to_personas(base_dir)**
**Algoritmo de movimentação de TaskTodo:**
```
1. LOCALIZAÇÃO FLEXÍVEL:
   tasktodo_dir = base_dir / "tasktodo"
   Se não existe: tasktodo_dir = base_dir / "05_TASKTODO"
   
2. NAVEGAÇÃO HIERÁRQUICA:
   Para cada categoria_dir em tasktodo_dir:
   - Para cada persona_tasktodo_dir em categoria_dir:
     - persona_name = extrair nome da pasta
     - persona_path = find_persona_path(personas_dir, persona_name)

3. CRIAÇÃO DE PASTA SCRIPT4:
   Se persona_path encontrada:
   - script4_dir = persona_path / "script4_tasktodo"
   - script4_dir.mkdir(exist_ok=True)

4. MOVIMENTAÇÃO DE ARQUIVOS:
   Para cada file_path em persona_tasktodo_dir:
   - Se é arquivo: shutil.move(src, dest)
   - Log da movimentação

5. LIMPEZA:
   - shutil.rmtree(tasktodo_dir) # Remover pasta original vazia

6. RESULTADO:
   persona_dir/script4_tasktodo/
   ├── tasktodo_analysis.json
   ├── task_breakdown.md
   └── workflow_mapping.json
```

**Entrada:** Base directory  
**Saída:** TaskTodo organizado por persona  
**Funcionalidade Crítica:** Preservar hierarquia categoria/persona  

### 5️⃣ **find_persona_path(personas_dir, persona_name)**
**Algoritmo de busca inteligente de persona:**
```
1. NAVEGAÇÃO HIERÁRQUICA:
   Para cada categoria_dir em personas_dir:
   - Para cada persona_dir em categoria_dir:
     - Extrair nome da pasta

2. NORMALIZAÇÃO E COMPARAÇÃO:
   - nome_normalizado = normalize_name(persona_dir.name)
   - target_normalizado = normalize_name(persona_name)
   - Se nomes combinam: return persona_dir

3. NORMALIZE_NAME():
   - Converter para lowercase
   - Substituir "_" por espaço
   - Substituir "-" por espaço
   - strip() espaços extras

4. RESULTADO:
   - Path da persona se encontrada
   - None se não encontrada
```

**Entrada:** Personas directory + nome da persona  
**Saída:** Path da persona ou None  
**Algoritmo Crítico:** Busca tolerante a variações de nomenclatura  

### 6️⃣ **organize_templates_folder(base_dir)**
**Algoritmo de organização de templates:**
```
1. DEFINIÇÃO DE ESTRUTURA:
   template_structure = {
     "biografia_templates": "Templates para biografias de personas",
     "competencias_templates": "Templates do Script 1 - Competências",
     "tech_specs_templates": "Templates do Script 2 - Tech Specs",
     "rag_templates": "Templates do Script 3 - RAG", 
     "tasktodo_templates": "Templates do Script 4 - TaskTodo",
     "workflow_templates": "Templates do Script 5 - Workflows N8N",
     "email_templates": "Templates de email",
     "documento_templates": "Templates de documentos"
   }

2. CRIAÇÃO DE ESTRUTURA:
   Para cada (folder_name, description) em template_structure:
   - folder_path.mkdir(exist_ok=True)
   - Criar README.md automático com description

3. CONTEÚDO DO README:
   # {folder_name}
   ## Descrição: {description}
   ## Como usar: [instruções padrão]
   ## Templates disponíveis: [placeholder]

4. RESULTADO:
   05_TEMPLATES_SISTEMA/
   ├── biografia_templates/README.md
   ├── competencias_templates/README.md
   ├── tech_specs_templates/README.md
   ├── rag_templates/README.md
   ├── tasktodo_templates/README.md
   ├── workflow_templates/README.md
   ├── email_templates/README.md
   └── documento_templates/README.md
```

**Entrada:** Base directory  
**Saída:** Templates organizados com documentação  
**Funcionalidade Crítica:** Estrutura padronizada + documentação automática  

### 7️⃣ **print_final_structure(base_dir)**
**Algoritmo de exibição da estrutura final:**
```
1. CABEÇALHO ESTRUTURADO:
   - Separadores visuais
   - Título "ESTRUTURA FINAL ORGANIZADA"

2. ASCII TREE STRUCTURE:
   📂 carntrack_carnivore_diet_system/
   ├── 📂 01_DOCUMENTACAO_GERAL/
   ├── 📂 02_SCRIPTS_AUTOMACAO/
   ├── 📂 03_WORKFLOWS_LEGADO/
   ├── 📂 04_PERSONAS_SCRIPTS_1_2_3/
   │   ├── 📂 assistentes/
   │   │   ├── 📂 Persona_Name/
   │   │   │   ├── 📄 persona_bio.md
   │   │   │   ├── 📂 script1_competencias/
   │   │   │   ├── 📂 script2_tech_specs/
   │   │   │   ├── 📂 script3_rag/
   │   │   │   ├── 📂 script4_tasktodo/
   │   │   │   └── 📂 script5_workflows_n8n/
   │   ├── 📂 executivos/
   │   ├── 📂 especialistas/
   │   └── 📂 suporte/
   ├── 📂 05_TEMPLATES_SISTEMA/...
   └── 📂 06-09_[outras pastas]/

3. VANTAGENS DA ESTRUTURA:
   ✅ Pastas numeradas sequencialmente
   ✅ Tudo de cada persona centralizado
   ✅ Scripts organizados por sequência
   ✅ Templates categorizados
   ✅ Navegação otimizada
```

**Entrada:** Base directory  
**Saída:** Exibição visual da estrutura  
**Funcionalidade Crítica:** Validação visual da reorganização  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Mapeamento de Renomeação:**
```python
rename_mappings = {
    "01_DOCUMENTACAO": "01_DOCUMENTACAO_GERAL",
    "02_SCRIPTS": "02_SCRIPTS_AUTOMACAO",
    "03_N8N_WORKFLOWS": "03_WORKFLOWS_LEGADO",
    "04_PERSONAS_COMPLETAS": "04_PERSONAS_SCRIPTS_1_2_3",
    "05_WORKFLOWS_N8N": "TEMP_WORKFLOWS_N8N",
    "06_TEMPLATES": "05_TEMPLATES_SISTEMA",
    "07_RAG_KNOWLEDGE_BASE": "06_RAG_KNOWLEDGE_BASE",
    "08_EMAIL_TEMPLATES": "07_EMAIL_TEMPLATES",
    "09_DATABASE_SCHEMAS": "08_DATABASE_SCHEMAS",
    "10_MONITORING": "09_MONITORING_LOGS"
}
```

### **Estrutura Final Padronizada:**
```
sistema/
├── 01_DOCUMENTACAO_GERAL/
├── 02_SCRIPTS_AUTOMACAO/
├── 03_WORKFLOWS_LEGADO/
├── 04_PERSONAS_SCRIPTS_1_2_3/
│   └── {categoria}/
│       └── {persona_name}/
│           ├── {persona_name}_bio.md
│           ├── script1_competencias/
│           ├── script2_tech_specs/
│           ├── script3_rag/
│           ├── script4_tasktodo/
│           └── script5_workflows_n8n/
├── 05_TEMPLATES_SISTEMA/
├── 06_RAG_KNOWLEDGE_BASE/
├── 07_EMAIL_TEMPLATES/
├── 08_DATABASE_SCHEMAS/
└── 09_MONITORING_LOGS/
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Reorganização Inteligente:**
- **Preservação de dados** durante movimentação
- **Mapeamento automático** workflow → persona
- **Busca tolerante** a variações de nomenclatura
- **Estrutura sequencial** para scripts 1-5

### 🌍 **Organização Otimizada:**
- **Numeração sequencial** de diretórios
- **Centralização por persona** (tudo em uma pasta)
- **Templates categorizados** com documentação automática
- **Estrutura ASCII visual** para validação

### 📝 **Movimentação Segura:**
- **Verificação de existência** antes de operações
- **Logs detalhados** de todas as movimentações
- **Limpeza automática** de pastas temporárias
- **Preservação de hierarquias** importantes

### 🔧 **Compatibilidade Mantida:**
- **Scripts 1-5 continuam funcionando** com nova estrutura
- **Paths relativos preservados** dentro de personas
- **Convenções de nomenclatura** mantidas
- **Documentação automática** gerada

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os, shutil
from pathlib import Path
import json
```

**Path Hardcoded:**
```python
base_dir = Path(r"C:\Users\Sergio Castro\Documents\Projetos\1NewTools\Carntrack\carntrack_carnivore_diet_system")
```

**Operações de Sistema:**
- **Path.rename()** para renomeação
- **shutil.move()** para movimentação de arquivos
- **shutil.rmtree()** para remoção de diretórios
- **Path.mkdir()** para criação de pastas

---

## 🎯 **STATUS NO SISTEMA**

### **Funcionalidade Ativa:**
✅ Reorganizador estrutural principal  
✅ Movimentação segura de arquivos  
✅ Organização automática de templates  
✅ Estrutura otimizada para scripts 1-5  

### **Uso em Produção:**
✅ Reorganização de sistemas desorganizados  
✅ Migração de estruturas antigas  
✅ Padronização de diretórios  
✅ Otimização para manutenção  

---

## 🎉 **RESULTADO FINAL**

O algoritmo produz **ESTRUTURA OTIMIZADA** que:

✅ **Organiza sequencialmente** todos os diretórios  
✅ **Centraliza por persona** todos os arquivos relacionados  
✅ **Preserve dados** durante toda a reorganização  
✅ **Otimiza navegação** com estrutura lógica  
✅ **Documenta automaticamente** a nova estrutura  
✅ **Mantém compatibilidade** com scripts existentes  

**Sistema pronto para:** reorganização completa de estruturas desorganizadas do VCM.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Reorganize Structure v1.0.0 (ATIVA)*  
*📊 Complexidade: 286 linhas, reorganização completa, movimentação segura*