# 🎯 ALGORITMO - Project Company Generator

**Arquivo:** `04_project_company_generator.py`  
**Função:** Gerador de empresas virtuais DENTRO de projetos específicos  
**Linhas de Código:** 455  
**Versão:** Project-Specific Generator

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é um **GERADOR ESPECIALIZADO** que cria empresas virtuais diretamente DENTRO da pasta de projetos específicos. Diferentemente do framework geral, foca na criação rápida e padronizada de 16 personas organizadas por hierarquia, integrando-se ao fluxo de desenvolvimento do projeto.

### 🎯 **OBJETIVO PRINCIPAL:**
Criar empresas virtuais auto-contidas dentro de projetos individuais, com estrutura fixa de 16 personas, templates por indústria e integração transparente ao projeto hospedeiro.

---

## 🏗️ **ARQUITETURA DE CLASSE**

### **VirtualCompanyGenerator**
```python
class VirtualCompanyGenerator:
    """Gerador de empresas virtuais para projetos individuais"""
```

**Responsabilidade:** Criar empresa virtual integrada ao projeto, com estrutura fixa e templates especializados por setor.

---

## 🔧 **MÉTODOS FUNDAMENTAIS**

### 1️⃣ **__init__(self, project_path=None)**
**Algoritmo de inicialização:**
```
1. DETERMINAÇÃO DO PROJETO:
   Se project_path fornecido:
   - Resolver path absoluto usando Path(project_path).resolve()
   Senão:
   - Usar diretório atual (Path.cwd().resolve())
   
2. INICIALIZAÇÃO DE ESTRUTURAS:
   - self.company_info = {} (dados da empresa)
   
3. CONFIGURAÇÃO DE INDÚSTRIAS:
   self.industries = {
     "1": "healthcare",
     "2": "education", 
     "3": "consulting",
     "4": "immigration",
     "5": "ecommerce",
     "6": "automotive",
     "7": "technology",
     "8": "finance",
     "9": "real_estate",
     "10": "food_service"
   }

4. TEMPLATES POR INDÚSTRIA:
   Para cada indústria definir:
   - focus: descrição do foco
   - executivos: 3 tipos de executivos específicos
   - specialties: 3 especializações do setor
   
   Exemplos:
   healthcare: {"focus": "saúde e bem-estar", 
               "executivos": ["COMERCIAL", "CLINICO", "OPERACIONAL"],
               "specialties": ["VENDAS", "ATENDIMENTO", "PROCESSOS"]}
   
   technology: {"focus": "tecnologia e inovação",
               "executivos": ["COMERCIAL", "TECNICO", "OPERACIONAL"], 
               "specialties": ["VENDAS", "DESENVOLVIMENTO", "PROCESSOS"]}
```

**Entrada:** project_path (opcional)  
**Saída:** Instância configurada com templates  
**Algoritmo Crítico:** Templates especializados por setor  

### 2️⃣ **collect_company_info(self)**
**Algoritmo de coleta interativa:**
```
1. EXIBIÇÃO INICIAL:
   - Cabeçalho "GERADOR DE EMPRESA VIRTUAL"
   - Mostrar pasta do projeto atual
   
2. COLETA DE NOME:
   - Input: nome da empresa
   - Validar não vazio (obrigatório)
   - Se vazio: sys.exit(1)
   
3. SELEÇÃO DE SETOR:
   - Exibir 10 indústrias numeradas
   - Input: escolha por número (1-10)
   - Validar escolha válida
   - Se inválido: sys.exit(1)
   
4. DESCRIÇÃO (OPCIONAL):
   - Input: descrição da empresa
   - Se vazio: gerar automático baseado no template da indústria
   - Formato: "Empresa especializada em {focus}"
   
5. ARMAZENAMENTO:
   self.company_info = {
     "name": company_name,
     "industry": industry_selecionada,
     "description": description_final,
     "creation_date": timestamp_ISO,
     "project_path": str(self.project_path),
     "personas_count": 16  # fixo
   }
   
6. CONFIRMAÇÃO:
   - Exibir resumo da configuração
   - Retornar True para sucesso
```

**Entrada:** Inputs interativos do usuário  
**Saída:** self.company_info populado  
**Funcionalidade Crítica:** Validação rigorosa e auto-geração  

### 3️⃣ **generate_personas(self)**
**Algoritmo COMPLEXO de geração das 16 personas:**
```
1. INICIALIZAÇÃO:
   - Obter company_name, industry, template da indústria
   - Inicializar personas = {}
   
2. CRIAR CEO (1 persona):
   ceo = {
     "name": "Maria Silva",  # nome fixo
     "role": "CEO",
     "department": "CEO",
     "level": "C-Level",
     "responsibilities": [4 responsabilidades estratégicas],
     "skills": [4 habilidades executivas]
   }
   personas["CEO"] = {"Maria_Silva_CEO": ceo}
   
3. CRIAR EXECUTIVOS (3 personas):
   - Nomes fixos: ["Carlos Santos", "Ana Costa", "Pedro Oliveira"]
   - Roles do template: template["executivos"] (ex: COMERCIAL, CLINICO, OPERACIONAL)
   - Para cada (name, role):
     - Key: {Nome_normalizado}_EXECUTIVO_{ROLE}
     - Gerar persona com responsibilities e skills específicas da role
     - Adicionar ao personas["EXECUTIVOS"]
   
4. CRIAR ASSISTENTES (3 personas):
   - Nomes fixos: ["Julia Ferreira", "Lucas Pereira", "Sofia Lima"]
   - Vincular cada assistente a um executivo correspondente
   - Para cada (name, exec_role):
     - Key: {Nome_normalizado}_ASSISTENTE_{EXEC_ROLE}
     - Responsibilities: apoio ao executivo específico
     - Skills: organização + conhecimento da área executiva
     - Adicionar ao personas["ASSISTENTES"]
   
5. CRIAR ESPECIALISTAS (3 personas):
   - Nomes fixos: ["Roberto Mendes", "Camila Rocha", "Diego Alves"]
   - Specialties do template: template["specialties"]
   - Para cada (name, specialty):
     - Key: {Nome_normalizado}_ESPECIALISTA_{SPECIALTY}
     - Responsibilities: execução especializada + treinamento
     - Skills: especialização técnica + resolução problemas
     - Adicionar ao personas["ESPECIALISTAS"]
   
6. CRIAR SUPORTE (6 personas):
   support_data = [
     ("Fernanda Cruz", "CLIENTE", "Atendimento ao cliente"),
     ("Rafael Souza", "TECNICO", "Suporte técnico"),
     ("Beatriz Martins", "FINANCEIRO", "Suporte financeiro"),
     ("Thiago Barbosa", "RH", "Recursos humanos"),
     ("Larissa Gomes", "JURIDICO", "Suporte jurídico"),
     ("Gabriel Silva", "TI", "Tecnologia da informação")
   ]
   
   Para cada (name, role, area):
   - Key: {Nome_normalizado}_SUPORTE_{ROLE}
   - Responsibilities: suporte especializado + atendimento
   - Skills: conhecimento técnico + comunicação
   - Adicionar ao personas["SUPORTE"]

7. RETORNO:
   - Retornar dicionário personas completo (16 personas)
```

**Entrada:** self.company_info  
**Saída:** Dict com 16 personas organizadas por categoria  
**Algoritmo Crítico:** Estrutura fixa com nomes e roles padronizadas  

### 4️⃣ **create_folder_structure(self, personas)**
**Algoritmo ABRANGENTE de criação de estrutura:**
```
1. DEFINIÇÃO DE LOCALIZAÇÃO:
   - company_folder = project_path / "{company_name}_virtual_company"
   - Exibir localização de criação
   
2. CRIAÇÃO DE ESTRUTURA (12 pastas):
   folders = [
     "config",
     "personas/CEO",
     "personas/EXECUTIVOS", 
     "personas/ASSISTENTES",
     "personas/ESPECIALISTAS",
     "personas/SUPORTE",
     "workflows/comercial",
     "workflows/marketing",
     "workflows/operacional", 
     "workflows/suporte",
     "docs",
     "logs"
   ]
   
   Para cada folder:
   - Criar com folder_path.mkdir(parents=True, exist_ok=True)
   
3. SALVAR CONFIGURAÇÃO DA EMPRESA:
   - Arquivo: config/company_config.json
   - Conteúdo: self.company_info completo
   - Encoding: UTF-8, formato indentado
   
4. SALVAR PERSONAS POR CATEGORIA:
   Para cada (category, category_personas) em personas:
   - Pasta: personas/{category}/
   - Para cada (persona_key, persona_data):
     - Arquivo: {category}/{persona_key}.json
     - Conteúdo: persona_data individual
     - Encoding: UTF-8, formato indentado
   
5. CONFIGURAÇÃO GERAL DE PERSONAS:
   personas_config = {
     "company": company_name,
     "total_personas": 16,
     "categories": {
       "CEO": 1,
       "EXECUTIVOS": 3,
       "ASSISTENTES": 3, 
       "ESPECIALISTAS": 3,
       "SUPORTE": 6
     },
     "created_date": timestamp_ISO
   }
   - Salvar em: config/personas_config.json
   
6. DOCUMENTAÇÃO DA EMPRESA:
   company_profile = markdown_template com:
   - Informações gerais completas
   - Estrutura organizacional detalhada
   - Estrutura de arquivos (tree view)
   - Próximos passos orientativos
   - Salvar em: docs/EMPRESA_PROFILE.md
   
7. LOG DE CRIAÇÃO:
   log_entry = {
     "action": "company_creation",
     "company": company_name,
     "project_path": str(project_path),
     "company_folder": str(company_folder),
     "personas_created": 16,
     "timestamp": timestamp_ISO,
     "status": "success"
   }
   - Salvar em: logs/creation_log_{data}.json
   
8. RETORNO:
   - Retornar company_folder (Path)
```

**Entrada:** Dict de personas  
**Saída:** Estrutura completa criada + company_folder path  
**Algoritmo Crítico:** Organização completa com múltiplos formatos  

### 5️⃣ **generate_company(self)**
**Algoritmo MESTRE de orquestração:**
```
1. INICIALIZAÇÃO:
   - Exibir cabeçalho de início
   - Log da localização do projeto
   
2. PROCESSO SEQUENCIAL:
   Try:
   - ETAPA 1: Chamar collect_company_info()
     - Se falha: return False
     
   - ETAPA 2: Exibir "Gerando 16 personas..."
     - Chamar generate_personas() → personas
     
   - ETAPA 3: Exibir "Criando estrutura de arquivos..."
     - Chamar create_folder_structure(personas) → company_folder
   
   - ETAPA 4: Exibir relatório de sucesso:
     - Separador visual
     - Nome da empresa
     - Setor
     - Contagem de personas (16)
     - Localização final
     - Separador de fechamento
   
   - Return True (sucesso)
   
   Catch Exception:
   - Exibir erro detalhado
   - Return False (falha)
```

**Entrada:** Nenhuma (usa dados internos)  
**Saída:** Boolean de sucesso/falha  
**Funcionalidade Crítica:** Orquestração com error handling  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Templates de Indústria (10 setores):**
```python
industry_templates = {
    "healthcare": {
        "focus": "saúde e bem-estar",
        "executivos": ["COMERCIAL", "CLINICO", "OPERACIONAL"],
        "specialties": ["VENDAS", "ATENDIMENTO", "PROCESSOS"]
    },
    "technology": {
        "focus": "tecnologia e inovação", 
        "executivos": ["COMERCIAL", "TECNICO", "OPERACIONAL"],
        "specialties": ["VENDAS", "DESENVOLVIMENTO", "PROCESSOS"]
    },
    # ... 8 outros setores
}
```

### **Estrutura de Persona:**
```python
persona = {
    "name": "string",           # Nome fixo pré-definido
    "role": "string",           # Role específica 
    "department": "string",     # Categoria hierárquica
    "level": "string",          # Nível organizacional
    "responsibilities": [       # Lista de responsabilidades
        "string", "string", ...
    ],
    "skills": [                 # Lista de habilidades
        "string", "string", ...
    ]
}
```

### **Estrutura de Arquivos Gerada:**
```
{company_name}_virtual_company/
├── config/
│   ├── company_config.json      # Dados da empresa
│   └── personas_config.json     # Configuração de personas
├── personas/                    # 16 personas organizadas
│   ├── CEO/                     # 1 persona
│   ├── EXECUTIVOS/             # 3 personas
│   ├── ASSISTENTES/            # 3 personas
│   ├── ESPECIALISTAS/          # 3 personas
│   └── SUPORTE/                # 6 personas
├── workflows/                   # Fluxos de trabalho
│   ├── comercial/
│   ├── marketing/
│   ├── operacional/
│   └── suporte/
├── docs/
│   └── EMPRESA_PROFILE.md      # Documentação da empresa
└── logs/
    └── creation_log_{data}.json # Log de criação
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Integração a Projeto:**
- Criação DENTRO da pasta do projeto (não externa)
- Detecção automática do diretório atual se não especificado
- Estrutura auto-contida sem dependências externas

### 🔧 **Padronização Rigorosa:**
- **16 personas fixas** sempre na mesma estrutura
- **Nomes pré-definidos** para consistência
- **Hierarquia padronizada:** CEO → EXECUTIVOS → ASSISTENTES → ESPECIALISTAS → SUPORTE
- **Templates por setor** com roles específicas

### 🚀 **Especialização por Setor:**
- **10 indústrias** com templates específicos
- **Roles adaptadas** ao contexto do negócio (ex: CLINICO para healthcare)
- **Descrição automática** baseada no foco da indústria
- **Especialistas contextualizados** por setor

### 🛡️ **Robustez:**
- **Validação rigorosa** com sys.exit em caso de erro
- **Auto-geração** de descrição se não fornecida
- **Encoding UTF-8** consistente em todos os arquivos
- **Error handling** no processo principal

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import json          # Para arquivos de configuração
import os           # Para operações de sistema  
from pathlib import Path      # Para manipulação de paths
from datetime import datetime # Para timestamps
import sys          # Para validação e exit
```

**Estrutura de Arquivos:**
- JSON para configurações e dados de personas
- Markdown para documentação
- Estrutura de diretórios multi-nível
- Logs em formato JSON

**Compatibilidade:**
- Cross-platform com pathlib
- Encoding UTF-8 explícito
- Paths relativos ao projeto

---

## 📁 **FLUXO DE OPERAÇÃO**

### **Execução Padrão:**
```
1. Inicializar no diretório do projeto
2. Coletar nome da empresa e setor
3. Gerar 16 personas com templates específicos
4. Criar estrutura completa dentro do projeto  
5. Salvar configurações e documentação
6. Exibir relatório de sucesso
```

### **Estrutura Resultante:**
```
projeto_original/
├── codigo_projeto/
├── outros_arquivos/
└── {empresa}_virtual_company/    # ← Nova pasta criada
    ├── config/
    ├── personas/
    ├── workflows/
    ├── docs/
    └── logs/
```

---

## 🎯 **DIFERENÇAS DO FRAMEWORK GERAL**

| **Aspecto** | **Framework Geral** | **Project Generator** |
|-------------|---------------------|----------------------|
| **Localização** | Diretório externo separado | Dentro do projeto |
| **Personas** | Baseado em produtos/serviços | 16 personas fixas |
| **Nomes** | Gerados dinamicamente | Pré-definidos |
| **Indústrias** | 20 templates complexos | 10 setores específicos |
| **Estrutura** | 10 pastas principais | 5 pastas + subpastas |
| **Complexidade** | 1.107 linhas | 455 linhas |
| **Uso** | Empresas independentes | Integração a projetos |

---

## 🎉 **RESULTADO FINAL**

O algoritmo gera uma **EMPRESA VIRTUAL INTEGRADA** que:

✅ **Se integra perfeitamente** ao projeto hospedeiro  
✅ **Cria 16 personas padronizadas** com hierarquia clara  
✅ **Adapta-se ao setor** com templates especializados  
✅ **Organiza arquivos** em estrutura lógica  
✅ **Documenta automaticamente** todo o processo  
✅ **Prepara workflows** para implementação futura  

**Sistema pronto para:** integração transparente em qualquer projeto que precise de uma empresa virtual estruturada e padronizada.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Project Company Generator v1.0*  
*📊 Complexidade: 455 linhas, 16 personas fixas, 10 setores especializados*