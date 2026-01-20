# Manual de Instruções - VCM Dashboard

**Versão 2.0** - Sistema Completo com Machine Learning e Auditoria

## 📋 Índice

1. [Conceito Geral do Sistema](#conceito-geral)
2. [Módulos do Sistema](#módulos)
3. [Instruções Detalhadas](#instruções)
4. [Fluxos de Trabalho](#fluxos)
5. [Solução de Problemas](#troubleshooting)
6. [Índice Alfabético](#indice)

---

## 🎯 Conceito Geral do Sistema {#conceito-geral}

O **Virtual Company Manager (VCM) Dashboard** é uma plataforma avançada para gestão automatizada de empresas virtuais com inteligência artificial integrada. O sistema combina automação de processos, aprendizado de máquina, auditoria completa e gestão inteligente de recursos humanos virtuais.

### 🏗️ Arquitetura do Sistema

**Componentes Principais:**
- **Frontend Dashboard:** Interface React com Next.js
- **Backend API:** Python FastAPI para automação
- **Database:** Supabase PostgreSQL com múltiplas instâncias
- **ML Engine:** Sistema de aprendizado contínuo
- **Audit System:** Compliance e rastreabilidade completa
- **RAG Database:** Base de conhecimento por empresa

![Figura 1: Arquitetura Geral do Sistema VCM](placeholder-arquitetura-geral.png)
*Captura de tela da visão geral mostrando todos os componentes integrados*

### 🎪 Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| 🏢 **Gestão de Empresas Virtuais** | Criação e gerenciamento completo de empresas virtuais com personas especializadas |
| 🤖 **Automação Inteligente** | Scripts automatizados para geração de personas, competências e workflows |
| 🧠 **Machine Learning** | Aprendizado contínuo com otimização automática de processos |
| 🛡️ **Auditoria Completa** | Sistema de compliance com rastreabilidade total de ações |
| 📊 **Analytics Avançado** | Métricas detalhadas e relatórios executivos em tempo real |
| 🔧 **Ferramentas Integradas** | Suite completa de sub-sistemas e ferramentas especializadas |

---

## 🧩 Módulos do Sistema {#módulos}

### 🏠 Módulo Home

Centro de controle principal com visão geral do sistema e processo de onboarding.

**Sub-módulos:**
- **Visão Geral:** Dashboard executivo com métricas principais
- **OnBoarding:** Assistente para criação de novas empresas virtuais

![Figura 2: Módulo Home - Visão Geral](placeholder-home-visao-geral.png)
*Screenshot do dashboard principal mostrando métricas, status e cards de resumo*

> 💡 **Dica:** O módulo Home é sempre o ponto de partida recomendado para novos usuários.

### 🏢 Módulo Empresas

Gestão completa de empresas virtuais e sistema de tarefas inteligente.

**Sub-módulos:**
- **Lista de Empresas:** CRUD completo de empresas virtuais
- **Tarefas:** Gestão inteligente de tarefas e workflows

![Figura 3: Módulo Empresas - Lista Principal](placeholder-empresas-lista.png)
*Interface de gestão mostrando cards de empresas com status e ações*

### ⚙️ Módulo Scripts & Tools

Centro de automação com scripts Node.js e ferramentas especializadas.

**Sub-módulos:**
- **Scripts Node.js:** Execução de automações e cascata de processamento
- **Tools & Subsistemas:** Ferramentas especializadas e sub-sistemas

![Figura 4: Módulo Scripts - Interface de Execução](placeholder-scripts-execucao.png)
*Painel de controle dos scripts com botões de execução e logs em tempo real*

### 🧠 Módulo Machine Learning

Sistema de aprendizado contínuo com otimização automática.

**Funcionalidades:**
- **Detecção de Padrões:** Análise automática de comportamentos
- **Otimizações Automáticas:** Melhorias aplicadas automaticamente
- **Métricas de Performance:** Acompanhamento de eficiência
- **Logs de Execução:** Rastreamento completo de operações ML

![Figura 5: Módulo ML - Dashboard Principal](placeholder-ml-dashboard.png)
*Interface do sistema de ML com métricas, padrões detectados e controles*

### 🛡️ Módulo Auditoria

Sistema completo de compliance, segurança e rastreabilidade.

**Funcionalidades:**
- **Logs de Ações:** Rastreamento de todas as operações
- **Segurança:** Monitoramento de acessos e anomalias
- **Compliance:** Verificações automáticas de conformidade
- **Relatórios:** Geração automática de reports executivos

![Figura 6: Módulo Auditoria - Dashboard de Compliance](placeholder-auditoria-dashboard.png)
*Interface de auditoria com alertas, logs e métricas de compliance*

### ⚙️ Módulo Configurações

Centro de configurações do sistema com acesso rápido via ícone.

**Funcionalidades:**
- **Configurações de Sistema:** Parâmetros globais
- **Configurações de Usuário:** Preferências pessoais
- **Integrations:** APIs e serviços externos
- **Backup & Restore:** Gestão de dados

![Figura 7: Módulo Configurações - Painel Principal](placeholder-config-painel.png)
*Interface de configurações com categorias organizadas e controles*

---

## 📖 Instruções Detalhadas por Aba {#instruções}

### 🏠 Aba Home

#### 📊 Sub-aba: Visão Geral

**Objetivo:** Fornecer uma visão executiva completa do sistema com métricas principais, status de saúde e indicadores de performance.

**Como Usar:**

1. **Acesso:** Clique na aba "Home" no menu principal. A sub-aba "Visão Geral" é exibida por padrão.
2. **Métricas Principais:** Observe os cards de métricas que mostram total de empresas, personas ativas, status do sistema e indicadores de performance.
3. **Status de Saúde:** Verifique o indicador de conexão da API no header (ícone verde = conectado, vermelho = desconectado).
4. **Gráficos:** Analise os gráficos de tendência e distribuição para entender o comportamento do sistema.

![Figura 8: Home - Visão Geral Detalhada](placeholder-home-detalhada.png)
*Cards de métricas, gráficos de performance e indicadores de status*

#### 👥 Sub-aba: OnBoarding

**Objetivo:** Guiar o usuário na criação de uma nova empresa virtual com assistente passo-a-passo.

**Como Usar:**

1. **Acesso:** Clique na sub-aba "OnBoarding" dentro da aba Home.
2. **Informações Básicas:** Preencha nome da empresa, código, domínio, país e indústria.
3. **Configurações Avançadas:** Defina número de personas, idiomas suportados e configurações específicas.
4. **Revisão:** Confirme todas as informações antes de criar a empresa.
5. **Execução:** O sistema executará automaticamente a cascata de criação (biografias → competências → specs → RAG → workflows).

![Figura 9: OnBoarding - Assistente de Criação](placeholder-onboarding-assistente.png)
*Formulário em passos com campos de empresa e configurações avançadas*

> ⚠️ **Importante:** O processo de onboarding pode levar alguns minutos. Não feche a página durante a execução.

### 🏢 Aba Empresas

#### 📋 Sub-aba: Lista de Empresas

**Objetivo:** Gerenciar todas as empresas virtuais do sistema com operações CRUD completas.

**Funcionalidades:**

1. **Visualização:** Veja todas as empresas em cards organizados com informações resumidas.
2. **Filtros:** Use os filtros por status, país, indústria ou data de criação.
3. **Busca:** Utilize a barra de busca para encontrar empresas específicas.
4. **Detalhes:** Clique em uma empresa para ver informações detalhadas e personas.
5. **Edição:** Use o botão "Editar" para modificar dados da empresa.
6. **Exclusão:** Botão "Excluir" remove a empresa com confirmação de segurança.

![Figura 10: Empresas - Lista e Filtros](placeholder-empresas-filtros.png)
*Grid de empresas com cards, filtros e barra de busca*

#### ✅ Sub-aba: Tarefas

**Objetivo:** Gestão inteligente de tarefas com atribuição automática e acompanhamento de progresso.

**Como Gerenciar Tarefas:**

1. **Criar Tarefa:** Clique em "Nova Tarefa" e preencha título, descrição, prioridade e prazo.
2. **Atribuição Automática:** O sistema ML sugere automaticamente a persona mais adequada.
3. **Acompanhamento:** Monitore o progresso em tempo real através dos status boards.
4. **Colaboração:** Adicione comentários e anexos às tarefas.
5. **Relatórios:** Gere relatórios de produtividade por persona ou departamento.

![Figura 11: Tarefas - Kanban Board](placeholder-tarefas-kanban.png)
*Board estilo Kanban com colunas de status e cards de tarefas*

### ⚙️ Aba Scripts & Tools

#### 🐍 Sub-aba: Scripts Node.js

**Objetivo:** Executar scripts de automação em cascata para processamento de empresas virtuais.

**Ordem de Execução (Cascata Obrigatória):**

1. **Script 1 - Biografias:** Gera biografias completas para todas as personas da empresa.
2. **Script 2 - Competências:** Analisa biografias e extrai competências técnicas e comportamentais.
3. **Script 3 - Tech Specs:** Define especificações técnicas e ferramentas por persona.
4. **Script 4 - RAG Database:** Popula base de conhecimento estruturada.
5. **Script 5 - Workflows N8N:** Gera workflows automatizados de negócio.

![Figura 12: Scripts - Painel de Execução](placeholder-scripts-painel.png)
*Interface com botões de scripts em sequência e logs de execução*

> ⚠️ **Atenção:** A ordem dos scripts é CRÍTICA. Nunca execute fora de sequência.

#### 🔧 Sub-aba: Tools & Subsistemas

**Objetivo:** Acessar ferramentas especializadas e subsistemas auxiliares.

**Ferramentas Disponíveis:**

1. **Email Management:** Sistema de campanhas e templates de email.
2. **Social Media:** Gestão automatizada de redes sociais.
3. **Document Generation:** Geração automática de documentos.
4. **Analytics Engine:** Motor de análises avançadas.
5. **Integration Hub:** Central de integrações com APIs externas.

![Figura 13: Tools - Subsistemas Disponíveis](placeholder-tools-subsistemas.png)
*Grid de ferramentas com status de implementação e acessos rápidos*

### 🧠 Aba Machine Learning

**Objetivo:** Monitorar e controlar o sistema de aprendizado contínuo que otimiza automaticamente os processos.

**Funcionalidades Principais:**

1. **Executar Ciclo ML:** Clique em "Executar Ciclo ML" para iniciar análise de padrões e otimizações.
2. **Monitorar Métricas:** Acompanhe score de eficiência, padrões ativos e otimizações aplicadas.
3. **Analisar Padrões:** Revise os padrões detectados com nível de confiança e impacto.
4. **Controlar Otimizações:** Monitore otimizações em andamento e aplicadas.
5. **Configurar Sistema:** Ajuste thresholds de confiança e modo de operação.

![Figura 14: ML - Dashboard Completo](placeholder-ml-completo.png)
*Interface com métricas, padrões, otimizações e controles do sistema ML*

**Interpretação de Métricas:**

| Métrica | Range | Descrição |
|---|---|---|
| **Score de Eficiência** | 0-100% | Performance geral do sistema |
| **Padrões Ativos** | Número | Padrões sendo aplicados atualmente |
| **Confiança** | 0-1.0 | Nível de certeza do ML sobre um padrão |
| **Impacto** | % | Melhoria esperada/observada |

> ✅ **Dica:** Execute ciclos ML regularmente para manter otimizações atualizadas.

### 🛡️ Aba Auditoria

**Objetivo:** Monitorar compliance, segurança e rastreabilidade completa de todas as operações do sistema.

**Funcionalidades de Auditoria:**

1. **Logs de Ações:** Visualize todas as ações executadas com timestamp, usuário e detalhes.
2. **Alertas de Segurança:** Monitore tentativas de acesso não autorizado e anomalias.
3. **Compliance Check:** Execute verificações automáticas de conformidade LGPD/GDPR.
4. **Relatórios Executivos:** Gere relatórios detalhados para auditorias externas.
5. **Filtros Avançados:** Filtre por tipo de ação, usuário, período ou nível de risco.

![Figura 15: Auditoria - Dashboard de Compliance](placeholder-auditoria-compliance.png)
*Interface com logs, alertas, métricas de compliance e controles de filtro*

**Tipos de Alertas:**

| Tipo | Descrição |
|---|---|
| 🔵 **Info** | Ações normais do sistema |
| 🟡 **Warning** | Ações que requerem atenção |
| 🟠 **Error** | Falhas ou problemas identificados |
| 🔴 **Critical** | Problemas graves de segurança |

### ⚙️ Aba Configurações

**Objetivo:** Centralizar todas as configurações do sistema para personalização e otimização.

**Seções de Configuração:**

1. **Sistema Geral:** Configurações globais, timeouts, limites de recursos.
2. **Integrações:** APIs externas, chaves de acesso, endpoints.
3. **Machine Learning:** Parâmetros ML, thresholds, modo de operação.
4. **Auditoria:** Níveis de log, retenção de dados, compliance settings.
5. **Usuário:** Preferências pessoais, notificações, tema.

![Figura 16: Configurações - Painel Organizado](placeholder-config-organizado.png)
*Interface de configurações com categorias e formulários específicos*

> ⚠️ **Cuidado:** Mudanças em configurações críticas podem afetar o funcionamento do sistema.

---

## 🔄 Fluxos de Trabalho Principais {#fluxos}

### 📋 Fluxo Completo: Criação de Empresa Virtual

1. **OnBoarding:** Use o assistente na aba Home → OnBoarding
2. **Configuração:** Defina parâmetros da empresa e personas
3. **Execução Automática:** Sistema executa cascata de scripts
4. **Verificação:** Confirme criação na aba Empresas
5. **Ativação ML:** Execute primeiro ciclo ML para otimização
6. **Monitoramento:** Acompanhe através da auditoria

### 🔧 Fluxo de Manutenção: Scripts em Cascata

1. **Seleção de Empresa:** Escolha empresa na aba Scripts & Tools
2. **Script 1:** Execute geração de biografias
3. **Script 2:** Execute análise de competências
4. **Script 3:** Execute especificações técnicas
5. **Script 4:** Execute população da base RAG
6. **Script 5:** Execute geração de workflows N8N

> ⚠️ **Crítico:** NUNCA execute scripts fora de ordem. Dependências são obrigatórias.

---

## 🔧 Solução de Problemas {#troubleshooting}

### 🚨 Problemas Comuns

#### 🔴 API Desconectada
**Sintomas:** Indicador vermelho no header, erro "Failed to fetch"

**Solução:**
- Verifique se o backend Python está rodando na porta 8000
- Execute: `python api_bridge_real.py`
- Clique em "Tentar Reconectar" no banner de aviso

#### ⚡ Scripts Falhando
**Sintomas:** Scripts não executam ou retornam erro

**Solução:**
- Verifique ordem de execução (1→2→3→4→5)
- Confirme se empresa foi selecionada
- Verifique logs na aba Auditoria
- Reinicie o backend se necessário

#### 🧠 ML Não Funcionando
**Sintomas:** Ciclos ML não executam ou não geram otimizações

**Solução:**
- Verifique se há dados suficientes no sistema
- Confirme configurações de threshold de confiança
- Execute ciclo manual primeiro
- Verifique logs de ML na auditoria

#### 🛡️ Problemas de Auditoria
**Sintomas:** Logs não aparecem ou relatórios falham

**Solução:**
- Verifique conexão com database de auditoria
- Confirme se triggers estão ativos
- Verifique permissões de escrita
- Execute limpeza de logs antigos

---

## 📝 Índice Alfabético {#indice}

**A-D**
- [Auditoria](#aba-auditoria)
- [Arquitetura](#conceito-geral)
- [Automação](#fluxos)
- [API Desconectada](#troubleshooting)
- [Empresas](#módulo-empresas)
- [Configurações](#aba-configurações)
- [Dashboard](#conceito-geral)

**E-H**
- [Empresas Virtuais](#aba-empresas)
- [Fluxos de Trabalho](#fluxos)
- [Falhas de Script](#troubleshooting)
- [Home](#aba-home)
- [Funcionalidades](#conceito-geral)

**I-L**
- [Integração](#conceito-geral)
- [JavaScript/Node.js](#aba-scripts-tools)
- [Lista de Empresas](#aba-empresas)
- [Logs de Auditoria](#aba-auditoria)

**M-P**
- [Machine Learning](#aba-machine-learning)
- [Módulos](#módulos)
- [OnBoarding](#aba-home)
- [Otimizações](#aba-machine-learning)
- [Padrões ML](#aba-machine-learning)
- [Personas](#conceito-geral)

**Q-T**
- [RAG Database](#conceito-geral)
- [Relatórios](#aba-auditoria)
- [Scripts](#aba-scripts-tools)
- [Supabase](#conceito-geral)
- [Tarefas](#aba-empresas)
- [Tools](#aba-scripts-tools)

**U-Z**
- [Visão Geral](#aba-home)
- [Virtual Company Manager](#conceito-geral)
- [Workflows N8N](#aba-scripts-tools)

---

**Manual de Instruções - VCM Dashboard v2.0**  
*Sistema completo de gestão de empresas virtuais com ML e Auditoria*  
*Gerado automaticamente - Mantenha sempre atualizado*