# 🎯 ALGORITMO - Advanced Company Setup

**Arquivo:** `06_advanced_company_setup.py`  
**Função:** Formulário interativo avançado para criação de empresas virtuais  
**Linhas de Código:** 476  
**Versão:** 2.0.0 (INTERFACE ATIVA DO SISTEMA)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **FORMULÁRIO INTERATIVO AVANÇADO** para criação completa de empresas virtuais com configurações demográficas detalhadas e geração automática de biografias através da integração com `AutoBiografiaGenerator`.

### 🎯 **OBJETIVO PRINCIPAL:**
Criar interface amigável e interativa para coleta de configurações empresariais e demográficas, integrando-se ao sistema de geração automática de biografias para produzir empresas virtuais completas.

---

## 🏗️ **ARQUITETURA DE CLASSE**

### **AdvancedCompanySetup**
```python
class AdvancedCompanySetup:
    """Interface avançada de setup com formulário interativo"""
```

**Responsabilidade:** Coletar configurações detalhadas via interface interativa e orquestrar criação completa de empresa virtual com biografias automáticas.

---

## 🔧 **MÉTODOS FUNDAMENTAIS**

### 1️⃣ **__init__(self)**
**Algoritmo de inicialização de configurações:**
```
1. INTEGRAÇÃO COM GERADOR DE BIOGRAFIAS:
   self.bio_generator = AutoBiografiaGenerator()

2. CONFIGURAÇÃO DE NACIONALIDADES (6 opções):
   self.nacionalidades_opcoes = {
     "1": ("europeus", "🇪🇺 Europeus (França, Alemanha, Itália...)"),
     "2": ("latinos", "🌎 Latinos (Brasil, México, Argentina...)"),
     "3": ("asiaticos", "🌏 Asiáticos (Japão, Coreia, China...)"),
     "4": ("oriente_medio", "🕌 Oriente Médio (Emirados, Israel...)"),
     "5": ("balcas", "⛰️ Balcãs (Sérvia, Croácia, Bósnia...)"),
     "6": ("nordicos", "❄️ Nórdicos (Suécia, Noruega, Dinamarca...)")
   }

3. CONFIGURAÇÃO DE INDÚSTRIAS (10 opções):
   self.industrias_opcoes = {
     "1": ("tecnologia", "💻 Tecnologia e Software"),
     "2": ("financas", "💰 Finanças e Investimentos"),
     "3": ("saude", "🏥 Saúde e Biotecnologia"),
     "4": ("educacao", "🎓 Educação e Treinamento"),
     "5": ("ecommerce", "🛒 E-commerce e Retail"),
     "6": ("consultoria", "📊 Consultoria e Serviços"),
     "7": ("marketing", "📢 Marketing e Publicidade"),
     "8": ("alimentacao", "🍽️ Alimentação e Nutrição"),
     "9": ("sustentabilidade", "🌱 Sustentabilidade e Energia"),
     "10": ("entretenimento", "🎬 Entretenimento e Mídia")
   }

4. IDIOMAS EXTRAS DISPONÍVEIS:
   self.idiomas_extras = [
     "alemão", "italiano", "japonês", "coreano", "mandarim",
     "árabe", "russo", "hindi", "holandês", "sueco"
   ]
```

**Entrada:** Nenhuma  
**Saída:** Instância configurada com opções pré-definidas  
**Algoritmo Crítico:** Integração com gerador de biografias  

### 2️⃣ **collect_basic_info(self)**
**Algoritmo de coleta de informações empresariais:**
```
1. INTERFACE INTERATIVA:
   - Exibir cabeçalho "📋 INFORMAÇÕES BÁSICAS DA EMPRESA"
   
2. COLETA OBRIGATÓRIA (com validação):
   
   NOME DA EMPRESA:
   Loop while True:
   - Input: "🏢 Nome da empresa: "
   - Se vazio: "❌ Nome da empresa é obrigatório!"
   - Se válido: salvar e continuar
   
   DOMÍNIO:
   Loop while True:
   - Input: "🌐 Domínio da empresa: "
   - Se vazio: "❌ Domínio é obrigatório!"
   - Se válido: salvar e continuar
   
   INDÚSTRIA (seleção numerada):
   - Exibir lista de 10 opções com emojis
   - Loop até escolha válida (1-10)
   - Extrair código e descrição da indústria

3. COLETA OPCIONAL (com defaults):
   - Descrição: default baseado na indústria
   - Público-alvo: default genérico

4. RETORNO:
   return {
     "name": nome,
     "domain": dominio,
     "industry": industry_code,
     "industry_desc": industry_desc,
     "description": descricao,
     "target_audience": publico
   }
```

**Entrada:** Input do usuário via console  
**Saída:** Dict com informações básicas validadas  
**Funcionalidade Crítica:** Validação obrigatória + interface amigável  

### 3️⃣ **collect_demographic_info(self)**
**Algoritmo COMPLEXO de configuração demográfica:**
```
1. SELEÇÃO DE NACIONALIDADE:
   - Exibir 6 opções com emojis e descrições
   - Validar escolha (1-6)
   - Salvar código e descrição da nacionalidade

2. CONFIGURAÇÃO DO CEO:
   - Input: "O CEO será homem ou mulher? (H/M)"
   - Validar H ou M
   - Converter para "masculino" ou "feminino"

3. CONFIGURAÇÃO DE EXECUTIVOS:
   - executivos_homens: input com default=2, range 0-5
   - executivos_mulheres: input com default=2, range 0-5

4. CONFIGURAÇÃO DE ASSISTENTES (calculada):
   - total_executives = 1 + exec_homens + exec_mulheres
   - Sugerir assistentes = total_executives (1 para cada executivo)
   - assistentes_homens: input com default=2, range 0-8
   - assistentes_mulheres: input com default=calculado, range 0-8

5. CONFIGURAÇÃO DE ESPECIALISTAS (fixo em 6):
   - Exibir: "6 áreas fixas: HR, YouTube, Mídias Sociais, Marketing, Financeiro, Tecnologia"
   - especialistas_homens: input com default=3, range 0-6
   - especialistas_mulheres: input com default=3, range 0-6
   
   VALIDAÇÃO AUTOMÁTICA:
   total_espec = homens + mulheres
   Se total_espec != 6:
   - Mostrar aviso de ajuste automático
   - Se > 6: reduzir mulheres
   - Se < 6: aumentar mulheres para completar 6

6. RETORNO:
   return {
     "nacionalidade", "nacionalidade_desc", "ceo_genero",
     "executivos_homens", "executivos_mulheres",
     "assistentes_homens", "assistentes_mulheres", 
     "especialistas_homens", "especialistas_mulheres"
   }
```

**Entrada:** Input do usuário com validações  
**Saída:** Dict com distribuição demográfica configurada  
**Algoritmo Crítico:** Garantia de 6 especialistas + cálculo inteligente de assistentes  

### 4️⃣ **collect_language_info(self, nacionalidade: str)**
**Algoritmo de configuração de idiomas:**
```
1. IDIOMAS PADRÃO (sempre incluídos):
   idiomas_padrao = ["inglês", "espanhol", "português", "francês"]
   - Exibir lista com ✅

2. IDIOMAS REGIONAIS (baseado na nacionalidade):
   idiomas_regionais = self.bio_generator.idiomas_regionais[nacionalidade]
   - Exibir idiomas regionais que não estão nos padrão
   - Marcar com ✅

3. SELEÇÃO DE IDIOMAS EXTRAS:
   - Exibir lista numerada dos 10 idiomas extras
   - Input: "números separados por vírgula ou Enter para pular"
   
   PROCESSAMENTO:
   Se entrada vazia: sem idiomas extras
   Se não vazia:
   - Split por vírgula
   - Converter para números
   - Validar range (1-10)
   - Extrair nomes dos idiomas correspondentes
   - Evitar duplicatas

4. RETORNO:
   return [lista_de_idiomas_extras_selecionados]
```

**Entrada:** Nacionalidade + input do usuário  
**Saída:** Lista de idiomas extras  
**Funcionalidade Crítica:** Integração com sistema de idiomas do gerador  

### 5️⃣ **show_configuration_summary(self, config: Dict)**
**Algoritmo de exibição de resumo:**
```
1. CABEÇALHO ESTRUTURADO:
   - "📋 RESUMO DA CONFIGURAÇÃO"
   - Separador de 60 caracteres

2. INFORMAÇÕES EMPRESARIAIS:
   - Nome, domínio, indústria, descrição, público-alvo

3. INFORMAÇÕES DEMOGRÁFICAS:
   - Nacionalidade (com descrição)
   - CEO (gênero)

4. DISTRIBUIÇÃO DE PERSONAS (com cálculos):
   - CEO: sempre 1
   - Executivos: homens + mulheres = total
   - Assistentes: homens + mulheres = total
   - Especialistas: homens + mulheres = total
   
   CÁLCULO TOTAL:
   total_personas = 1 + sum(todas_as_categorias)

5. IDIOMAS EXTRAS (se existirem):
   - Lista dos idiomas extras selecionados

6. RODAPÉ:
   - Separador final
```

**Entrada:** Dict de configuração completa  
**Saída:** Exibição formatada no console  
**Funcionalidade Crítica:** Validação visual antes da confirmação  

### 6️⃣ **run_setup(self)**
**Algoritmo PRINCIPAL de orquestração:**
```
1. INICIALIZAÇÃO:
   self.show_welcome() # Tela de boas-vindas

2. COLETA SEQUENCIAL:
   company_info = self.collect_basic_info()
   demo_info = self.collect_demographic_info()
   idiomas_extras = self.collect_language_info(demo_info["nacionalidade"])

3. CONSOLIDAÇÃO:
   full_config = {
     **company_info,        # Merge info empresarial
     **demo_info,           # Merge info demográfica
     "idiomas_extras": idiomas_extras,
     "created_at": datetime.now().isoformat()
   }

4. CONFIRMAÇÃO:
   self.show_configuration_summary(full_config)
   
   Loop while True:
   - Input: "✅ Confirma esta configuração? (S/N)"
   - Validar S ou N
   - Se N: return None (cancelado)
   - Se S: continuar

5. RETORNO:
   return full_config  # Configuração confirmada
```

**Entrada:** Interação completa do usuário  
**Saída:** Dict configuração final ou None se cancelado  
**Algoritmo Crítico:** Fluxo completo com confirmação  

### 7️⃣ **create_company_with_bios(self, config: Dict, output_path: Path)**
**Algoritmo COMPLEXO de criação da empresa:**
```
1. CRIAÇÃO DA ESTRUTURA BASE:
   empresa_path = output_path / f"EMPRESA_{nome_normalizado}"
   empresa_path.mkdir(parents=True, exist_ok=True)

2. CRIAÇÃO DE ESTRUTURA ORGANIZACIONAL (9 pastas):
   pastas_estrutura = [
     "01_DOCUMENTACAO_GERAL",      # Documentação e políticas
     "02_SCRIPTS_AUTOMACAO",       # Scripts de processamento  
     "03_N8N_WORKFLOWS",           # Workflows de automação
     "04_PERSONAS_SCRIPTS_1_2_3",  # Personas e outputs
     "05_TEMPLATES_SISTEMA",       # Templates reutilizáveis
     "06_LOGS_E_RELATORIOS",       # Logs e relatórios
     "07_RAG_KNOWLEDGE_BASE",      # Base de conhecimento
     "08_EMAIL_TEMPLATES",         # Templates de email
     "09_TASKTODO_WORKFLOWS"       # Workflows TaskTodo
   ]
   
   Para cada pasta: criar diretório

3. GERAÇÃO DE PERSONAS COM BIOGRAFIAS:
   personas_config = self.bio_generator.generate_personas_config(config)
   self.bio_generator.save_personas_biografias(personas_config, empresa_path)

4. SALVAMENTO DE CONFIGURAÇÕES:
   - company_config.json: configuração completa da empresa
   - README_EMPRESA.md: via create_company_readme()

5. LOG DE RESULTADOS:
   - Path da empresa criada
   - Total de personas geradas
   - Path do config file

6. RETORNO:
   return empresa_path
```

**Entrada:** Configuração validada + path de output  
**Saída:** Path da empresa criada  
**Funcionalidade Crítica:** Integração completa com gerador de biografias  

### 8️⃣ **create_company_readme(self, config, personas_config, empresa_path)**
**Algoritmo de geração de documentação:**
```
1. CÁLCULO DE ESTATÍSTICAS:
   total_personas = count(todas_as_personas_em_todas_as_categorias)

2. ESTRUTURA DO README:
   # {nome_empresa}
   > **{descrição}**

3. SEÇÃO INFORMAÇÕES DA EMPRESA:
   - Domínio, indústria, público-alvo, demografia, total personas

4. SEÇÕES DE EQUIPE (dinâmicas baseadas nos dados):
   ### 👔 CEO
   - Nome e cargo do CEO
   
   ### 👨‍💼 Executivos  
   Para cada executivo: "- **Nome** - Cargo"
   
   ### 👨‍💼 Assistentes
   Para cada assistente: "- **Nome** - Cargo"
   
   ### 🎯 Especialistas
   Para cada especialista: "- **Nome** - Especialização"

5. ESTRUTURA DE ARQUIVOS:
   - Tree view ASCII da estrutura de 9 pastas

6. PRÓXIMOS PASSOS:
   - Checklist de implementação
   - Instruções para scripts 1-5
   - Status do projeto

7. SALVAMENTO:
   - Arquivo: README_EMPRESA.md
   - Encoding: UTF-8
```

**Entrada:** Config + personas + path da empresa  
**Saída:** README.md estruturado e salvo  
**Funcionalidade Crítica:** Documentação automática da empresa criada  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Configuração Completa:**
```python
full_config = {
    # Informações Empresariais
    "name": str,
    "domain": str, 
    "industry": str,
    "industry_desc": str,
    "description": str,
    "target_audience": str,
    
    # Informações Demográficas
    "nacionalidade": str,
    "nacionalidade_desc": str,
    "ceo_genero": str,
    "executivos_homens": int,
    "executivos_mulheres": int,
    "assistentes_homens": int,
    "assistentes_mulheres": int,
    "especialistas_homens": int,
    "especialistas_mulheres": int,
    
    # Extras
    "idiomas_extras": List[str],
    "created_at": str  # ISO timestamp
}
```

### **Estrutura de Output:**
```
EMPRESA_{NOME}/
├── 01_DOCUMENTACAO_GERAL/
├── 02_SCRIPTS_AUTOMACAO/
├── 03_N8N_WORKFLOWS/
├── 04_PERSONAS_SCRIPTS_1_2_3/  # Biografias geradas automaticamente
│   ├── executivos/
│   ├── assistentes/
│   └── especialistas/
├── 05_TEMPLATES_SISTEMA/
├── 06_LOGS_E_RELATORIOS/
├── 07_RAG_KNOWLEDGE_BASE/
├── 08_EMAIL_TEMPLATES/
├── 09_TASKTODO_WORKFLOWS/
├── company_config.json         # Configuração da empresa
├── personas_config.json        # Personas geradas
└── README_EMPRESA.md           # Documentação automática
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Interface Interativa:**
- **Menu numerado** para seleções fáceis
- **Validação em tempo real** de inputs
- **Defaults inteligentes** baseados em contexto
- **Confirmação visual** com resumo completo

### 🌍 **Configuração Demográfica Avançada:**
- **6 nacionalidades** com características específicas
- **Distribuição flexível** por gênero e categoria
- **Validação automática** de especialistas (fixo em 6)
- **Cálculo inteligente** de assistentes por executivos

### 📝 **Integração Automática:**
- **AutoBiografiaGenerator** para biografias
- **Estrutura padronizada** de 9 pastas
- **Documentação automática** via README
- **Configurações persistidas** em JSON

### 🔧 **Compatibilidade com Pipeline:**
- **Output pronto** para scripts 1-5
- **Estrutura organizacional** padronizada
- **Encoding UTF-8** consistente
- **Integration points** bem definidos

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os, json, sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
```

**Integração Interna:**
```python
from auto_biografia_generator import AutoBiografiaGenerator
```

**Função Principal:**
```python
def main():
    setup = AdvancedCompanySetup()
    config = setup.run_setup()
    
    if config:
        output_path = Path(__file__).parent.parent.parent / "output"
        empresa_path = setup.create_company_with_bios(config, output_path)
```

---

## 🎯 **STATUS NO SISTEMA**

### **Integração Ativa:**
✅ Referenciado por `company_setup_form.html`  
✅ Utilizado como interface principal de setup  
✅ Integração direta com AutoBiografiaGenerator  
✅ Output compatível com pipeline de scripts 1-5  

### **Funcionalidade em Produção:**
✅ Interface interativa funcionando  
✅ Validação de dados implementada  
✅ Geração automática de biografias  
✅ Estrutura organizacional padronizada  

---

## 🎉 **RESULTADO FINAL**

O algoritmo produz **EMPRESAS VIRTUAIS COMPLETAS** que:

✅ **Interface amigável** com validação em tempo real  
✅ **Configuração demográfica** flexível e inteligente  
✅ **Biografias automáticas** via integração  
✅ **Estrutura organizacional** padronizada  
✅ **Documentação automática** da empresa criada  
✅ **Pipeline pronto** para scripts de processamento  

**Sistema pronto para:** criação interativa de empresas virtuais completas com zero configuração manual.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Advanced Company Setup v2.0.0 (ATIVA)*  
*📊 Complexidade: 476 linhas, interface interativa, integração com biografias*