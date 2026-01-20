# 📊 Documentação - Estrutura de Dados V2.0

## 🎯 Visão Geral das Novas Tabelas

O VCM Dashboard V2.0 expande significativamente a estrutura de dados para suportar:
- Sistema completo de Objetivos e Metas
- Auditoria de compatibilidade workflow ↔ metas  
- Sistema de avatares realistas
- CRUD expandido de personas

## 📋 Estrutura Detalhada das Tabelas

### 1. **metas_globais** - Metas Estratégicas da Empresa
```sql
Propósito: Armazenar metas estratégicas globais de cada empresa
Relacionamento: 1 empresa → N metas globais

Campos Principais:
- titulo: Nome da meta (ex: "Crescer 25% em 2025")
- descricao: Detalhamento da meta
- prazo: Data limite para atingir a meta
- prioridade: baixa | media | alta | critica
- categoria: crescimento | operacional | financeira | inovacao | sustentabilidade
- progresso: 0-100% (atualizado conforme andamento)
- budget_estimado: Orçamento previsto
- roi_esperado: Retorno esperado em %

Casos de Uso:
- Dashboard executivo de metas da empresa
- Planejamento estratégico
- Acompanhamento de ROI
```

### 2. **metas_personas** - Metas Específicas por Persona
```sql
Propósito: Metas específicas de executivos/especialistas alinhadas às globais
Relacionamento: 1 meta global → N metas personas | 1 persona → N metas

Campos Principais:
- meta_global_id: Qual meta global esta meta suporta
- persona_id: Qual persona é responsável
- tipo_persona: executivo | especialista | assistente
- alinhamento_score: 0-100% (calculado por IA)
- dependencias: Array de outras metas necessárias
- milestones: JSON com marcos importantes

Casos de Uso:
- Cascateamento automático de metas
- Avaliação de performance individual
- Identificação de dependências
```

### 3. **auditorias_compatibilidade** - Sistema de Auditoria
```sql
Propósito: Avaliar se workflows estão alinhados com metas estabelecidas
Relacionamento: 1 persona → N auditorias | 1 meta → N auditorias

Campos Principais:
- workflow_reference: ID/nome do workflow N8N
- compatibilidade_score: 0-100% (calculado por IA)
- compatibilidade_nivel: baixo | medio | alto | excelente
- analise_detalhada: JSON com detalhes da análise
- acoes_sugeridas: Array de sugestões de melhoria
- status_auditoria: pendente | aprovado | requer_ajuste

Casos de Uso:
- Dashboard de compliance
- Otimização de workflows
- Identificação de gaps estratégicos
```

### 4. **avatares_personas** - Sistema de Avatares
```sql
Propósito: Armazenar avatares realistas gerados para cada persona
Relacionamento: 1 persona → N avatares (com controle de versão)

Campos Principais:
- avatar_url: URL do avatar gerado
- prompt_usado: Prompt utilizado na geração
- estilo: corporate | casual | creative | formal
- background_tipo: office | home_office | neutral
- versao: Controle de versões do avatar
- ativo: Boolean (apenas 1 ativo por persona)

Casos de Uso:
- Interface visual das personas
- Branding consistente
- Histórico de avatares
```

### 5. **personas_biografias** - Biografias Expandidas
```sql
Propósito: Biografias detalhadas separadas da tabela principal
Relacionamento: 1 persona → 1 biografia detalhada

Campos Principais:
- biografia_completa: Texto completo da biografia
- historia_profissional: Trajetória de carreira
- motivacoes: JSON com drivers pessoais
- desafios: JSON com principais desafios
- soft_skills/hard_skills: JSONs organizados
- educacao: JSON com formação
- idiomas_fluencia: JSON com níveis de fluência

Casos de Uso:
- CRUD detalhado de personas
- Geração de prompts contextuais
- Análise de fit para projetos
```

### 6. **personas_tech_specs** - Especificações Técnicas
```sql
Propósito: Configurações técnicas de IA para cada persona
Relacionamento: 1 persona → 1 tech spec

Campos Principais:
- ai_model: Modelo de IA utilizado
- max_tokens: Limite de tokens
- temperature: Criatividade das respostas
- priority_level: Prioridade no sistema
- decision_authority: Nível de autoridade para decisões
- tools_habilitadas: JSON com ferramentas disponíveis
- configuração_avançada: JSON com configs específicas

Casos de Uso:
- Otimização de performance de IA
- Controle de acesso por persona
- Ajuste fino de comportamento
```

## 🔗 Relacionamentos e Fluxos

### Fluxo de Metas
```
Empresa
  └── Metas Globais (estratégicas)
       └── Metas Personas (táticas)
            └── Auditorias (verificação)
```

### Fluxo de Personas
```
Persona (básica)
  ├── Biografia Expandida (contexto)
  ├── Tech Specs (configuração IA)
  ├── Avatar (visual)
  ├── Metas (objetivos)
  └── Auditorias (compliance)
```

## 📊 Métricas e KPIs Disponíveis

### Dashboard Executivo
- % de metas globais no prazo
- ROI médio das iniciativas
- Score de alinhamento por persona
- Tendências de progresso

### Dashboard de Auditoria
- % workflows compatíveis com metas
- Score médio de compatibilidade
- Número de ajustes pendentes
- Tempo médio de resolução

### Dashboard de Personas
- Completude de biografias
- Efetividade de avatares
- Performance de configurações IA
- Aderência a metas individuais

## 🚀 Capacidades Habilitadas

### Automação com IA
- **Geração automática de metas** alinhadas
- **Análise de compatibilidade** workflows ↔ metas
- **Sugestões de otimização** baseadas em dados
- **Alertas proativos** de desalinhamento

### Interface Rica
- **Dashboards visuais** com métricas em tempo real
- **CRUD completo** para todos os elementos
- **Sistema de avatares** para humanização
- **Auditoria visual** com scores e sugestões

### Integrações
- **N8N workflows** para análise de compatibilidade
- **Nano Banana** para geração de avatares
- **Múltiplos LLMs** para diferentes necessidades
- **Supabase** para persistência e sync

## 📋 Próximos Passos

1. **Execute o SQL** no Supabase para criar as tabelas
2. **Verificar criação** com os SELECTs de validação
3. **Atualizar interfaces** TypeScript com novos tipos
4. **Implementar CRUDs** para cada entidade
5. **Integrar sistemas** de IA e geração de avatares

Esta estrutura fornece a base sólida para todas as funcionalidades planejadas! 🎯