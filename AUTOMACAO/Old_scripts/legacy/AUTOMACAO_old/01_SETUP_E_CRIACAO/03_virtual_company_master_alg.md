# 🎯 ALGORITMO - Virtual Company Master

**Arquivo:** `03_virtual_company_master.py`  
**Função:** Sistema master integrado para geração e gerenciamento de empresas virtuais  
**Linhas de Código:** 359  
**Versão:** Master Completo v2.0.0

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **SISTEMA MASTER INTEGRADO** que orquestra todo o processo de criação, gerenciamento e execução de empresas virtuais. Funciona como interface central para todos os componentes do VCM, integrando template limpo, execução de scripts e validação.

### 🎯 **OBJETIVO PRINCIPAL:**
Ser o ponto único de controle para criação, execução de scripts, validação e monitoramento de empresas virtuais, proporcionando interface intuitiva e automação completa do processo.

---

## 🔧 **ALGORITMOS PRINCIPAIS**

### 1️⃣ **main_menu()**
**Algoritmo MESTRE de interface:**
```
1. INICIALIZAÇÃO:
   - Exibir cabeçalho "VIRTUAL COMPANY GENERATOR MASTER v2.0.0"
   - Mostrar descrição do sistema
   
2. LOOP PRINCIPAL INTERATIVO:
   Enquanto True:
   - Exibir menu de opções (6 opções):
     1. Criar Nova Empresa Virtual (Template Limpo)
     2. Executar Scripts em Empresa Existente
     3. Validar Estrutura de Empresa
     4. Status de Empresa Virtual
     5. Gerenciar Templates
     6. Sair
   
   - Capturar escolha do usuário
   - Switch/case baseado na escolha:
     - "1" → create_new_company()
     - "2" → run_scripts_on_company()
     - "3" → validate_company_structure()
     - "4" → show_company_status()
     - "5" → manage_templates()
     - "6" → break (sair)
     - outro → erro e retry
   
   - Pausa para continuar (input Enter)
   - Limpar tela (separador visual)
   
3. FINALIZAÇÃO:
   - Mensagem de saída
   - Encerrar programa
```

**Entrada:** Inputs interativos do usuário (1-6)  
**Saída:** Execução das funções correspondentes  
**Funcionalidade Crítica:** Interface central unificada  

### 2️⃣ **create_new_company()**
**Algoritmo de criação de nova empresa:**
```
1. VALIDAÇÃO DO TEMPLATE:
   - Definir template_source = "C:\...\VIRTUAL_COMPANY_TEMPLATE_CLEAN"
   - Verificar se template existe
   - Se não existe: exibir erro + instruções create_clean_template.py
   
2. COLETA DE INFORMAÇÕES:
   - Input: nome da empresa (sem espaços)
   - Validar nome não vazio
   - Normalizar: substituir espaços por underscore
   
3. DEFINIÇÃO DE DESTINO:
   - base_dir = "C:\Users\Sergio Castro\Documents\Projetos\1NewTools"
   - company_dir = base_dir / "EMPRESA_{nome_upper}"
   - Verificar se já existe
   - Se existe: erro e retorno
   
4. PROCESSO DE CRIAÇÃO:
   Try:
   - Copiar template completo (shutil.copytree)
   - Mudar para diretório da empresa (os.chdir)
   - Verificar se initialize_company.py existe
   - Se existe: executar script inicializador (subprocess.run)
   - Exibir sucesso + localização + instruções
   - Voltar ao diretório original
   
   Catch Exception:
   - Exibir erro detalhado
```

**Entrada:** Nome da empresa (interactive input)  
**Saída:** Empresa virtual completa baseada em template  
**Algoritmo Crítico:** Cópia + inicialização automática  

### 3️⃣ **run_scripts_on_company()**
**Algoritmo de execução de scripts:**
```
1. SELEÇÃO DE EMPRESA:
   - Input: caminho completo da empresa
   - Validar caminho não vazio
   - Verificar se diretório existe
   - Verificar estrutura de personas (04_PERSONAS_SCRIPTS_1_2_3/)
   
2. MENU DE SCRIPTS (loop interativo):
   Enquanto True:
   - Exibir opções:
     1. Script 1 - Competências
     2. Script 2 - Tech Specs
     3. Script 3 - RAG Knowledge Base
     4. Script 4 - TaskTodo Analysis
     5. Script 5 - Workflows N8N
     6. Executar TODOS os scripts (1-5)
     7. Voltar ao menu principal
   
   - Capturar escolha
   - Switch/case:
     - "1"-"5" → run_single_script(choice, company_path)
     - "6" → run_all_scripts(company_path)
     - "7" → break (voltar)
     - outro → erro
```

**Entrada:** Caminho da empresa + escolha do script  
**Saída:** Execução dos scripts selecionados  
**Funcionalidade Crítica:** Orquestração de execução de scripts  

### 4️⃣ **run_single_script(script_num, company_path)**
**Algoritmo de execução individual:**
```
1. MAPEAMENTO DE SCRIPTS:
   scripts_map = {
     "1": "generate_competencias.py",
     "2": "generate_tech_specs.py",
     "3": "generate_rag.py", 
     "4": "generate_fluxos_analise.py",
     "5": "generate_workflows_n8n.py"
   }
   
   script_names = {
     "1": "Competências",
     "2": "Tech Specs",
     "3": "RAG Knowledge Base",
     "4": "TaskTodo Analysis",
     "5": "Workflows N8N"
   }

2. VALIDAÇÃO:
   - Obter script_file e script_name do mapeamento
   - Se inválido: erro e retorno
   
3. LOCALIZAÇÃO DO SCRIPT:
   - core_dir = Path(__file__).parent / "core"
   - script_path = core_dir / script_file
   - Verificar se script existe
   
4. EXECUÇÃO:
   Try:
   - subprocess.run com:
     - Comando: python script_path
     - Input: company_path + "\n"
     - Captura de output (stdout/stderr)
     - Timeout de 300 segundos (5 minutos)
   
   - Exibir output capturado
   - Verificar código de retorno
   - Se 0: sucesso, senão: falha
   
   Catch TimeoutExpired:
   - Erro de timeout (5 minutos)
   
   Catch Exception:
   - Erro genérico de execução
```

**Entrada:** Número do script + caminho da empresa  
**Saída:** Execução do script com output capturado  
**Algoritmo Crítico:** Execução com timeout e captura de output  

### 5️⃣ **run_all_scripts(company_path)**
**Algoritmo de execução sequencial:**
```
1. INICIALIZAÇÃO:
   - Exibir cabeçalho de execução sequencial
   - Definir scripts = ["1", "2", "3", "4", "5"]
   
2. LOOP SEQUENCIAL:
   Para cada script_num em scripts:
   - Exibir qual script está executando
   - Chamar run_single_script(script_num, company_path)
   - Pausa para confirmação (input Enter)
   
3. FINALIZAÇÃO:
   - Exibir conclusão de todos os scripts
```

**Entrada:** Caminho da empresa  
**Saída:** Execução sequencial de todos os 5 scripts  
**Funcionalidade:** Automação completa do pipeline  

### 6️⃣ **validate_company_structure()**
**Algoritmo de validação:**
```
1. SELEÇÃO DE EMPRESA:
   - Input: caminho completo da empresa
   - Validar caminho não vazio
   - Verificar se diretório existe
   
2. VALIDAÇÃO POR SCRIPT PRÓPRIO:
   - Localizar validator_script = company_dir / "validate_structure.py"
   - Se exists:
     Try:
     - Mudar para diretório da empresa
     - Executar script validador (subprocess.run)
     - Voltar ao diretório original
     
     Catch Exception:
     - Exibir erro de execução
   
   - Se não exists:
     - Erro: script de validação não encontrado
```

**Entrada:** Caminho da empresa  
**Saída:** Execução do validador próprio da empresa  
**Algoritmo Crítico:** Delegação para validador específico  

### 7️⃣ **show_company_status()**
**Algoritmo de análise de status:**
```
1. SELEÇÃO E VALIDAÇÃO:
   - Input: caminho completo da empresa
   - Validar caminho e existência
   - Verificar estrutura de personas
   
2. ANÁLISE DE PERSONAS:
   - Inicializar categories = {}, total_personas = 0
   - Para cada category_dir em personas_dir:
     - Se é diretório e não é "_exemplo"
     - Contar personas (subdiretórios)
     - Adicionar ao categories[nome] = count
     - Somar ao total_personas
   
3. ANÁLISE DE SCRIPTS:
   - Chamar check_scripts_status(personas_dir)
   - Retorna status de execução de cada script 1-5
   
4. RELATÓRIO FINAL:
   - Exibir nome e localização da empresa
   - Lista personas por categoria
   - Total de personas
   - Status dos scripts (✅/❌ + contadores)
```

**Entrada:** Caminho da empresa  
**Saída:** Relatório detalhado de status  
**Funcionalidade Crítica:** Análise completa de estado  

### 8️⃣ **check_scripts_status(personas_dir)**
**Algoritmo COMPLEXO de verificação de scripts:**
```
1. INICIALIZAÇÃO DE ESTRUTURAS:
   scripts_status = {
     "1": {"completed": 0, "total": 0},
     "2": {"completed": 0, "total": 0},
     "3": {"completed": 0, "total": 0}, 
     "4": {"completed": 0, "total": 0},
     "5": {"completed": 0, "total": 0}
   }
   
   script_folders = {
     "1": "script1_competencias",
     "2": "script2_tech_specs", 
     "3": "script3_rag",
     "4": "script4_tasktodo",
     "5": "script5_workflows_n8n"
   }

2. ANÁLISE POR PERSONA:
   Para cada category_dir em personas_dir:
   - Se é diretório válido (não "_exemplo")
   - Para cada persona_dir na categoria:
     - Se é diretório:
       
       CONTAR TOTAL:
       - Para cada script_num em scripts_status:
         - Incrementar scripts_status[script_num]["total"] += 1
       
       VERIFICAR EXECUÇÃO:
       - Para cada (script_num, folder_name) em script_folders:
         - script_dir = persona_dir / folder_name
         - Se script_dir exists AND tem arquivos (any(iterdir())):
           - Incrementar scripts_status[script_num]["completed"] += 1

3. RETORNO:
   - Retornar dicionário scripts_status completo
```

**Entrada:** Diretório de personas  
**Saída:** Dicionário com status completo de todos os scripts  
**Algoritmo Crítico:** Verificação granular de execução por persona  

### 9️⃣ **manage_templates()**
**Algoritmo de gerenciamento de templates:**
```
1. EXIBIÇÃO DE INFO:
   - Cabeçalho "GERENCIAR TEMPLATES"
   - Mensagem: "Funcionalidade em desenvolvimento..."
   - Info sobre localização: "05_TEMPLATES_SISTEMA/"
   - Instrução para uso manual
   
NOTA: Funcionalidade placeholder para futuras expansões
```

**Entrada:** Nenhuma  
**Saída:** Mensagem informativa  
**Status:** Funcionalidade futura  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Mapeamento de Scripts:**
```python
scripts_map = {
    "1": "generate_competencias.py",
    "2": "generate_tech_specs.py", 
    "3": "generate_rag.py",
    "4": "generate_fluxos_analise.py",
    "5": "generate_workflows_n8n.py"
}

script_names = {
    "1": "Competências",
    "2": "Tech Specs",
    "3": "RAG Knowledge Base",
    "4": "TaskTodo Analysis", 
    "5": "Workflows N8N"
}
```

### **Status de Scripts:**
```python
scripts_status = {
    "script_num": {
        "completed": int,  # Personas que executaram
        "total": int       # Total de personas
    }
}
```

### **Estrutura de Pastas:**
```python
# Template Source
"C:\Users\Sergio Castro\Documents\Projetos\1NewTools\VIRTUAL_COMPANY_TEMPLATE_CLEAN"

# Empresas Criadas
"C:\Users\Sergio Castro\Documents\Projetos\1NewTools\EMPRESA_{NOME}"

# Scripts Core
Path(__file__).parent / "core" / "{script_file}"
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Integração Completa:**
- Interface única para todo o sistema VCM
- Integração com template limpo (script 02)
- Execução de scripts do pipeline (scripts 1-5)
- Validação automática de estruturas

### 🔄 **Automação Inteligente:**
- Cópia automática de template + inicialização
- Execução de scripts com timeout e captura de output
- Análise automática de status de execução
- Validação delegada para scripts específicos

### 🛡️ **Robustez e Validação:**
- Verificação de existência de templates e empresas
- Tratamento de erros com mensagens específicas
- Timeout de 5 minutos para scripts longos
- Captura de stdout/stderr para debugging

### 🚀 **Usabilidade:**
- Interface de menu intuitiva e numerada
- Pausas estratégicas para feedback do usuário
- Mensagens visuais com emojis e separadores
- Instruções claras para cada operação

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os          # Para mudança de diretório
import shutil      # Para cópia de templates
from pathlib import Path    # Para manipulação de paths
import subprocess  # Para execução de scripts
import sys        # Para executable Python
```

**Dependências Externas:**
- **Template limpo:** Gerado pelo script 02
- **Scripts core:** Localizados em pasta "core/"
- **Scripts de empresa:** initialize_company.py, validate_structure.py
- **Estrutura de personas:** 04_PERSONAS_SCRIPTS_1_2_3/

**Compatibilidade:**
- Windows: Paths absolutos com C:\Users\...
- Subprocess com timeout e captura de output
- Encoding de texto para comunicação entre processos

---

## 📁 **FLUXO DE OPERAÇÃO**

### **Criação de Nova Empresa:**
```
1. Validar template limpo existe
2. Coletar nome da empresa
3. Definir diretório destino
4. Copiar template (shutil.copytree)
5. Executar inicializador automático
6. Retornar para menu principal
```

### **Execução de Scripts:**
```
1. Selecionar empresa existente
2. Validar estrutura de personas
3. Escolher script(s) para executar
4. Executar com timeout e captura
5. Exibir resultados
6. Opção de executar próximo
```

### **Análise de Status:**
```
1. Selecionar empresa
2. Analisar estrutura de personas
3. Verificar execução de scripts
4. Gerar relatório completo
5. Exibir estatísticas visuais
```

---

## 🎯 **SAÍDA E RESULTADOS**

### **Para Criação de Empresa:**
✅ **Empresa completa** copiada de template  
✅ **Inicialização automática** executada  
✅ **Estrutura validada** e pronta para uso  
✅ **README atualizado** com info da empresa  

### **Para Execução de Scripts:**
✅ **Scripts executados** com timeout seguro  
✅ **Output capturado** para análise  
✅ **Status de execução** claro (sucesso/falha)  
✅ **Logs de erro** disponíveis se houver  

### **Para Análise de Status:**
✅ **Contagem de personas** por categoria  
✅ **Status de scripts** por persona  
✅ **Percentual de conclusão** por script  
✅ **Identificação de gaps** de execução  

---

## 🎉 **RESULTADO FINAL**

O algoritmo proporciona um **SISTEMA MASTER COMPLETO** que:

✅ **Centraliza toda operação VCM** em interface única  
✅ **Automatiza criação** de empresas virtuais  
✅ **Orquestra execução** dos scripts 1-5  
✅ **Monitora status** de forma visual e detalhada  
✅ **Integra validação** automática  
✅ **Trata erros** com recovery inteligente  

**Sistema pronto para:** operação production-ready de todo o workflow VCM através de interface master unificada.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: VCM Master v2.0.0*  
*📊 Complexidade: 359 linhas, interface completa, automação total*