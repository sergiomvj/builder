# 📖 VCM - MANUAL DO USUÁRIO

**Virtual Company Manager - Guia Completo para Usuários**

**Versão:** 2.0.0  
**Última Atualização:** 29 de Novembro de 2025

---

## 🎯 BEM-VINDO AO VCM!

O Virtual Company Manager (VCM) permite criar e gerenciar **empresas virtuais completas** com equipes de personas AI realistas e autônomas.

### O que você pode fazer:

✅ **Criar empresas virtuais** com estrutura organizacional completa  
✅ **Gerar equipes diversas** com 8-15 personas realistas  
✅ **Automatizar biografias e competências** com AI  
✅ **Definir tarefas diárias/semanais/mensais** por cargo  
✅ **Gerar fotos profissionais** das personas com AI  
✅ **Gerenciar 12 subsistemas** de negócio  

---

## 📋 ÍNDICE

1. [Primeiros Passos](#primeiros-passos)
2. [Criando Sua Primeira Empresa](#criando-sua-primeira-empresa)
3. [Gerando Equipe Diversa](#gerando-equipe-diversa)
4. [Executando Scripts de Automação](#executando-scripts-de-automação)
5. [Trabalhando com Personas](#trabalhando-com-personas)
6. [Gerenciando Avatares](#gerenciando-avatares)
7. [12 Subsistemas VCM](#12-subsistemas-vcm)
8. [Boas Práticas](#boas-práticas)
9. [Solução de Problemas](#solução-de-problemas)
10. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🚀 PRIMEIROS PASSOS

### Requisitos

- **Navegador:** Chrome, Firefox, Safari ou Edge (atualizado)
- **Conexão:** Internet estável
- **Acesso:** Credenciais fornecidas pelo administrador (futuro)

### Acessando o Sistema

1. Abra seu navegador
2. Acesse: `http://localhost:3001` (desenvolvimento) ou `https://vcm.seudominio.com` (produção)
3. Você verá o **Dashboard** principal

### Interface Principal

```
┌────────────────────────────────────────────────────┐
│  SIDEBAR NAVIGATION                                │
│  ├─ 📊 Dashboard                                   │
│  ├─ 🏢 Empresas (3 ativas)                        │
│  ├─ 👥 Personas (45 total)                        │
│  ├─ 🖼️ Avatares                                   │
│  ├─── 12 SUBSISTEMAS VCM ───                      │
│  ├─ 👤 Gestão de Personas                         │
│  ├─ 🎯 Tarefas e Metas                            │
│  ├─ 🔍 Prospecção                                 │
│  ├─ 💬 Comunicação                                │
│  ├─ 💰 Financeiro                                 │
│  ├─ 👨‍💼 Recursos Humanos                           │
│  ├─ 📈 Marketing                                  │
│  ├─ 💼 Vendas                                     │
│  ├─ 🎧 Suporte                                    │
│  ├─ 💻 Tecnologia                                 │
│  ├─ 📊 Analytics                                  │
│  └─ 📝 Documentação                               │
└────────────────────────────────────────────────────┘
```

---

## 🏢 CRIANDO SUA PRIMEIRA EMPRESA

### Passo 1: Abrir o Formulário

1. Clique em **"Empresas"** no menu lateral
2. Clique no botão **"+ Nova Empresa"** (canto superior direito)
3. O formulário será aberto em modal

### Passo 2: Informações Básicas

**Nome da Empresa** *  
Ex: `TechVision Solutions`

**Código Identificador** *  
Ex: `TECH001` (único, será usado para identificação interna)

**Domínio da Empresa**  
Ex: `https://techvision.com`  
💡 **Dica:** O domínio será usado para gerar emails das personas (ex: `john.smith@techvision.com`)

**Descrição** *  
Mínimo 10 caracteres. Descreva:
- Ramo de atuação
- Missão da empresa
- Principais produtos/serviços

**Exemplo:**
```
TechVision Solutions é uma empresa de tecnologia especializada em 
desenvolvimento de software empresarial. Nossa missão é transformar 
processos complexos em soluções digitais intuitivas e eficientes.
Oferecemos consultoria em transformação digital, desenvolvimento 
de aplicações web e mobile, e integração de sistemas.
```

### Passo 3: Composição de Nacionalidades

**⚠️ IMPORTANTE:** O total das nacionalidades **DEVE SOMAR EXATAMENTE 100%**

Use os **sliders** para definir a distribuição:

```
🇺🇸 Americanos:   40% ████████░░
🇧🇷 Brasileiros:  30% ██████░░░░
🇪🇺 Europeus:     20% ████░░░░░░
🇯🇵 Asiáticos:    10% ██░░░░░░░░
─────────────────────────────────
Total:           100% ✅
```

**Nacionalidades disponíveis:**
- 🇺🇸 Americanos
- 🇧🇷 Brasileiros
- 🇪🇺 Europeus
- 🇸🇪 Nórdicos
- 🇯🇵 Asiáticos
- 🇷🇺 Russos
- 🇿🇦 Africanos
- 🇲🇽 Latinos

💡 **Como funciona:** A AI usará essas proporções para gerar nomes autênticos e realistas para cada nacionalidade.

### Passo 4: Configurações

**Indústria** *  
- Tecnologia
- Saúde
- Educação
- Financeiro

**País** *  
- Brasil (BR)
- Estados Unidos (US)

**Status**  
- Ativa (padrão)
- Inativa
- Processando

### Passo 5: Salvar

1. Revise todas as informações
2. Certifique-se que nacionalidades somam 100%
3. Clique em **"Criar Empresa"**
4. Aguarde a confirmação ✅

---

## 👥 GERANDO EQUIPE DIVERSA

Após criar a empresa, você será automaticamente direcionado para o **Gerador de Equipe Diversa**.

### O que será criado:

**Equipe padrão de 8-12 personas** incluindo:

#### Estrutura Hierárquica:

**1. Liderança (1-2 pessoas)**
- CEO ou Founder
- Gênero: Configurável (masculino/feminino)

**2. Executivos (4-6 pessoas)**
- CTO, CFO, CMO, etc.
- Distribuição de gênero: 50/50 (configurável)

**3. Especialistas (4-6 pessoas)**
- Gerentes, Analistas, Coordenadores
- Distribuição de gênero: configurável

### Diversidade Garantida:

✅ **Tipos Corporais:**
- Magro, Atlético, Médio, Sobrepeso, Obeso
- Distribuição realista e diversa

✅ **Faixas Etárias:**
- Jovens profissionais (20-30 anos) - Júnior
- Adultos (30-45 anos) - Pleno/Sênior
- Maduros (45-60 anos) - Executivos

✅ **Etnias:**
- Branca, Negra, Parda, Asiática, Indígena
- Baseado nas nacionalidades configuradas

✅ **Gêneros:**
- Distribuição configurável
- Padrão: 50% masculino, 50% feminino

### Gerando a Equipe:

1. **Confirme a geração** clicando em "Gerar Equipe Diversa"
2. **Aguarde 20-40 segundos** enquanto o sistema:
   - Cria as personas no banco de dados
   - Define cargos e hierarquia
   - Atribui emails corporativos
3. **Veja a lista** de personas criadas
4. Clique em **"Ver Personas"** para visualizar

---

## 🤖 EXECUTANDO SCRIPTS DE AUTOMAÇÃO

Após criar a equipe, execute os **7 scripts em sequência** para gerar todo o conteúdo.

### Localização dos Scripts

**Via Terminal:**
```bash
cd AUTOMACAO
```

### Sequência Obrigatória:

#### **Script 00: Gerar Aparência Física**

**O que faz:** Cria descrição detalhada da aparência física de cada persona

**Como executar:**
```bash
node 00_generate_avatares.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~2 minutos (15 personas × 8 segundos)  
**Output:** Salva em `personas_avatares` (physical_appearance, body_type, ethnicity)

**O que é gerado:**
- Altura, peso, tipo corporal
- Cor de pele, cabelo, olhos
- Características distintivas
- Traços de personalidade

---

#### **Script 01: Gerar Biografias**

**O que faz:** Cria biografia profissional completa e resumida

**Como executar:**
```bash
node 01_generate_biografias_REAL.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~3 minutos  
**Output:** 
- `personas_avatares` (biografia_completa, biografia_resumida)
- `04_BIOS_PERSONAS_REAL/*.json`

**Conteúdo da biografia:**
- História profissional (3-5 parágrafos)
- Formação acadêmica
- Experiências anteriores
- Conquistas relevantes
- Motivações e objetivos atuais

**Exemplo de saída:**
```markdown
# John Smith - SDR Junior

John Smith iniciou sua carreira em vendas aos 22 anos, após 
concluir bacharelado em Administração pela University of Texas...

## Experiência Profissional
- 2023-Atual: SDR Junior na TechVision Solutions
- 2021-2023: Sales Intern na SaaS Startup Inc.

## Formação
- Bachelor in Business Administration - UT Austin (2021)
- Salesforce Certified Administrator (2023)
```

---

#### **Script 02: Gerar Competências + Subsistemas + Tarefas**

**✨ NOVO! Integrado com 12 Subsistemas VCM**

**O que faz:** Gera competências técnicas e comportamentais alinhadas aos subsistemas VCM, com tarefas diárias/semanais/mensais

**Como executar:**
```bash
node 02_generate_competencias_vcm.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~5 minutos  
**Output:** `competencias_output/*.json`

**O que é gerado por persona:**

1. **Subsistemas VCM obrigatórios** para o cargo
   - Ex: SDR Junior → PROSPECÇÃO, COMUNICAÇÃO, DOCUMENTAÇÃO

2. **Competências técnicas** por subsistema
   - Ex: LinkedIn Sales Navigator, CRM Salesforce, BANT

3. **Competências comportamentais**
   - Ex: Resiliência, Comunicação persuasiva

4. **Ferramentas obrigatórias**
   - Ex: Salesforce, Outreach.io, ZoomInfo

5. **Tarefas diárias** (3-5 por subsistema)
   - Ex: "Pesquisar 50 leads qualificados no LinkedIn"

6. **Tarefas semanais** (3-5 por subsistema)
   - Ex: "Análise de taxa de conversão de prospecção"

7. **Tarefas mensais** (2-4 por subsistema)
   - Ex: "Relatório mensal de pipeline gerado"

**Exemplo para SDR Junior:**
```json
{
  "subsistemas_vcm": ["PROSPECAO", "COMUNICACAO", "DOCUMENTACAO"],
  "competencias_subsistemas": [
    {
      "subsistema": "PROSPECAO",
      "nivel_dominio": "Intermediário",
      "competencias_tecnicas": [
        "LinkedIn Sales Navigator",
        "CRM Salesforce",
        "Qualificação BANT",
        "Cold Calling",
        "Email Sequencing"
      ],
      "tarefas_diarias": [
        "Pesquisar 50 leads qualificados",
        "Enviar 30 conexões no LinkedIn",
        "Realizar 30-40 calls de prospecção",
        "Enviar 40 emails personalizados",
        "Atualizar CRM com interações"
      ],
      "tarefas_semanais": [
        "Análise de taxa de conversão",
        "Meeting 1:1 com SDR Manager",
        "Revisão e ajuste de ICP",
        "A/B testing de mensagens"
      ],
      "tarefas_mensais": [
        "Relatório de prospecção mensal",
        "Otimização de cadências",
        "Treinamento em novas técnicas",
        "Análise de pipeline gerado"
      ]
    }
  ]
}
```

---

#### **Script 03: Gerar Especificações Técnicas**

**O que faz:** Detalhamento técnico de ferramentas e certificações

**Como executar:**
```bash
node 03_generate_tech_specs.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~3 minutos  
**Output:** `tech_specs_output/*.json`

**Conteúdo:**
- Stack tecnológico por cargo
- Certificações recomendadas
- Ferramentas por nível de proficiência
- Roadmap de aprendizado

---

#### **Script 04: Gerar Base de Conhecimento RAG**

**O que faz:** Cria base de conhecimento para cada cargo

**Como executar:**
```bash
node 04_generate_rag_knowledge.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~4 minutos  
**Output:** `06_RAG_KNOWLEDGE_BASE/*.json`

**Conteúdo:**
- FAQs do cargo
- Processos e workflows
- Best practices
- Troubleshooting comum
- Recursos de aprendizado

---

#### **Script 05: Gerar Fluxos SDR**

**O que faz:** Cria fluxos de trabalho para cargos de vendas/SDR

**Como executar:**
```bash
node 05_generate_fluxos_sdr.js --empresaId=SEU_ID_AQUI
```

**Tempo:** ~3 minutos  
**Output:** `fluxos_sdr_output/*.json` + tabela `fluxos_sdr`

**Conteúdo:**
- Cadências de email
- Scripts de cold call
- Sequências de LinkedIn
- Objeções e respostas
- KPIs e metas

---

#### **Script 06: Gerar Avatares Multimedia (Fotos AI)**

**✨ NOVO! Fotos profissionais com AI**

**O que faz:** Gera fotos profissionais realistas usando Fal.ai Flux-Pro

**Como executar:**
```bash
# Gerar todos os avatares (estilo casual)
node 06_generate_avatares_multimedia.js --empresaId=SEU_ID_AQUI --style=casual

# Gerar apenas 1 persona
node 06_generate_avatares_multimedia.js --empresaId=SEU_ID_AQUI --personaId=PERSONA_ID

# Gerar foto de equipe (3-5 pessoas)
node 06_generate_avatares_multimedia.js --empresaId=SEU_ID_AQUI --multi --style=corporate
```

**Parâmetros disponíveis:**
- `--style=casual|professional|creative|corporate` (default: casual)
- `--type=photo|video` (default: photo)
- `--service=fal|dalle|midjourney` (default: fal)
- `--multi` (flag para foto de equipe)
- `--personaId=UUID` (para gerar apenas 1)

**Tempo:** 5-10 segundos por foto  
**Custo:** ~$0.05 por imagem  
**Output:** 
- `avatares_multimedia` (URLs das fotos)
- `avatares_multimedia_output/log_*.json`

**Características das fotos:**
- ✅ Gênero correto (correlação precisa)
- ✅ Faixa etária correta (jovens 20+ permitidos)
- ✅ Roupas casuais/informais profissionais
- ✅ Alta qualidade (realismo fotográfico)
- ✅ Hospedadas em CDN (fal.media)

---

### 📊 Resumo da Execução Completa

**Tempo total:** ~20-30 minutos  
**Custo total:** ~$5-10  
**Resultado:** 15 personas totalmente completas com:

✅ Aparência física detalhada  
✅ Biografia profissional  
✅ Competências + Subsistemas + Tarefas diárias/semanais/mensais  
✅ Especificações técnicas  
✅ Base de conhecimento  
✅ Fluxos de trabalho  
✅ Fotos profissionais realistas  

---

## 🧑‍💼 TRABALHANDO COM PERSONAS

### Visualizando Personas

1. Clique em **"Personas"** no menu lateral
2. Veja a lista de todas as personas
3. **Filtros disponíveis:**
   - Por empresa
   - Por cargo
   - Por departamento

### Detalhes da Persona

Clique em qualquer persona para ver:

#### **Seção 1: Resumo Rápido**
```
👤 John Smith
📧 john.smith@techvision.com
💼 SDR Junior | Sales Development
🏢 TechVision Solutions
```

#### **Seção 2: Avatares Multimedia**
- Grid de fotos da persona
- Botões: Ver | Download
- Link para galeria completa

#### **Seção 3: Biografia Completa**
- História profissional
- Formação acadêmica
- Experiências anteriores
- Conquistas e objetivos

#### **Seção 4: Competências e Subsistemas**
- Subsistemas VCM atribuídos
- Competências técnicas por subsistema
- Competências comportamentais
- Ferramentas dominadas
- Tarefas diárias, semanais, mensais

#### **Seção 5: Dados de Automação**
- Scripts executados
- Status de cada script
- Logs de geração

### Editando Personas

**⚠️ Em desenvolvimento**

Por enquanto, edições são feitas via:
1. Scripts de automação (regenerar)
2. Diretamente no banco de dados (Supabase)

---

## 🖼️ GERENCIANDO AVATARES

### Galeria de Avatares

1. Clique em **"Avatares"** no menu lateral
2. Veja todos os avatares em grid

**Estatísticas no topo:**
```
📊 Total: 45 avatares
📷 Fotos: 42
🎥 Vídeos: 0
👥 Equipe: 3
```

### Filtros

**Por tipo:**
- Todos
- Fotos
- Vídeos
- Equipe (múltiplas personas)

**Busca:**
- Digite nome da persona
- Digite nome do arquivo
- Busca em tempo real

### Ações nos Avatares

**Ver (👁️)**  
- Abre a imagem em nova aba
- Visualização em tamanho completo

**Download (⬇️)**  
- Baixa a imagem
- Nome do arquivo: `PersonaName_style.jpg`

### Gerando Novos Avatares

**Via Terminal:**
```bash
cd AUTOMACAO

# Gerar todos (casual)
node 06_generate_avatares_multimedia.js --empresaId=UUID --style=casual

# Gerar 1 persona específica
node 06_generate_avatares_multimedia.js --empresaId=UUID --personaId=UUID --style=professional

# Gerar foto de equipe
node 06_generate_avatares_multimedia.js --empresaId=UUID --multi
```

**Estilos disponíveis:**
- **casual** - Jeans + blazer, polo, informal
- **professional** - Business casual, mais formal
- **creative** - Estilo moderno, trendy
- **corporate** - Terno, executivo

**💡 Recomendação:** Use `casual` para maioria dos casos (mais realista)

---

## 🔧 12 SUBSISTEMAS VCM

O VCM organiza competências e tarefas em **12 subsistemas de negócio**:

### 1. 👤 Gestão de Personas
**Descrição:** Criação e gestão de perfis de personas  
**Cargos:** HR Manager, CEO  
**Tarefas exemplo:**
- Revisar perfis de personas
- Atualizar dados biográficos
- Análise de performance

### 2. 🎯 Tarefas e Metas
**Descrição:** Gerenciamento de objetivos e KPIs  
**Cargos:** Todos (com níveis diferentes)  
**Tarefas exemplo:**
- Atualizar status de tarefas
- Review de metas semanais
- Análise de atingimento

### 3. 🔍 Prospecção de Leads
**Descrição:** Geração e qualificação de leads  
**Cargos:** SDR Junior, SDR Senior, SDR Manager  
**Tarefas exemplo:**
- Pesquisar 50 leads qualificados/dia
- Enviar 30 mensagens LinkedIn/dia
- Realizar 30-40 calls/dia
- Atualizar CRM

**📚 Veja o perfil completo:** `AUTOMACAO/05_TEMPLATES_SISTEMA/SDR_JUNIOR_PROFILE.md`

### 4. 💬 Comunicação e Colaboração
**Descrição:** Comunicação interna e externa  
**Cargos:** Todos  
**Tarefas exemplo:**
- Responder emails prioritários
- Participar de reuniões diárias
- Apresentações de status

### 5. 💰 Gestão Financeira
**Descrição:** Controle financeiro e orçamentário  
**Cargos:** CFO, Asst Fin, Financial Analyst  
**Tarefas exemplo:**
- Lançamentos contábeis
- Conciliação bancária
- Análise de fluxo de caixa
- Fechamento mensal

### 6. 👨‍💼 Recursos Humanos
**Descrição:** Gestão de pessoas e talentos  
**Cargos:** HR Manager, Asst RH  
**Tarefas exemplo:**
- Triagem de currículos
- Entrevistas
- Avaliações de desempenho
- People Analytics

### 7. 📈 Marketing e Growth
**Descrição:** Marketing digital e crescimento  
**Cargos:** Mkt Mgr, Social Mkt, YT Manager, Asst Mkt  
**Tarefas exemplo:**
- Monitorar campanhas
- Criar conteúdo
- Otimização de campanhas
- ROI analysis

### 8. 💼 Gestão de Vendas
**Descrição:** Pipeline e fechamento  
**Cargos:** Sales Rep, SDR Manager  
**Tarefas exemplo:**
- Calls de vendas
- Follow-up de propostas
- Pipeline review
- Forecast semanal

### 9. 🎧 Suporte ao Cliente
**Descrição:** Atendimento e satisfação  
**Cargos:** Support Specialist, Customer Success  
**Tarefas exemplo:**
- Responder tickets
- Monitorar SLA
- Análise de CSAT/NPS
- Knowledge base update

### 10. 💻 Tecnologia e Infraestrutura
**Descrição:** Desenvolvimento e infraestrutura  
**Cargos:** CTO, Tech Lead, Developer, DevOps  
**Tarefas exemplo:**
- Code review
- Deploy de features
- Sprint planning
- Architecture review

### 11. 📊 Analytics e BI
**Descrição:** Análise de dados e inteligência  
**Cargos:** Data Analyst, BI Specialist  
**Tarefas exemplo:**
- Monitorar dashboards
- Atualizar métricas
- Análises semanais
- Business reviews

### 12. 📝 Documentação e Conhecimento
**Descrição:** Gestão de conhecimento e processos  
**Cargos:** Todos (contribuição)  
**Tarefas exemplo:**
- Atualizar documentação
- Revisar processos
- Publicar SOPs
- Auditoria de docs

---

## ✅ BOAS PRÁTICAS

### 1. Planejamento da Empresa

**Antes de criar:**
- ✅ Defina claramente o ramo de atuação
- ✅ Pense na composição de nacionalidades desejada
- ✅ Considere a diversidade de gênero e tipos corporais
- ✅ Tenha o domínio da empresa (para emails)

### 2. Geração de Conteúdo

**Ordem dos scripts:**
- ✅ **SEMPRE** execute na sequência: 00 → 01 → 02 → 03 → 04 → 05 → 06
- ✅ Aguarde cada script finalizar antes do próximo
- ✅ Verifique os logs de cada execução
- ✅ Se houver erro, corrija e re-execute aquele script

### 3. Qualidade dos Avatares

**Para melhores resultados:**
- ✅ Use `--style=casual` (mais realista)
- ✅ Certifique-se que `gender` está correto na persona
- ✅ Verifique se `age_range` está definido
- ✅ Para fotos de equipe, use `--multi` com 3-5 personas

### 4. Organização

**Mantenha organizado:**
- ✅ Use códigos descritivos para empresas (ex: TECH001, SAUDE002)
- ✅ Salve backups dos JSONs gerados
- ✅ Documente alterações manuais
- ✅ Mantenha anotações sobre cada empresa

### 5. Performance

**Otimize o uso:**
- ✅ Não execute múltiplos scripts simultaneamente
- ✅ Respeite os tempos de espera (rate limiting)
- ✅ Feche abas não utilizadas
- ✅ Use filtros para encontrar personas rapidamente

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Problema: "Nacionalidades devem somar 100%"

**Causa:** A soma dos percentuais não está em 100%  
**Solução:**
1. Revise os sliders
2. Ajuste até o total mostrar 100% em verde
3. Salve novamente

---

### Problema: "Nenhum avatar encontrado"

**Causa:** Avatares não foram gerados OU empresa ativa está diferente

**Solução:**
```bash
# 1. Verificar se avatares existem
cd AUTOMACAO
node check_avatares.js

# 2. Se não existem, gerar
node 06_generate_avatares_multimedia.js --empresaId=SEU_ID --style=casual

# 3. Verificar novamente
node check_avatares.js
```

---

### Problema: Script travou ou deu erro

**Solução:**
1. **Verifique a conexão com internet**
2. **Veja o erro no console:**
   - Erro de API Key? → Verifique `.env.local`
   - Erro de conexão Supabase? → Teste com `check_empresas.js`
   - Erro de timeout? → Re-execute o script
3. **Re-execute o script específico**
4. **Se persistir, execute apenas para 1 persona:**
   ```bash
   node SCRIPT.js --empresaId=UUID --personaId=PERSONA_ID
   ```

---

### Problema: Foto com gênero errado

**Causa:** Bug corrigido em 29/11/2025

**Solução:**
1. **Exclua os avatares problemáticos:**
   ```bash
   cd AUTOMACAO
   node delete_all_avatares.js
   ```

2. **Regenere com script corrigido:**
   ```bash
   node 06_generate_avatares_multimedia.js --empresaId=UUID --style=casual
   ```

3. **Verifique se agora está correto**

---

### Problema: Excluir empresa não remove avatares/fluxos

**Causa:** Cascade implementado em 29/11/2025

**Solução:**
- Se versão antiga: Atualize o código
- Se versão atual: Exclusão remove automaticamente:
  1. Avatares multimedia
  2. Fluxos SDR
  3. Personas
  4. Empresa

---

### Problema: Scripts lentos

**Causas possíveis:**
- Conexão lenta
- Rate limiting da API
- Muitas personas

**Soluções:**
- ✅ Aguarde pacientemente (é normal levar minutos)
- ✅ Não interrompa o processo
- ✅ Verifique se não há outros scripts rodando

---

## ❓ PERGUNTAS FREQUENTES

### Posso criar quantas empresas?

Sim, não há limite. Mas recomendamos:
- **Desenvolvimento:** 2-3 empresas para testes
- **Produção:** Quantas necessitar

---

### Quanto custa gerar uma empresa completa?

**Custos estimados (15 personas):**
- Google Gemini (biografias, competências): ~$2-3
- Fal.ai (avatares): 15 × $0.05 = $0.75
- **Total:** ~$5-10 por empresa completa

---

### Posso editar uma persona depois de criada?

**Atualmente:** Não há interface de edição completa

**Opções:**
1. **Regenerar** via scripts (sobrescreve)
2. **Editar no Supabase** (avançado)
3. **Aguardar** feature de edição (em desenvolvimento)

---

### Os avatares são pessoas reais?

**NÃO!** Todas as fotos são **100% geradas por AI** (Fal.ai Flux-Pro)

- ✅ Não violam privacidade de ninguém
- ✅ São únicas e originais
- ✅ Realismo fotográfico impressionante
- ✅ Diversidade garantida

---

### Posso usar as personas em projetos comerciais?

**Sim!** As personas e avatares gerados são de sua propriedade.

**Casos de uso:**
- Demonstrações de produtos B2B
- Treinamentos corporativos
- Protótipos de sistemas
- Simulações organizacionais

---

### Como backup dos dados?

**Automático:**
- Todos os JSONs são salvos em `AUTOMACAO/*_output/`
- Logs de execução em `log_*.json`

**Manual:**
1. Exportar do Supabase (SQL dump)
2. Copiar pasta `AUTOMACAO/*_output/`
3. Guardar em local seguro

---

### Posso integrar com outros sistemas?

**Sim!** Via API:
- `/api/empresas` - CRUD de empresas
- `/api/personas` - CRUD de personas
- `/api/automation` - Executar scripts

**Planejado:**
- Webhooks
- Integrações N8N
- API pública documentada

---

## 📚 RECURSOS ADICIONAIS

### Documentação Técnica

Para desenvolvedores, veja:
- `SYSTEM_DOCUMENTATION.md` - Arquitetura completa
- `README.md` - Setup e configuração
- Comentários inline nos scripts

### Templates e Exemplos

**Pasta:** `AUTOMACAO/05_TEMPLATES_SISTEMA/`
- `SDR_JUNIOR_PROFILE.md` - Perfil completo de SDR Junior

### Logs e Outputs

**Pastas:**
- `04_BIOS_PERSONAS_REAL/` - Biografias
- `competencias_output/` - Competências
- `tech_specs_output/` - Specs técnicas
- `06_RAG_KNOWLEDGE_BASE/` - Conhecimento
- `fluxos_sdr_output/` - Fluxos SDR
- `avatares_multimedia_output/` - Logs de avatares

### Suporte

**Em caso de dúvidas:**
1. Consulte este manual
2. Veja `SYSTEM_DOCUMENTATION.md`
3. Verifique logs de erro
4. Entre em contato com o administrador

---

## 🎓 TUTORIAIS RÁPIDOS

### Tutorial 1: Criar primeira empresa (5 min)

1. Clicar "Empresas" → "+ Nova Empresa"
2. Preencher nome, código, descrição
3. Ajustar nacionalidades (total = 100%)
4. Salvar
5. Confirmar "Gerar Equipe Diversa"
6. Aguardar criação das personas

---

### Tutorial 2: Executar todos os scripts (25 min)

```bash
cd AUTOMACAO

# Copiar ID da empresa (ex: 7761ddfd-0ecc-4a11-95fd-5ee913a6dd17)
EMPRESA_ID="SEU_ID_AQUI"

# Executar sequência
node 00_generate_avatares.js --empresaId=$EMPRESA_ID
node 01_generate_biografias_REAL.js --empresaId=$EMPRESA_ID
node 02_generate_competencias_vcm.js --empresaId=$EMPRESA_ID
node 03_generate_tech_specs.js --empresaId=$EMPRESA_ID
node 04_generate_rag_knowledge.js --empresaId=$EMPRESA_ID
node 05_generate_fluxos_sdr.js --empresaId=$EMPRESA_ID
node 06_generate_avatares_multimedia.js --empresaId=$EMPRESA_ID --style=casual
```

---

### Tutorial 3: Visualizar persona completa (2 min)

1. Clicar "Personas"
2. Escolher uma persona
3. Clicar no card
4. Navegar pelas seções:
   - Resumo
   - Avatares (fotos)
   - Biografia
   - Competências + Subsistemas + Tarefas
   - Dados de automação

---

### Tutorial 4: Baixar avatares (1 min)

1. Clicar "Avatares" no menu
2. Usar filtros se necessário
3. Hover sobre a imagem desejada
4. Clicar no botão "⬇️ Download"
5. Imagem será salva na pasta Downloads

---

## 🎯 PRÓXIMOS PASSOS

Agora que você domina o VCM:

1. ✅ **Crie sua primeira empresa**
2. ✅ **Gere a equipe diversa**
3. ✅ **Execute os 7 scripts em sequência**
4. ✅ **Explore as personas criadas**
5. ✅ **Visualize os avatares**
6. ✅ **Navegue pelos 12 subsistemas**
7. ✅ **Experimente diferentes configurações**

**Divirta-se criando empresas virtuais! 🚀**

---

**Manual elaborado por:** Sergio Castro  
**Data:** 29/11/2025  
**Versão:** 2.0.0  
**Feedback:** Envie sugestões para melhorar este manual!
