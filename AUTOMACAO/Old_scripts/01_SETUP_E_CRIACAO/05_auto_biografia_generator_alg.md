# 🎯 ALGORITMO - Auto Biografia Generator (VERSÃO ATIVA)

**Arquivo:** `05_auto_biografia_generator.py`  
**Função:** Gerador automático de biografias de personas com nomes únicos  
**Linhas de Código:** 539  
**Versão:** 1.0.0 (VERSÃO PRINCIPAL ATIVA DO SISTEMA)

---

## 📋 **VISÃO GERAL ALGORITMICA**

Este script é o **GERADOR AUTOMÁTICO ATIVO** utilizado pelo sistema VCM para criar biografias completas e detalhadas de personas com controle rigoroso de nomes únicos. É referenciado pelos APIs bridge e utilizado em produção para geração de biografias demográficamente diversificadas.

### 🎯 **OBJETIVO PRINCIPAL:**
Gerar biografias completas e únicas para personas de empresas virtuais, garantindo diversidade demográfica, nomes únicos por empresa, e biografias ricas em markdown para processamento posterior pelos scripts 1-5.

---

## 🏗️ **ARQUITETURA DE CLASSE**

### **AutoBiografiaGenerator**
```python
class AutoBiografiaGenerator:
    """Gerador automático de biografias com controle de unicidade"""
```

**Responsabilidade:** Gerar biografias demográficamente diversas com nomes únicos e configurações customizáveis por empresa.

---

## 🔧 **MÉTODOS FUNDAMENTAIS**

### 1️⃣ **__init__(self)**
**Algoritmo de inicialização complexa:**
```
1. CONTROLE DE NOMES ÚNICOS (NOVA FUNCIONALIDADE):
   self.nomes_usados: Set[str] = set()        # Controle de nomes completos
   self.combinacoes_usadas: Set[tuple] = set() # Controle de combinações

2. CONFIGURAÇÕES DEMOGRÁFICAS (6 regiões):
   self.nacionalidades = {
     "europeus": {
       "paises": [7 países europeus],
       "nomes_masculinos": [7 nomes],
       "nomes_femininos": [7 nomes], 
       "sobrenomes": [7 sobrenomes]
     },
     "latinos": {paises + nomes + sobrenomes latinos},
     "asiaticos": {paises + nomes + sobrenomes asiáticos},
     "oriente_medio": {paises + nomes + sobrenomes árabes},
     "balcas": {paises + nomes + sobrenomes balcânicos},
     "nordicos": {paises + nomes + sobrenomes nórdicos}
   }

3. IDIOMAS POR REGIÃO:
   self.idiomas_regionais = {
     "europeus": ["inglês", "francês", "alemão", "italiano", "espanhol"],
     "latinos": ["espanhol", "português", "inglês", "francês"],
     "asiaticos": ["inglês", "japonês", "coreano", "chinês", "tailandês"],
     "oriente_medio": ["inglês", "árabe", "hebraico", "turco"],
     "balcas": ["inglês", "sérvio", "croata", "bósnio", "esloveno"],
     "nordicos": ["inglês", "sueco", "norueguês", "dinamarquês", "finlandês"]
   }

4. TEMPLATES DE ESPECIALIDADES (5 áreas):
   self.especialidades = {
     "hr": "Recursos Humanos e Gestão de Talentos",
     "youtube": "Criação de Conteúdo e YouTube Marketing", 
     "midias_sociais": "Marketing Digital e Mídias Sociais",
     "marketing": "Marketing Estratégico e Growth Hacking",
     "financeiro": "Análise Financeira e Controladoria",
     "tecnologia": "Desenvolvimento de Sistemas e DevOps"
   }

5. TEMPLATES DE EDUCAÇÃO:
   self.educacao_templates = {
     "executivo": [4 opções de MBA e mestrado],
     "assistente": [4 opções de bacharelado],
     "especialista": {
       por especialidade: educação específica da área
     }
   }

6. CONFIGURAÇÃO DE ENCODING PARA WINDOWS:
   - Configurar locale se possível
   - Reconfigurar stdout/stderr para UTF-8
   - Tratamento de exceções silencioso
```

**Entrada:** Nenhuma  
**Saída:** Instância configurada com dados demográficos completos  
**Algoritmo Crítico:** Controle de unicidade + diversidade demográfica  

### 2️⃣ **generate_personas_config(self, company_config: Dict)**
**Algoritmo PRINCIPAL de geração de personas:**
```
1. RESET E CONFIGURAÇÃO:
   - reset_nomes_usados() # Limpar controle para nova empresa
   - Extrair configurações da empresa:
     - nacionalidade
     - ceo_genero  
     - exec_homens/mulheres
     - assist_homens/mulheres
     - espec_homens/mulheres
     - idiomas_extras

2. CONFIGURAÇÃO DE IDIOMAS:
   - idiomas_base = ["inglês", "espanhol", "português", "francês"]
   - idiomas_regionais = self.idiomas_regionais[nacionalidade]
   - todos_idiomas = set(base + regionais + extras)

3. GERAÇÃO DO CEO:
   ceo = self.generate_persona_bio(
     role="CEO",
     categoria="executivos", 
     genero=ceo_genero,
     nacionalidade=nacionalidade,
     idiomas=todos_idiomas,
     company_config=company_config,
     is_ceo=True
   )

4. GERAÇÃO DE EXECUTIVOS:
   Para i in range(exec_homens):
   - Gerar executivo masculino
   Para i in range(exec_mulheres):
   - Gerar executiva feminina
   
5. GERAÇÃO DE ASSISTENTES:
   Para i in range(assist_homens):
   - Gerar assistente masculino
   Para i in range(assist_mulheres):
   - Gerar assistente feminina

6. GERAÇÃO DE ESPECIALISTAS (6 áreas fixas):
   Para cada especialidade em self.especialidades.keys():
   - Determinar gênero baseado na distribuição
   - Gerar especialista com especialidade específica

7. LOG DE ESTATÍSTICAS:
   - Total de nomes únicos criados
   - Total de combinações únicas
   
8. RETORNO:
   - Dict completo com todas as personas organizadas
```

**Entrada:** Dict de configuração da empresa  
**Saída:** Dict com todas as personas geradas  
**Funcionalidade Crítica:** Distribuição demográfica configurável

### 3️⃣ **generate_unique_name(self, genero: str, nacionalidade: str, max_attempts: int = 50)**
**Algoritmo CRÍTICO de geração de nomes únicos:**
```
1. PREPARAÇÃO:
   - nac_data = self.nacionalidades[nacionalidade]
   
2. LOOP DE TENTATIVAS (até 50):
   Para attempt in range(max_attempts):
   
   SELEÇÃO POR GÊNERO:
   Se genero == "masculino":
   - primeiro_nome = random.choice(nac_data["nomes_masculinos"])
   Senão:
   - primeiro_nome = random.choice(nac_data["nomes_femininos"])
   
   COMPOSIÇÃO:
   - sobrenome = random.choice(nac_data["sobrenomes"])
   - nome_completo = f"{primeiro_nome} {sobrenome}"
   - combinacao = (primeiro_nome, sobrenome, nacionalidade)
   
   VERIFICAÇÃO DE UNICIDADE:
   Se nome_completo NOT IN self.nomes_usados AND combinacao NOT IN self.combinacoes_usadas:
   - Marcar como usado:
     - self.nomes_usados.add(nome_completo)
     - self.combinacoes_usadas.add(combinacao)
   - RETORNAR (primeiro_nome, sobrenome, nome_completo)

3. FALLBACK COM SUFIXO:
   Se não conseguiu nome único em 50 tentativas:
   Para i in range(1, 100):
   - nome_com_sufixo = f"{primeiro_nome} {sobrenome} {chr(65+i)}"  # A, B, C...
   - Se único: adicionar e retornar

4. FALLBACK FINAL:
   - timestamp = últimos 3 dígitos do timestamp atual
   - nome_final = f"{primeiro_nome} {sobrenome}{timestamp}"
   - Adicionar e retornar
```

**Entrada:** Gênero, nacionalidade, tentativas máximas  
**Saída:** Tupla (primeiro_nome, sobrenome, nome_completo)  
**Algoritmo Crítico:** Garantia absoluta de unicidade  

### 4️⃣ **generate_persona_bio(self, role, categoria, genero, nacionalidade, idiomas, company_config, is_ceo=False, especialidade=None)**
**Algoritmo COMPLEXO de geração de biografia:**
```
1. GERAÇÃO DE NOME ÚNICO:
   primeiro_nome, sobrenome, nome_completo = self.generate_unique_name(genero, nacionalidade)

2. DADOS DEMOGRÁFICOS:
   - nac_data = self.nacionalidades[nacionalidade]
   
   IDADE POR CATEGORIA:
   - is_ceo: 35-50 anos
   - executivos: 30-45 anos
   - assistentes: 25-35 anos
   - especialistas: 28-40 anos
   
   PAÍS DE ORIGEM:
   - pais_origem = random.choice(nac_data["paises"])

3. EDUCAÇÃO POR CATEGORIA:
   Se categoria == "executivos":
   - educacao = random.choice(self.educacao_templates["executivo"])
   Se categoria == "assistentes":
   - educacao = random.choice(self.educacao_templates["assistente"])
   Se categoria == "especialistas":
   - educacao = self.educacao_templates["especialista"][especialidade]

4. EXPERIÊNCIA E IDIOMAS:
   - anos_experiencia = max(idade - 22, 3)  # Mínimo 3 anos
   - num_idiomas = random(3, min(6, len(idiomas)))
   - idiomas_persona = random.sample(idiomas, num_idiomas)

5. ESPECIALIZAÇÃO POR CATEGORIA:
   - CEO: "Liderança Executiva e Gestão Estratégica"
   - Executivos: random.choice de 4 especializações
   - Assistentes: "Suporte Executivo e Gestão Administrativa"
   - Especialistas: self.especialidades[especialidade]

6. GERAÇÃO DE BIOGRAFIA MARKDOWN:
   biografia_md = self.generate_biografia_markdown(
     todos_os_dados_coletados
   )

7. RETORNO DE ESTRUTURA COMPLETA:
   return {
     "nome_completo", "primeiro_nome", "sobrenome",
     "idade", "genero", "pais_origem", "nacionalidade", 
     "role", "categoria", "especializacao",
     "educacao", "anos_experiencia", "idiomas",
     "biografia_md", "especialidade", "is_ceo"
   }
```

**Entrada:** Parâmetros completos da persona  
**Saída:** Dict completo com biografia em markdown  
**Algoritmo Crítico:** Síntese de todos os dados demográficos  

### 5️⃣ **generate_biografia_markdown(self, nome, idade, pais, role, especializacao, educacao, experiencia, idiomas, company_config)**
**Algoritmo de geração de biografia estruturada:**
```
1. EXTRAÇÃO DE DADOS DA EMPRESA:
   - empresa_nome = company_config["name"]
   - industria = company_config["industry"]

2. DETERMINAÇÃO DE PRONOME:
   - Verificar nomes masculinos no nome para determinar pronome
   - genero_pronome = "ele" ou "ela"

3. GERAÇÃO DE MARKDOWN ESTRUTURADO:
   biografia = f"""
   # {nome}

   ## INFORMACOES BASICAS
   - Nome, idade, nacionalidade, cargo, especialização

   ## FORMACAO ACADEMICA
   {educacao}

   ## EXPERIENCIA PROFISSIONAL
   - {experiencia} anos de experiência
   - Competências desenvolvidas (5 bullet points)

   ## COMPETENCIAS LINGUISTICAS
   - Lista de idiomas

   ## RESPONSABILIDADES NA {empresa}
   - 5 responsabilidades específicas baseadas no role

   ## COMPETENCIAS TECNICAS
   - 5 competências técnicas

   ## COMPETENCIAS COMPORTAMENTAIS
   - 6 soft skills

   ## OBJETIVOS E METAS
   - Objetivos específicos baseados na especialização e indústria
   
   ---
   *Biografia gerada automaticamente*
   *Data: {timestamp}*
   """

4. RETORNO:
   - String completa em markdown formatado
```

**Entrada:** Dados completos da persona + config da empresa  
**Saída:** String markdown formatada  
**Funcionalidade Crítica:** Biografia estruturada pronta para processamento  

### 6️⃣ **save_personas_biografias(self, personas_config, output_path)**
**Algoritmo de salvamento estruturado:**
```
1. CRIAÇÃO DE ESTRUTURA:
   Para cada categoria em personas_config:
   
   TRATAMENTO ESPECIAL DO CEO:
   Se categoria == "ceo":
   - cat_path = output_path / "04_PERSONAS_SCRIPTS_1_2_3" / "executivos"
   - Criar pasta com nome da persona
   - Salvar biografia em {nome}_bio.md
   
   OUTRAS CATEGORIAS:
   - cat_path = output_path / "04_PERSONAS_SCRIPTS_1_2_3" / categoria
   - Para cada persona na categoria:
     - Criar pasta individual
     - Salvar biografia individual

2. SALVAMENTO DE CONFIGURAÇÃO:
   - config_file = output_path / "personas_config.json"
   - Salvar personas_config completo em JSON
   - Encoding UTF-8 com formatação indentada

3. LOG DE ESTATÍSTICAS:
   - Total de arquivos salvos
   - Total de nomes únicos gerados
```

**Entrada:** Dict de personas + path de output  
**Saída:** Arquivos de biografia salvos + config JSON  
**Funcionalidade Crítica:** Estrutura compatível com scripts 1-5  

---

## 📊 **ESTRUTURAS DE DADOS**

### **Configuração Demográfica (6 regiões):**
```python
nacionalidades = {
    "región": {
        "paises": [lista_de_países],
        "nomes_masculinos": [7_nomes],
        "nomes_femininos": [7_nomes],
        "sobrenomes": [7_sobrenomes]
    }
}
# Total: 6 regiões × 7 países × 14 nomes × 7 sobrenomes = 5.880 combinações base
```

### **Templates de Educação:**
```python
educacao_templates = {
    "executivo": [4_opções_MBA_mestrado],
    "assistente": [4_opções_bacharelado],
    "especialista": {
        especialidade: educação_específica_da_área
    }
}
```

### **Estrutura de Persona Final:**
```python
persona = {
    "nome_completo": str,
    "primeiro_nome": str,
    "sobrenome": str,
    "idade": int,
    "genero": str,
    "pais_origem": str,
    "nacionalidade": str,
    "role": str,
    "categoria": str,
    "especializacao": str,
    "educacao": str,
    "anos_experiencia": int,
    "idiomas": List[str],
    "biografia_md": str,  # Markdown completo
    "especialidade": str,
    "is_ceo": bool
}
```

---

## ⚡ **FUNCIONALIDADES CRÍTICAS**

### 🎯 **Controle de Unicidade:**
- **Nomes únicos** garantidos por empresa através de Sets
- **Combinações únicas** (nome + sobrenome + nacionalidade)
- **Fallbacks robustos** com sufixos e timestamps
- **Reset automático** para novas empresas

### 🌍 **Diversidade Demográfica:**
- **6 regiões** com características específicas
- **Idiomas regionais** adequados à origem
- **Nomes culturalmente apropriados** por região
- **Distribuição configurável** por gênero

### 📝 **Biografia Rica:**
- **Markdown estruturado** em 8 seções
- **Dados contextualizados** à empresa e indústria
- **Experiência calculada** baseada na idade
- **Competências específicas** por categoria

### 🔧 **Compatibilidade com Pipeline:**
- **Output estruturado** para scripts 1-5
- **Encoding UTF-8** consistente
- **Estrutura de pastas** padronizada
- **Config JSON** para processamento posterior

---

## 🔧 **DEPENDÊNCIAS TÉCNICAS**

**Bibliotecas Python:**
```python
import os, sys, json, random
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Set
```

**Configurações de Sistema:**
- Configuração de locale para Windows
- Reconfiguração de stdout/stderr para UTF-8
- Tratamento de encoding silencioso

**Estrutura de Output:**
```
output_path/
├── 04_PERSONAS_SCRIPTS_1_2_3/
│   ├── executivos/
│   │   └── {Nome_da_Persona}/
│   │       └── {Nome_da_Persona}_bio.md
│   ├── assistentes/
│   ├── especialistas/
│   └── suporte/
└── personas_config.json
```

---

## 🎯 **STATUS NO SISTEMA**

### **Integração Ativa:**
✅ Referenciado por `api_bridge.py`  
✅ Referenciado por `api_bridge_llm.py`  
✅ Referenciado por `api_bridge_real.py`  
✅ Documentado em `README-DASHBOARD.md`  
✅ Utilizado pelos APIs route.ts  

### **Funcionalidade em Produção:**
✅ Geração de biografias para empresas reais  
✅ Controle de unicidade funcionando  
✅ Output compatível com pipeline de scripts  
✅ Diversidade demográfica implementada  

---

## 🎉 **RESULTADO FINAL**

O algoritmo produz **BIOGRAFIAS ÚNICAS E RICAS** que:

✅ **Garantem unicidade absoluta** de nomes por empresa  
✅ **Respeitam diversidade demográfica** configurável  
✅ **Geram biografias estruturadas** em markdown  
✅ **Compatibilizam com pipeline** de scripts 1-5  
✅ **Integram perfeitamente** aos APIs do sistema  
✅ **Suportam configuração flexível** por empresa  

**Sistema pronto para:** produção completa como gerador principal de biografias do VCM.

---

*📅 Algoritmo documentado em: 2024-12-19*  
*🔄 Versão do Sistema: Auto Biografia Generator v1.0.0 (ATIVA)*  
*📊 Complexidade: 539 linhas, controle de unicidade, 6 regiões demográficas*
        - nacionalidade
        - ceo_genero
        - quantidades por categoria e gênero
        - idiomas_extras
    
    CRIAR array personas_completas vazio
    
    // CEO sempre primeiro
    GERAR CEO:
        nome, sobrenome, pais = generate_unique_name(ceo_genero, nacionalidade)
        biografia = generate_persona_bio("CEO", "executivos", ceo_genero, nacionalidade)
        ADICIONAR {nome, biografia, is_ceo: true} em personas_completas
    
    // Executivos restantes
    PARA cada executivo (total - 1):
        DETERMINAR gênero baseado nas quantidades
        GERAR nome único
        GERAR biografia
        ADICIONAR em personas_completas
    
    // Especialistas
    DEFINIR areas = ["hr", "youtube", "midias_sociais", "marketing", "financeiro", "tecnologia"]
    PARA cada especialista:
        DETERMINAR gênero
        SELECIONAR area da lista
        GERAR nome único  
        GERAR biografia com especialização
        ADICIONAR em personas_completas
    
    // Assistentes
    PARA cada assistente:
        DETERMINAR gênero
        GERAR nome único
        GERAR biografia
        ADICIONAR em personas_completas
    
    RETORNAR {"personas": personas_completas}
FIM FUNÇÃO
```

#### 3. GERAÇÃO DE NOME ÚNICO
```
FUNÇÃO generate_unique_name(genero, nacionalidade, max_attempts=50):
    PARA tentativa de 1 até max_attempts:
        SELECIONAR nome_aleatorio dos nomes da nacionalidade/gênero
        SELECIONAR sobrenome_aleatorio dos sobrenomes da nacionalidade
        SELECIONAR pais_aleatorio dos países da nacionalidade
        
        combinacao = (nome, sobrenome, pais)
        
        SE combinacao NÃO está em combinacoes_usadas:
            ADICIONAR combinacao em combinacoes_usadas
            ADICIONAR nome em nomes_usados
            RETORNAR (nome, sobrenome, pais)
        FIM SE
    FIM PARA
    
    // Se não conseguiu nome único, usar com sufixo
    GERAR nome com sufixo numérico
    RETORNAR nome modificado
FIM FUNÇÃO
```

#### 4. GERAÇÃO DE BIOGRAFIA
```
FUNÇÃO generate_persona_bio(role, categoria, genero, nacionalidade, especializacao=None):
    nome, sobrenome, pais = generate_unique_name(genero, nacionalidade)
    
    CALCULAR idade:
        SE categoria == "executivos": idade = random(35, 55)
        SE categoria == "especialistas": idade = random(28, 45)  
        SE categoria == "assistentes": idade = random(22, 35)
    
    SELECIONAR educacao baseada na categoria e especialização
    
    GERAR idiomas:
        idiomas_base = ["inglês", "espanhol", "português", "francês"]
        ADICIONAR idiomas regionais da nacionalidade
        EMBARALHAR e selecionar 3-4 idiomas
    
    biografia_markdown = generate_biografia_markdown(
        nome, idade, pais, educacao, idiomas, especializacao
    )
    
    RETORNAR {
        nome, sobrenome, idade, pais, biografia_markdown,
        categoria, especializacao, idiomas
    }
FIM FUNÇÃO
```

#### 5. GERAÇÃO DE MARKDOWN
```
FUNÇÃO generate_biografia_markdown(nome, idade, pais, educacao, idiomas, especializacao):
    CRIAR template markdown:
        # {nome}
        ## Informações Pessoais
        - **Idade:** {idade} anos
        - **País:** {pais}
        - **Educação:** {educacao}
        - **Idiomas:** {idiomas}
        
        ## Biografia Profissional
        [Texto narrativo baseado na especialização e experiência]
        
        ## Competências
        [Lista de habilidades relevantes]
    
    RETORNAR markdown formatado
FIM FUNÇÃO
```

#### 6. SALVAMENTO DE ARQUIVOS
```
FUNÇÃO save_personas_biografias(personas_config, output_path):
    // Salvar JSON principal
    ESCREVER personas_config em "personas_config.json"
    
    // Salvar biografias individuais
    PARA cada persona em personas_config["personas"]:
        categoria = persona["categoria"]
        nome_arquivo = f"{persona['nome']}_{persona['sobrenome']}.md"
        caminho = output_path / categoria / nome_arquivo
        
        CRIAR diretório se não existir
        ESCREVER biografia_markdown no arquivo
    FIM PARA
FIM FUNÇÃO
```

### Dependências
- `os`, `sys`, `json`: Operações de sistema e JSON
- `random`: Geração aleatória de nomes e idades
- `pathlib.Path`: Manipulação de caminhos
- `datetime`: Cálculos de data
- `typing`: Type hints

### Estruturas de Dados

#### Entrada company_config:
```json
{
  "nacionalidade": "latinos",
  "ceo_genero": "masculino", 
  "executivos_homens": 2,
  "executivos_mulheres": 2,
  "assistentes_homens": 2,
  "assistentes_mulheres": 3,
  "especialistas_homens": 3, 
  "especialistas_mulheres": 3,
  "idiomas_extras": ["alemão", "japonês"]
}
```

#### Saída personas_config:
```json
{
  "personas": [
    {
      "nome": "Ricardo",
      "sobrenome": "Santos", 
      "idade": 45,
      "pais": "Brasil",
      "categoria": "executivos",
      "is_ceo": true,
      "biografia_markdown": "# Ricardo Santos...",
      "idiomas": ["português", "inglês", "espanhol"],
      "especializacao": null
    }
  ]
}
```

### Fluxo de Execução
1. Receber configuração da empresa
2. Resetar controle de nomes únicos
3. Gerar CEO primeiro
4. Gerar executivos restantes
5. Gerar especialistas com suas áreas
6. Gerar assistentes
7. Salvar JSON principal e arquivos markdown individuais
8. Retornar configuração completa

### Características Especiais
- **Controle de unicidade:** Nenhum nome é repetido
- **Demografias realistas:** Nomes/países coerentes
- **Idiomas contextuais:** Baseados na nacionalidade  
- **Educação direcionada:** Templates por categoria/especialização
- **Idades apropriadas:** Faixas por nível hierárquico