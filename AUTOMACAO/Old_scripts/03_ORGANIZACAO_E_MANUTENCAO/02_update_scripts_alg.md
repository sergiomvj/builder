# 🎯 ALGORITMO - Update Scripts

**Arquivo:** `02_update_scripts.py`  
**Função:** Atualização automática dos scripts para nova estrutura reorganizada  
**Linhas de Código:** 166  
**Versão:** 1.0.0 (ATUALIZADOR DE SCRIPTS ATIVO)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **ATUALIZADOR AUTOMÁTICO** que modifica os Scripts 4 e 5 para funcionarem com a nova estrutura reorganizada, alterando paths, lógica de descoberta de personas e locais de salvamento para compatibilidade com a estrutura otimizada.

### 🎯 **OBJETIVO PRINCIPAL:**
Atualizar automaticamente os Scripts 4 (TaskTodo Analysis) e 5 (N8N Workflows) para funcionarem com a nova estrutura reorganizada, onde tudo de cada persona fica centralizado em sua própria pasta com subpastas script1-5.

---

## 🏗️ **ARQUITETURA DE FUNÇÃO**

### **update_scripts_for_new_structure()**
```python
def update_scripts_for_new_structure():
    """Atualiza scripts para funcionar com nova estrutura"""
```

**Responsabilidade:** Orquestrar atualização completa dos Scripts 4 e 5, aplicando todas as modificações necessárias para compatibilidade com estrutura reorganizada.

---

## 🔧 **FUNÇÕES FUNDAMENTAIS**

### 1️⃣ **update_scripts_for_new_structure()**
**Algoritmo MASTER de atualização:**
```
1. DEFINIÇÃO DO DIRETÓRIO DE SCRIPTS:
   script_dir = Path("VIRTUAL_COMPANY_GENERATOR/core")

2. EXECUÇÃO SEQUENCIAL:
   - update_script_4(script_dir)  # Atualizar Script 4 - TaskTodo Analysis
   - update_script_5(script_dir)  # Atualizar Script 5 - N8N Workflows

3. CONFIRMAÇÃO:
   - Log de sucesso
   - Confirmação de compatibilidade com nova estrutura
```

**Entrada:** Nenhuma (hardcoded paths)  
**Saída:** Scripts 4 e 5 atualizados  
**Algoritmo Crítico:** Atualização sequencial garantida  

### 2️⃣ **update_script_4(script_dir)**
**Algoritmo de atualização do Script 4 (TaskTodo Analysis):**
```
1. LOCALIZAÇÃO DO SCRIPT:
   script4_path = script_dir / "generate_fluxos_analise.py"

2. LEITURA DO CONTEÚDO ATUAL:
   with open(script4_path, 'r', encoding='utf-8') as f:
       content = f.read()

3. SUBSTITUIÇÕES DE PATHS BÁSICAS:
   replacements = {
     '"04_PERSONAS_COMPLETAS"' → '"04_PERSONAS_SCRIPTS_1_2_3"',
     '"competencias"' → '"script1_competencias"',
     '"tech_specs"' → '"script2_tech_specs"',
     # Manter nomes de arquivos JSON inalterados
   }

4. ATUALIZAÇÃO CRÍTICA - LOCAL DE SALVAMENTO TASKTODO:
   OLD (estrutura hierárquica externa):
   ```
   tasktodo_dir = self.output_dir / "tasktodo" / categoria / persona_name.lower()
   ```
   
   NEW (dentro da pasta da persona):
   ```
   persona_path = self.output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name
   tasktodo_dir = persona_path / "script4_tasktodo"
   ```

5. APLICAÇÃO DAS SUBSTITUIÇÕES:
   Para cada (old, new) em replacements:
   - content = content.replace(old, new)

6. SALVAMENTO DO ARQUIVO ATUALIZADO:
   with open(script4_path, 'w', encoding='utf-8') as f:
       f.write(content)
```

**Entrada:** Diretório dos scripts  
**Saída:** Script 4 atualizado para nova estrutura  
**Funcionalidade Crítica:** Mudar salvamento para dentro das pastas de persona  

### 3️⃣ **update_script_5(script_dir)**
**Algoritmo COMPLEXO de atualização do Script 5 (N8N Workflows):**
```
1. LOCALIZAÇÃO DO SCRIPT:
   script5_path = script_dir / "generate_workflows_n8n.py"

2. LEITURA DO CONTEÚDO ATUAL:
   with open(script5_path, 'r', encoding='utf-8') as f:
       content = f.read()

3. SUBSTITUIÇÕES DE PATHS BÁSICAS:
   replacements = {
     '"04_PERSONAS_COMPLETAS"' → '"04_PERSONAS_SCRIPTS_1_2_3"',
     '"competencias"' → '"script1_competencias"',
     '"tech_specs"' → '"script2_tech_specs"',
     '"tasktodo"' → '"script4_tasktodo"',
     # Manter arquivos JSON inalterados
   }

4. ATUALIZAÇÃO CRÍTICA 1 - CARREGAMENTO DE DADOS TASKTODO:
   OLD (estrutura externa):
   ```
   fluxos_path = self.output_dir / "tasktodo" / categoria / persona_name.lower() / "fluxos_analysis.json"
   ```
   
   NEW (dentro da pasta da persona):
   ```
   persona_path = self.output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name
   fluxos_path = persona_path / "script4_tasktodo" / "fluxos_analysis.json"
   ```

5. ATUALIZAÇÃO CRÍTICA 2 - DESCOBERTA DE PERSONAS:
   OLD (buscar em tasktodo externo):
   ```
   for categoria_dir in tasktodo_dir.iterdir():
       for persona_dir in categoria_dir.iterdir():
           personas.append(f"{categoria_dir.name}/{persona_dir.name}")
   ```
   
   NEW (buscar em 04_PERSONAS_SCRIPTS_1_2_3):
   ```
   personas_base_dir = self.output_dir / "04_PERSONAS_SCRIPTS_1_2_3"
   for categoria_dir in personas_base_dir.iterdir():
       for persona_dir in categoria_dir.iterdir():
           tasktodo_path = persona_dir / "script4_tasktodo"
           if tasktodo_path.exists():  # Só inclui se tem dados do Script 4
               personas.append(f"{categoria_dir.name}/{persona_dir.name}")
   ```

6. ATUALIZAÇÃO CRÍTICA 3 - SALVAMENTO DE WORKFLOWS:
   OLD (pasta centralizada):
   ```
   workflows_dir = self.output_dir / "05_WORKFLOWS_N8N"
   workflow_path = workflows_dir / f"workflow_{persona_name.lower()}.json"
   ```
   
   NEW (dentro da pasta da persona):
   ```
   persona_dir = self.output_dir / "04_PERSONAS_SCRIPTS_1_2_3" / categoria / persona_name
   workflows_dir = persona_dir / "script5_workflows_n8n"
   workflow_path = workflows_dir / f"workflow_{persona_name.lower()}.json"
   ```

7. APLICAÇÃO DE TODAS AS SUBSTITUIÇÕES:
   - Aplicar replacements básicas
   - Aplicar substituições complexas de blocos de código

8. SALVAMENTO DO ARQUIVO ATUALIZADO:
   with open(script5_path, 'w', encoding='utf-8') as f:
       f.write(content)
```

**Entrada:** Diretório dos scripts  
**Saída:** Script 5 atualizado para nova estrutura  
**Algoritmo Crítico:** Múltiplas atualizações coordenadas - descoberta + carregamento + salvamento  

---

## 📊 **ESTRUTURAS DE TRANSFORMAÇÃO**

### **Mudanças de Paths Básicas:**
```python
replacements = {
    # Pasta principal de personas
    '"04_PERSONAS_COMPLETAS"': '"04_PERSONAS_SCRIPTS_1_2_3"',
    
    # Subpastas sequenciais
    '"competencias"': '"script1_competencias"',
    '"tech_specs"': '"script2_tech_specs"',
    '"tasktodo"': '"script4_tasktodo"',  # Só no Script 5
    
    # Arquivos JSON mantidos
    'competencias_core.json': 'competencias_core.json',
    'ai_config.json': 'ai_config.json',
    'tools_config.json': 'tools_config.json'
}
```

### **Transformação de Estrutura (Script 4):**
```
ANTES (estrutura externa):
output/
├── tasktodo/
│   ├── executivos/
│   │   └── persona_name/
│   │       └── fluxos_analysis.json
│   └── assistentes/...
└── 04_PERSONAS_COMPLETAS/...

DEPOIS (estrutura centralizada):
output/
└── 04_PERSONAS_SCRIPTS_1_2_3/
    ├── executivos/
    │   └── PersonaName/
    │       ├── PersonaName_bio.md
    │       ├── script1_competencias/
    │       ├── script2_tech_specs/
    │       ├── script3_rag/
    │       └── script4_tasktodo/      ← TaskTodo vai aqui
    │           └── fluxos_analysis.json
    └── assistentes/...
```

### **Transformação de Estrutura (Script 5):**
```
ANTES (estrutura externa):
output/
├── 05_WORKFLOWS_N8N/
│   ├── workflow_persona1.json
│   ├── workflow_persona2.json
│   └── ...
└── tasktodo/... (dados externos)

DEPOIS (estrutura centralizada):
output/
└── 04_PERSONAS_SCRIPTS_1_2_3/
    ├── executivos/
    │   └── PersonaName/
    │       ├── script4_tasktodo/       ← Lê daqui
    │       │   └── fluxos_analysis.json
    │       └── script5_workflows_n8n/  ← Salva aqui
    │           ├── workflow_persona.json
    │           ├── validation_persona.json
    │           └── README_persona.md
    └── assistentes/...
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Atualização Inteligente:**
- **Substituições de paths** automatizadas
- **Preservação de lógica** de negócio
- **Manutenção de compatibilidade** com arquivos JSON
- **Mudança de fluxo** de dados para estrutura centralizada

### 🌍 **Transformações Coordenadas:**
- **Script 4**: Muda salvamento de TaskTodo para dentro da persona
- **Script 5**: Muda descoberta, carregamento e salvamento para nova estrutura
- **Validação de existência** antes de processar
- **Manutenção de hierarquia** categoria/persona

### 📝 **Preservação de Funcionalidade:**
- **Arquivos JSON** mantidos inalterados (competencias_core.json, etc.)
- **Lógica de processamento** preservada
- **Validações existentes** mantidas
- **Outputs finais** idênticos, apenas mudança de localização

### 🔧 **Compatibilidade Garantida:**
- **Encoding UTF-8** mantido
- **Estrutura de dados** preservada
- **APIs internas** não alteradas
- **Workflows externos** continuam funcionando

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os
from pathlib import Path
```

**Paths Hardcoded:**
```python
script_dir = Path(r"C:\Users\Sergio Castro\Documents\Projetos\1NewTools\VIRTUAL_COMPANY_GENERATOR\core")
```

**Arquivos Alvo:**
- `generate_fluxos_analise.py` (Script 4)
- `generate_workflows_n8n.py` (Script 5)

**Operações de Arquivo:**
- **Leitura completa** do arquivo original
- **Substituições de string** coordenadas
- **Escrita completa** do arquivo atualizado
- **Encoding UTF-8** consistente

---

## 🎯 **STATUS NO SISTEMA**

### **Funcionalidade Ativa:**
✅ Atualizador automático de scripts  
✅ Compatibilidade com reorganização estrutural  
✅ Preservação de funcionalidade dos scripts  
✅ Transformação coordenada de múltiplos arquivos  

### **Uso em Produção:**
✅ Migração de scripts para nova estrutura  
✅ Atualização automática de paths  
✅ Manutenção de compatibilidade  
✅ Preservação de dados e lógica  

---

## 🎉 **RESULTADO FINAL**

O algoritmo produz **SCRIPTS ATUALIZADOS** que:

✅ **Funcionam perfeitamente** com nova estrutura reorganizada  
✅ **Preservam toda a funcionalidade** original  
✅ **Centralizam dados** dentro das pastas de persona  
✅ **Mantêm compatibilidade** com arquivos JSON existentes  
✅ **Descobrem personas** na nova localização  
✅ **Salvam outputs** nos locais corretos da nova estrutura  

**Sistema pronto para:** execução dos Scripts 4 e 5 com estrutura reorganizada.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Update Scripts v1.0.0 (ATIVA)*  
*📊 Complexidade: 166 linhas, atualização automática, preservação de funcionalidade*