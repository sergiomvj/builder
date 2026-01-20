# 🎯 ALGORITMO - Create Clean Template

**Arquivo:** `02_create_clean_template.py`  
**Função:** Criador de template limpo para novas empresas virtuais  
**Linhas de Código:** 818  
**Versão:** Sistema reorganizado baseado no Carntrack

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é responsável por **CRIAR UM TEMPLATE PADRONIZADO** para geração de novas empresas virtuais, baseado na estrutura reorganizada e otimizada do sistema Carntrack. Gera uma estrutura completa, limpa e reutilizável para acelerar a criação de empresas virtuais.

### 🎯 **OBJETIVO PRINCIPAL:**
Automatizar a criação de templates padronizados que servem como base para novas empresas virtuais, incluindo estrutura de pastas, templates de documentos, scripts auxiliares e exemplos práticos.

---

## 🔧 **ALGORITMOS PRINCIPAIS**

### 1️⃣ **create_clean_template()**
**Algoritmo MESTRE de criação de template:**
```
1. INICIALIZAÇÃO:
   - Exibir cabeçalho de início
   - Definir diretório destino (C:\...\VIRTUAL_COMPANY_TEMPLATE_CLEAN)
   
2. LIMPEZA PRÉVIA:
   - Verificar se template já existe
   - Se existir: remover completamente (shutil.rmtree)
   - Logar remoção
   
3. CRIAÇÃO SEQUENCIAL:
   - create_base_structure(template_dir)
   - create_example_templates(template_dir)
   - create_template_documentation(template_dir)
   - create_generation_scripts(template_dir)
   
4. FINALIZAÇÃO:
   - Exibir status de sucesso
   - Mostrar localização do template
   - print_template_structure() com guia de uso
```

**Entrada:** Nenhuma  
**Saída:** Template completo criado no diretório especificado  
**Funcionalidade Crítica:** Orquestração completa da criação  

### 2️⃣ **create_base_structure(template_dir)**
**Algoritmo de estrutura de pastas:**
```
1. DEFINIR ESTRUTURA PRINCIPAL (20 pastas):
   - 01_DOCUMENTACAO_GERAL
   - 02_SCRIPTS_AUTOMACAO
   - 03_WORKFLOWS_LEGADO
   - 04_PERSONAS_SCRIPTS_1_2_3 (pasta principal)
   
   SUBPASTAS DE PERSONAS:
   - assistentes_exemplo/
   - executivos_exemplo/
   - especialistas_exemplo/
   - suporte_exemplo/
   
   - 05_TEMPLATES_SISTEMA (templates reutilizáveis)
   
   SUBPASTAS DE TEMPLATES:
   - biografia_templates/
   - competencias_templates/
   - tech_specs_templates/
   - rag_templates/
   - tasktodo_templates/
   - workflow_templates/
   - email_templates/
   - documento_templates/
   
   - 06_RAG_KNOWLEDGE_BASE
   - 07_EMAIL_TEMPLATES
   - 08_DATABASE_SCHEMAS
   - 09_MONITORING_LOGS

2. CRIAÇÃO ITERATIVA:
   Para cada pasta na lista:
   - Criar usando folder_path.mkdir(parents=True, exist_ok=True)
   - Logar criação da pasta
   
3. LOG FINALIZAÇÃO:
   - Confirmar estrutura completa criada
```

**Entrada:** template_dir (Path)  
**Saída:** Estrutura completa de 20 pastas + subpastas  
**Algoritmo Crítico:** Estrutura numerada sequencial baseada nos scripts  

### 3️⃣ **create_example_templates(template_dir)**
**Algoritmo COMPLEXO de criação de templates:**
```
1. CRIAR TEMPLATE DE BIOGRAFIA COMPLETA:
   
   ESTRUTURA DO TEMPLATE (estrutura markdown avançada):
   - INFORMAÇÕES BÁSICAS (nome, cargo, departamento, empresa, localização, experiência)
   - PERFIL PROFISSIONAL:
     - Background Acadêmico
     - Experiência Profissional (histórico detalhado)
     - Competências Técnicas (lista de 4+ competências)
     - Competências Comportamentais (soft skills)
   
   - RESPONSABILIDADES E OBJETIVOS:
     - Responsabilidades Principais (3 responsabilidades)
     - Objetivos de Curto Prazo (3 meses - 2 objetivos)
     - Objetivos de Médio Prazo (6-12 meses - 2 objetivos)
     - Objetivos de Longo Prazo (1+ anos - 2 objetivos)
   
   - ROTINA DE TRABALHO:
     - Tarefas Diárias (5 tarefas operacionais)
     - Tarefas Semanais (4 tarefas táticas)
     - Tarefas Mensais (3 tarefas estratégicas)
   
   - FERRAMENTAS E TECNOLOGIAS:
     - Software Utilizado (3+ softwares)
     - Plataformas e Sistemas (3+ plataformas)
   
   - MÉTRICAS E KPIS:
     - KPIs Principais (3 KPIs)
     - Métricas Secundárias (2 métricas)
   
   - RELACIONAMENTOS PROFISSIONAIS:
     - Reporta para (superior direto)
     - Gerencia (subordinados)
     - Colabora com (stakeholders)
   
   - DESAFIOS E OPORTUNIDADES:
     - Principais Desafios (3 desafios)
     - Oportunidades de Melhoria (3 oportunidades)
   
   - PROCESSOS AUTOMATIZÁVEIS:
     - Alta Prioridade (2 processos)
     - Média Prioridade (2 processos)
     - Baixa Prioridade (1 processo)

2. SALVAR TEMPLATE:
   - Local: 05_TEMPLATES_SISTEMA/biografia_templates/biografia_template.md
   - Encoding: UTF-8

3. CRIAR ESTRUTURA DE PERSONA EXEMPLO:
   - Pasta: 04_PERSONAS_SCRIPTS_1_2_3/assistentes_exemplo/Persona_Exemplo/
   - Subpastas para cada script:
     - script1_competencias/
     - script2_tech_specs/
     - script3_rag/
     - script4_tasktodo/
     - script5_workflows_n8n/

4. GERAR README PARA CADA SUBPASTA:
   Para cada pasta de script:
   - Criar README.md explicativo
   - Incluir descrição do propósito
   - Listar arquivos esperados
   - Instruções de uso
   - Info de geração automática

5. CRIAR BIOGRAFIA DE EXEMPLO:
   - Aplicar template com dados de exemplo
   - Substituir placeholders com "Persona de Exemplo"
   - Salvar como Persona_Exemplo_bio.md
```

**Entrada:** template_dir (Path)  
**Saída:** Templates completos + estrutura de exemplo  
**Algoritmo Crítico:** Template de biografia extenso e estrutura padronizada  

### 4️⃣ **create_template_documentation(template_dir)**
**Algoritmo EXTENSIVO de documentação:**
```
1. CRIAR README PRINCIPAL (main_readme):
   
   ESTRUTURA COMPLETA:
   - CABEÇALHO: título + baseado em Carntrack
   - VISÃO GERAL: propósito e objetivo
   
   - COMO USAR ESTE TEMPLATE (4 etapas):
     1. Preparação (copiar, renomear, atualizar)
     2. Criação de Personas (usar templates, criar pastas)
     3. Execução dos Scripts (sequência 1-5 detalhada)
     4. Estrutura Final (exemplo visual ASCII)
   
   - ESTRUTURA DO TEMPLATE (descrição de cada pasta):
     - 01_DOCUMENTACAO_GERAL/
     - 02_SCRIPTS_AUTOMACAO/
     - 03_WORKFLOWS_LEGADO/
     - 04_PERSONAS_SCRIPTS_1_2_3/ (pasta principal destacada)
     - 05_TEMPLATES_SISTEMA/ (templates reutilizáveis destacados)
     - 06-09: Pastas de Sistema
   
   - VANTAGENS DESTA ESTRUTURA (5 vantagens):
     - Organizada (numeração sequencial)
     - Completa (tudo por persona)
     - Escalável (fácil expansão)
     - Reutilizável (templates aceleram)
     - Documentada (guias claros)
   
   - CHECKLIST PARA NOVA EMPRESA (8 etapas)
   - SCRIPTS INCLUÍDOS (configurações automáticas)
   - SUPORTE (instruções para dúvidas)

2. CRIAR TEMPLATE DE README PARA EMPRESA:
   
   ESTRUTURA PARA empresa_readme:
   - CABEÇALHO: nome da empresa + badge de geração
   - ESTRUTURA REORGANIZADA (4 vantagens destacadas)
   - VISÃO GERAL: campos substituíveis
   - ESTATÍSTICAS ATUAIS: contadores de personas
   - ESTRUTURA DE PERSONAS (por categoria)
   - STATUS DO PROJETO (3 seções: concluído, andamento, planejado)
   - SCRIPTS UTILIZADOS (status de cada script 1-5)
   - ESTRUTURA DE ARQUIVOS (tree view ASCII)
   - CONTATO E SUPORTE

3. SALVAR DOCUMENTAÇÃO:
   - README.md principal no root
   - README_EMPRESA.md como template
   - Encoding UTF-8 para ambos
```

**Entrada:** template_dir (Path)  
**Saída:** Documentação completa (2 READMEs)  
**Algoritmo Crítico:** Documentação padronizada extensiva  

### 5️⃣ **create_generation_scripts(template_dir)**
**Algoritmo de criação de scripts auxiliares:**
```
1. CRIAR SCRIPT INICIALIZADOR (initialize_company.py):
   
   FUNÇÃO initialize_new_company():
   - Exibir cabeçalho de inicialização
   - Coletar informações interativas:
     - Nome da empresa
     - Indústria/Setor
     - Domínio (ex: empresa.com)
     - Descrição breve
     - Público-alvo
   - Chamar update_company_readme(company_info)
   - Chamar setup_persona_categories()
   - Exibir próximos passos
   
   FUNÇÃO update_company_readme(info):
   - Ler README_EMPRESA.md existente
   - Substituir todos os placeholders:
     - [NOME DA EMPRESA] → info['nome']
     - [Nome da Empresa] → info['nome']
     - [Indústria/Setor] → info['industria']
     - [dominio.com] → info['dominio']
     - [Data] → timestamp atual
     - [Descrição...] → info['descricao']
     - [Público-alvo...] → info['publico_alvo']
   - Salvar arquivo atualizado
   - Logar atualização
   
   FUNÇÃO setup_persona_categories():
   - Definir categories = ['assistentes', 'executivos', 'especialistas', 'suporte']
   - Para cada categoria:
     - Criar pasta em 04_PERSONAS_SCRIPTS_1_2_3/
     - Criar README.md explicativo
     - Incluir instruções de uso
     - Mostrar estrutura esperada

2. CRIAR SCRIPT VALIDADOR (validate_structure.py):
   
   FUNÇÃO validate_structure():
   - Exibir cabeçalho de validação
   - Inicializar listas: issues=[], warnings=[]
   
   VERIFICAR PASTAS OBRIGATÓRIAS:
   - Lista de 9 pastas principais
   - Para cada pasta verificar se existe
   - Se ausente: adicionar a issues
   - Se presente: log ✅
   
   VERIFICAR PERSONAS:
   - Verificar se 04_PERSONAS_SCRIPTS_1_2_3/ existe
   - Listar categorias (subdiretórios)
   - Se vazio: adicionar warning
   - Para cada categoria:
     - Contar personas (exceto *_exemplo)
     - Log estatísticas por categoria
     - Chamar validate_persona_structure() para cada
   
   VERIFICAR ARQUIVOS PRINCIPAIS:
   - README.md e README_EMPRESA.md obrigatórios
   - Se ausente: adicionar a issues
   
   GERAR RELATÓRIO FINAL:
   - Se sem problemas: sucesso completo
   - Se issues: listar problemas críticos
   - Se warnings: listar avisos
   - Retornar boolean (sucesso/falha)
   
   FUNÇÃO validate_persona_structure(persona_path, warnings):
   - Verificar 5 pastas de script obrigatórias
   - Se ausente: adicionar warning com detalhes
   - Verificar biografia (*_bio.md)
   - Se ausente: adicionar warning

3. SALVAR SCRIPTS:
   - initialize_company.py no root
   - validate_structure.py no root
   - Ambos com encoding UTF-8
   - Ambos executáveis (#!/usr/bin/env python3)
```

**Entrada:** template_dir (Path)  
**Saída:** 2 scripts Python auxiliares completos  
**Algoritmo Crítico:** Automação de setup e validação  

### 6️⃣ **print_template_structure()**
**Algoritmo de exibição visual:**
```
1. CRIAR REPRESENTAÇÃO ASCII TREE:
   - Usar emojis para diferenciação
   - Estrutura hierárquica com indentação
   - Mostrar arquivos principais e subpastas
   - Destacar pasta exemplo com estrutura completa

2. EXIBIR GUIA DE USO (5 passos):
   - Copiar pasta para nova localização
   - Executar initialize_company.py
   - Criar biografias usando templates
   - Executar scripts 1-5 sequencialmente
   - Usar validate_structure.py para verificar

3. FORMATAÇÃO VISUAL:
   - Separadores com "=" 
   - Emojis para identificação rápida
   - Estrutura numerada clara
```

**Entrada:** Nenhuma  
**Saída:** Exibição visual da estrutura  
**Funcionalidade:** Documentação visual final  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Template de Biografia (Complexo):**
```markdown
# BIOGRAFIA - [NOME DA PERSONA]

## 📋 INFORMAÇÕES BÁSICAS
**Nome**: [substituível]
**Cargo/Função**: [substituível]
**Departamento**: [substituível]
**Empresa**: [substituível]
**Localização**: [substituível]
**Experiência**: [substituível]

## 👤 PERFIL PROFISSIONAL
### Background Acadêmico
### Experiência Profissional  
### Competências Técnicas (4+ items)
### Competências Comportamentais (3+ items)

## 🎯 RESPONSABILIDADES E OBJETIVOS
### Responsabilidades Principais (3 items)
### Objetivos de Curto Prazo (2 items)
### Objetivos de Médio Prazo (2 items)
### Objetivos de Longo Prazo (2 items)

## 📅 ROTINA DE TRABALHO
### Tarefas Diárias (5 items operacionais)
### Tarefas Semanais (4 items táticas)  
### Tarefas Mensais (3 items estratégicas)

## 🔧 FERRAMENTAS E TECNOLOGIAS
### Software Utilizado (3+ items)
### Plataformas e Sistemas (3+ items)

## 📊 MÉTRICAS E KPIS
### KPIs Principais (3 items)
### Métricas Secundárias (2 items)

## 🤝 RELACIONAMENTOS PROFISSIONAIS
### Reporta para
### Gerencia
### Colabora com

## 🎭 DESAFIOS E OPORTUNIDADES
### Principais Desafios (3 items)
### Oportunidades de Melhoria (3 items)

## 💡 PROCESSOS AUTOMATIZÁVEIS
### Alta Prioridade (2 items)
### Média Prioridade (2 items)
### Baixa Prioridade (1 item)
```

### **Estrutura de Pastas (20 diretórios):**
```
01_DOCUMENTACAO_GERAL/
02_SCRIPTS_AUTOMACAO/
03_WORKFLOWS_LEGADO/
04_PERSONAS_SCRIPTS_1_2_3/
├── assistentes_exemplo/
├── executivos_exemplo/
├── especialistas_exemplo/
└── suporte_exemplo/
05_TEMPLATES_SISTEMA/
├── biografia_templates/
├── competencias_templates/
├── tech_specs_templates/
├── rag_templates/
├── tasktodo_templates/
├── workflow_templates/
├── email_templates/
└── documento_templates/
06_RAG_KNOWLEDGE_BASE/
07_EMAIL_TEMPLATES/
08_DATABASE_SCHEMAS/
09_MONITORING_LOGS/
```

### **Scripts Auxiliares:**
```python
# initialize_company.py
- collect_company_info() → interactive input
- update_company_readme() → placeholder replacement  
- setup_persona_categories() → folder creation

# validate_structure.py
- validate_structure() → comprehensive validation
- validate_persona_structure() → per-persona validation
- issues[] e warnings[] tracking
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Padronização:**
- Estrutura numerada sequencial alinhada com scripts 1-5
- Templates reutilizáveis para todas as empresas
- Nomenclatura consistente para pastas e arquivos
- Estrutura de persona padronizada

### 🔄 **Reutilização:**
- Template de biografia extenso e detalhado
- Scripts auxiliares para acelerar setup
- Estrutura de exemplo pré-configurada
- Documentação completa incluída

### 🛡️ **Robustez:**
- Validação automática de estrutura
- Limpeza de template anterior antes de criar
- Scripts de inicialização com substituição automática
- Encoding UTF-8 consistente

### 🚀 **Automação:**
- Criação de template completamente automatizada
- Scripts auxiliares para setup de nova empresa
- Validação automática de estrutura
- Substituição automática de placeholders

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os
import shutil  # Para limpeza de diretório
from pathlib import Path  # Para manipulação de paths
import json  # Para configurações
from datetime import datetime  # Para timestamps
```

**Estrutura de Arquivos:**
- Templates Markdown com placeholders
- Scripts Python executáveis
- Estrutura de diretórios multi-nível
- READMEs documentados

**Compatibilidade:**
- Windows: Path absolutos com C:\Users\...
- Cross-platform: uso de pathlib
- Encoding UTF-8 explícito em todos os arquivos

---

## 📁 **OUTPUTS GERADOS**

### **Template Completo:** `VIRTUAL_COMPANY_TEMPLATE_CLEAN/`

**Arquivos Principais:**
✅ `README.md` - Documentação do template  
✅ `README_EMPRESA.md` - Template para nova empresa  
✅ `initialize_company.py` - Script de inicialização  
✅ `validate_structure.py` - Script de validação  

**Estruturas:**
✅ **20 diretórios** organizados numericamente  
✅ **8 subpastas** de templates especializados  
✅ **4 categorias** de personas com exemplos  
✅ **5 pastas de scripts** por persona exemplo  

**Templates:**
✅ **Biografia extensiva** com 10+ seções estruturadas  
✅ **READMEs explicativos** em cada pasta  
✅ **Persona exemplo** completamente configurada  
✅ **Scripts auxiliares** funcionais  

---

## 🎯 **FLUXO DE USO**

```
1. EXECUTAR create_clean_template()
   ↓
2. TEMPLATE CRIADO em C:\Users\...\VIRTUAL_COMPANY_TEMPLATE_CLEAN\
   ↓
3. COPIAR template para nova localização
   ↓
4. EXECUTAR initialize_company.py
   ↓
5. PREENCHER biografias usando templates
   ↓
6. EXECUTAR scripts 1-5 sequencialmente
   ↓
7. VALIDAR com validate_structure.py
```

---

## 🎉 **RESULTADO FINAL**

O algoritmo gera um **TEMPLATE LIMPO E COMPLETO** que serve como base para criar qualquer nova empresa virtual, incluindo:

✅ **Estrutura padronizada** numerada sequencialmente  
✅ **Templates reutilizáveis** para aceleração  
✅ **Scripts auxiliares** para automação  
✅ **Documentação completa** integrada  
✅ **Exemplos práticos** pré-configurados  
✅ **Validação automática** de estrutura  

**Sistema pronto para:** ser copiado e reutilizado infinitas vezes para criação rápida de novas empresas virtuais.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: VCM Template Generator v2.0.0*  
*📊 Complexidade: 818 linhas, template extensivo, automação completa*