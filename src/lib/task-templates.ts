/**
 * Biblioteca de Templates de Tarefas para VCM
 * 30 templates organizados por área funcional
 * Usado para criar tarefas sem necessidade de LLM
 */

export type TaskParameter = {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
};

export type ExpectedMetric = {
  name: string;
  target: number;
  unit: string;
  description: string;
};

export type TaskTemplate = {
  code: string;
  name: string;
  description: string;
  functional_area: string;
  executor_role: string;
  parameters: TaskParameter[];
  expected_metrics: ExpectedMetric[];
  supervision_required: boolean;
  estimated_duration_hours: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  automation_potential: 'low' | 'medium' | 'high';
};

// =====================================================
// MARKETING (6 templates)
// =====================================================

export const MARKETING_TEMPLATES: TaskTemplate[] = [
  {
    code: 'MKT_GERAR_LEADS',
    name: 'Gerar Leads Qualificados',
    description: 'Campanha de geração de leads através de anúncios pagos e conteúdo',
    functional_area: 'Marketing',
    executor_role: 'Especialista em Marketing Digital',
    parameters: [
      { name: 'canal', type: 'select', label: 'Canal Principal', required: true, options: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'SEO Orgânico', 'Email Marketing'] },
      { name: 'orcamento', type: 'number', label: 'Orçamento (R$)', required: true, min: 500, max: 50000 },
      { name: 'publico_alvo', type: 'text', label: 'Público-Alvo', required: true, placeholder: 'Ex: Empresas B2B de tecnologia' },
      { name: 'duracao_dias', type: 'number', label: 'Duração (dias)', required: true, min: 7, max: 90, defaultValue: 30 },
      { name: 'landing_page', type: 'url', label: 'URL Landing Page', required: false }
    ],
    expected_metrics: [
      { name: 'leads_gerados', target: 100, unit: 'leads', description: 'Total de leads captados' },
      { name: 'custo_por_lead', target: 50, unit: 'R$', description: 'Custo médio por lead' },
      { name: 'taxa_conversao', target: 5, unit: '%', description: 'Percentual de conversão' }
    ],
    supervision_required: true,
    estimated_duration_hours: 720,
    priority: 'high',
    automation_potential: 'high'
  },
  {
    code: 'MKT_CRIAR_CAMPANHA',
    name: 'Criar Campanha Publicitária',
    description: 'Desenvolvimento e lançamento de campanha de anúncios pagos',
    functional_area: 'Marketing',
    executor_role: 'Especialista em Marketing Digital',
    parameters: [
      { name: 'plataforma', type: 'multiselect', label: 'Plataformas', required: true, options: ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube'] },
      { name: 'objetivo', type: 'select', label: 'Objetivo', required: true, options: ['Awareness', 'Conversão', 'Tráfego', 'Engajamento', 'Vendas'] },
      { name: 'orcamento_total', type: 'number', label: 'Orçamento Total (R$)', required: true, min: 1000, max: 100000 },
      { name: 'periodo_inicio', type: 'date', label: 'Data Início', required: true },
      { name: 'periodo_fim', type: 'date', label: 'Data Fim', required: true },
      { name: 'criativos_url', type: 'url', label: 'Link dos Criativos', required: false }
    ],
    expected_metrics: [
      { name: 'impressoes', target: 50000, unit: 'impressões', description: 'Total de visualizações' },
      { name: 'cliques', target: 1000, unit: 'cliques', description: 'Total de cliques' },
      { name: 'ctr', target: 2, unit: '%', description: 'Click-through rate' },
      { name: 'conversoes', target: 50, unit: 'conversões', description: 'Ações completadas' }
    ],
    supervision_required: true,
    estimated_duration_hours: 168,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'MKT_ANALISE_COMPETITIVA',
    name: 'Análise de Competidores',
    description: 'Pesquisa e análise detalhada da concorrência',
    functional_area: 'Marketing',
    executor_role: 'Analista de Marketing',
    parameters: [
      { name: 'competidores', type: 'text', label: 'Lista de Competidores', required: true, placeholder: 'Ex: Empresa A, Empresa B, Empresa C' },
      { name: 'aspectos', type: 'multiselect', label: 'Aspectos a Analisar', required: true, options: ['Pricing', 'Posicionamento', 'Canais', 'Conteúdo', 'Produto', 'Atendimento'] },
      { name: 'profundidade', type: 'select', label: 'Profundidade', required: true, options: ['Básica', 'Intermediária', 'Completa'] }
    ],
    expected_metrics: [
      { name: 'competidores_analisados', target: 5, unit: 'empresas', description: 'Número de competidores' },
      { name: 'insights_gerados', target: 15, unit: 'insights', description: 'Insights acionáveis' }
    ],
    supervision_required: false,
    estimated_duration_hours: 40,
    priority: 'normal',
    automation_potential: 'low'
  },
  {
    code: 'MKT_OTIMIZAR_SEO',
    name: 'Otimização SEO',
    description: 'Melhoria de ranqueamento orgânico no Google',
    functional_area: 'Marketing',
    executor_role: 'Especialista em SEO',
    parameters: [
      { name: 'urls', type: 'text', label: 'URLs a Otimizar', required: true, placeholder: 'Uma URL por linha' },
      { name: 'palavras_chave', type: 'text', label: 'Palavras-Chave Alvo', required: true, placeholder: 'Ex: software CRM, gestão clientes' },
      { name: 'tipo_otimizacao', type: 'multiselect', label: 'Tipo de Otimização', required: true, options: ['On-page', 'Off-page', 'Técnico', 'Conteúdo', 'Backlinks'] }
    ],
    expected_metrics: [
      { name: 'posicao_media', target: 10, unit: 'posição', description: 'Posição média no Google' },
      { name: 'trafego_organico', target: 500, unit: 'visitas/mês', description: 'Aumento de tráfego' },
      { name: 'score_seo', target: 85, unit: 'pontos', description: 'Score SEO (0-100)' }
    ],
    supervision_required: false,
    estimated_duration_hours: 80,
    priority: 'normal',
    automation_potential: 'medium'
  },
  {
    code: 'MKT_PRODUZIR_CONTEUDO',
    name: 'Produzir Conteúdo',
    description: 'Criação de conteúdo para blog, redes sociais ou email',
    functional_area: 'Marketing',
    executor_role: 'Produtor de Conteúdo',
    parameters: [
      { name: 'tipo_conteudo', type: 'select', label: 'Tipo de Conteúdo', required: true, options: ['Blog Post', 'Vídeo', 'Infográfico', 'E-book', 'Post Social', 'Email'] },
      { name: 'tema', type: 'text', label: 'Tema/Título', required: true },
      { name: 'quantidade', type: 'number', label: 'Quantidade', required: true, min: 1, max: 50, defaultValue: 1 },
      { name: 'palavras_chave', type: 'text', label: 'Palavras-Chave SEO', required: false },
      { name: 'deadline', type: 'date', label: 'Data de Entrega', required: true }
    ],
    expected_metrics: [
      { name: 'pecas_criadas', target: 5, unit: 'conteúdos', description: 'Peças produzidas' },
      { name: 'engajamento', target: 200, unit: 'interações', description: 'Curtidas + comentários' },
      { name: 'alcance', target: 5000, unit: 'pessoas', description: 'Pessoas alcançadas' }
    ],
    supervision_required: false,
    estimated_duration_hours: 24,
    priority: 'normal',
    automation_potential: 'medium'
  },
  {
    code: 'MKT_COORDENAR_EVENTO',
    name: 'Coordenar Evento',
    description: 'Planejamento e execução de evento (webinar, workshop, etc)',
    functional_area: 'Marketing',
    executor_role: 'Coordenador de Eventos',
    parameters: [
      { name: 'tipo_evento', type: 'select', label: 'Tipo de Evento', required: true, options: ['Webinar', 'Workshop', 'Conferência', 'Meetup', 'Lançamento'] },
      { name: 'data_evento', type: 'date', label: 'Data do Evento', required: true },
      { name: 'formato', type: 'select', label: 'Formato', required: true, options: ['Online', 'Presencial', 'Híbrido'] },
      { name: 'capacidade', type: 'number', label: 'Capacidade (pessoas)', required: true, min: 10, max: 1000 },
      { name: 'orcamento', type: 'number', label: 'Orçamento (R$)', required: true, min: 500, max: 50000 }
    ],
    expected_metrics: [
      { name: 'inscricoes', target: 100, unit: 'inscritos', description: 'Total de inscrições' },
      { name: 'comparecimento', target: 70, unit: '%', description: 'Taxa de comparecimento' },
      { name: 'satisfacao', target: 4.5, unit: 'estrelas', description: 'Avaliação média (1-5)' }
    ],
    supervision_required: true,
    estimated_duration_hours: 160,
    priority: 'high',
    automation_potential: 'low'
  }
];

// =====================================================
// VENDAS (5 templates)
// =====================================================

export const VENDAS_TEMPLATES: TaskTemplate[] = [
  {
    code: 'VEN_QUALIFICAR_LEAD',
    name: 'Qualificar Lead',
    description: 'Análise e qualificação de lead para vendas',
    functional_area: 'Vendas',
    executor_role: 'Especialista em Aquisição de Clientes',
    parameters: [
      { name: 'lead_id', type: 'text', label: 'ID do Lead', required: true },
      { name: 'origem', type: 'select', label: 'Origem do Lead', required: true, options: ['Site', 'Google Ads', 'Indicação', 'Evento', 'Cold Call', 'Outro'] },
      { name: 'criterios', type: 'multiselect', label: 'Critérios de Qualificação', required: true, options: ['Budget', 'Authority', 'Need', 'Timeline', 'Fit'] }
    ],
    expected_metrics: [
      { name: 'score_qualificacao', target: 80, unit: 'pontos', description: 'Score de qualificação (0-100)' },
      { name: 'tempo_resposta', target: 2, unit: 'horas', description: 'Tempo até primeiro contato' }
    ],
    supervision_required: false,
    estimated_duration_hours: 2,
    priority: 'high',
    automation_potential: 'high'
  },
  {
    code: 'VEN_ENVIAR_PROPOSTA',
    name: 'Enviar Proposta Comercial',
    description: 'Elaboração e envio de proposta comercial personalizada',
    functional_area: 'Vendas',
    executor_role: 'Gerente de Vendas',
    parameters: [
      { name: 'cliente_nome', type: 'text', label: 'Nome do Cliente', required: true },
      { name: 'cliente_email', type: 'email', label: 'Email do Cliente', required: true },
      { name: 'valor_proposta', type: 'number', label: 'Valor da Proposta (R$)', required: true, min: 1000, max: 500000 },
      { name: 'produtos_servicos', type: 'text', label: 'Produtos/Serviços', required: true },
      { name: 'prazo_validade', type: 'number', label: 'Validade (dias)', required: true, min: 7, max: 90, defaultValue: 30 },
      { name: 'condicoes_pagamento', type: 'select', label: 'Condições de Pagamento', required: true, options: ['À vista', '30 dias', '60 dias', '90 dias', 'Parcelado'] }
    ],
    expected_metrics: [
      { name: 'tempo_elaboracao', target: 4, unit: 'horas', description: 'Tempo para elaborar' },
      { name: 'taxa_aceitacao', target: 30, unit: '%', description: 'Taxa de fechamento' }
    ],
    supervision_required: true,
    estimated_duration_hours: 8,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'VEN_FECHAR_CONTRATO',
    name: 'Fechar Contrato',
    description: 'Negociação final e fechamento de contrato',
    functional_area: 'Vendas',
    executor_role: 'Gerente de Vendas',
    parameters: [
      { name: 'proposta_id', type: 'text', label: 'ID da Proposta', required: true },
      { name: 'valor_final', type: 'number', label: 'Valor Final (R$)', required: true, min: 5000, max: 1000000 },
      { name: 'desconto_aplicado', type: 'number', label: 'Desconto (%)', required: false, min: 0, max: 50, defaultValue: 0 },
      { name: 'prazo_contrato', type: 'number', label: 'Prazo (meses)', required: true, min: 1, max: 36 },
      { name: 'forma_pagamento', type: 'select', label: 'Forma de Pagamento', required: true, options: ['Boleto', 'Cartão', 'Transferência', 'PIX'] }
    ],
    expected_metrics: [
      { name: 'receita_gerada', target: 50000, unit: 'R$', description: 'Valor do contrato' },
      { name: 'ciclo_vendas', target: 30, unit: 'dias', description: 'Tempo total de venda' }
    ],
    supervision_required: true,
    estimated_duration_hours: 16,
    priority: 'urgent',
    automation_potential: 'low'
  },
  {
    code: 'VEN_FOLLOWUP_CLIENTE',
    name: 'Follow-up com Cliente',
    description: 'Acompanhamento pós-proposta ou pós-venda',
    functional_area: 'Vendas',
    executor_role: 'Especialista em Retenção de Clientes',
    parameters: [
      { name: 'cliente_id', type: 'text', label: 'ID do Cliente', required: true },
      { name: 'motivo', type: 'select', label: 'Motivo do Follow-up', required: true, options: ['Proposta Enviada', 'Pós-Venda', 'Renovação', 'Upsell', 'Feedback'] },
      { name: 'canal', type: 'select', label: 'Canal de Contato', required: true, options: ['Email', 'Telefone', 'WhatsApp', 'Reunião'] }
    ],
    expected_metrics: [
      { name: 'taxa_resposta', target: 60, unit: '%', description: 'Taxa de resposta' },
      { name: 'conversao', target: 25, unit: '%', description: 'Taxa de conversão' }
    ],
    supervision_required: false,
    estimated_duration_hours: 2,
    priority: 'normal',
    automation_potential: 'high'
  },
  {
    code: 'VEN_ONBOARDING_CLIENTE',
    name: 'Onboarding de Cliente',
    description: 'Integração e treinamento de novo cliente',
    functional_area: 'Vendas',
    executor_role: 'Especialista em Retenção de Clientes',
    parameters: [
      { name: 'cliente_id', type: 'text', label: 'ID do Cliente', required: true },
      { name: 'data_inicio', type: 'date', label: 'Data de Início', required: true },
      { name: 'etapas', type: 'multiselect', label: 'Etapas do Onboarding', required: true, options: ['Kick-off', 'Treinamento', 'Configuração', 'Acompanhamento', 'Revisão'] },
      { name: 'responsavel_cliente', type: 'text', label: 'Responsável no Cliente', required: true }
    ],
    expected_metrics: [
      { name: 'tempo_ativacao', target: 7, unit: 'dias', description: 'Dias até ativação completa' },
      { name: 'satisfacao', target: 4.5, unit: 'estrelas', description: 'Satisfação inicial (1-5)' },
      { name: 'adocao', target: 80, unit: '%', description: 'Taxa de uso do produto' }
    ],
    supervision_required: false,
    estimated_duration_hours: 24,
    priority: 'high',
    automation_potential: 'medium'
  }
];

// =====================================================
// FINANCEIRO (4 templates)
// =====================================================

export const FINANCEIRO_TEMPLATES: TaskTemplate[] = [
  {
    code: 'FIN_APROVAR_ORCAMENTO',
    name: 'Aprovar Orçamento',
    description: 'Revisão e aprovação de orçamento departamental',
    functional_area: 'Financeiro',
    executor_role: 'Gerente Financeiro',
    parameters: [
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Marketing', 'Vendas', 'Operações', 'Produto', 'Qualidade', 'TI'] },
      { name: 'valor_solicitado', type: 'number', label: 'Valor Solicitado (R$)', required: true, min: 1000, max: 1000000 },
      { name: 'periodo', type: 'select', label: 'Período', required: true, options: ['Mensal', 'Trimestral', 'Semestral', 'Anual'] },
      { name: 'justificativa', type: 'text', label: 'Justificativa', required: true }
    ],
    expected_metrics: [
      { name: 'roi_estimado', target: 150, unit: '%', description: 'ROI esperado' },
      { name: 'tempo_aprovacao', target: 48, unit: 'horas', description: 'Tempo de análise' }
    ],
    supervision_required: true,
    estimated_duration_hours: 8,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'FIN_PROCESSAR_PAGAMENTO',
    name: 'Processar Pagamento',
    description: 'Execução de pagamento a fornecedor ou prestador',
    functional_area: 'Financeiro',
    executor_role: 'Analista Financeiro',
    parameters: [
      { name: 'beneficiario', type: 'text', label: 'Nome do Beneficiário', required: true },
      { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, min: 100, max: 100000 },
      { name: 'tipo_pagamento', type: 'select', label: 'Tipo', required: true, options: ['Fornecedor', 'Prestador', 'Reembolso', 'Salário', 'Impostos'] },
      { name: 'vencimento', type: 'date', label: 'Data de Vencimento', required: true },
      { name: 'forma_pagamento', type: 'select', label: 'Forma de Pagamento', required: true, options: ['Boleto', 'Transferência', 'PIX', 'Cheque'] }
    ],
    expected_metrics: [
      { name: 'pagamentos_prazo', target: 95, unit: '%', description: 'Pagamentos em dia' },
      { name: 'tempo_processamento', target: 24, unit: 'horas', description: 'Tempo de processamento' }
    ],
    supervision_required: true,
    estimated_duration_hours: 2,
    priority: 'high',
    automation_potential: 'high'
  },
  {
    code: 'FIN_EMITIR_FATURA',
    name: 'Emitir Fatura',
    description: 'Emissão de nota fiscal e fatura para cliente',
    functional_area: 'Financeiro',
    executor_role: 'Analista Financeiro',
    parameters: [
      { name: 'cliente_id', type: 'text', label: 'ID do Cliente', required: true },
      { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, min: 100, max: 500000 },
      { name: 'descricao', type: 'text', label: 'Descrição dos Serviços', required: true },
      { name: 'vencimento', type: 'date', label: 'Data de Vencimento', required: true }
    ],
    expected_metrics: [
      { name: 'tempo_emissao', target: 4, unit: 'horas', description: 'Tempo para emitir' },
      { name: 'recebimento_prazo', target: 85, unit: '%', description: 'Recebimento no prazo' }
    ],
    supervision_required: false,
    estimated_duration_hours: 1,
    priority: 'normal',
    automation_potential: 'high'
  },
  {
    code: 'FIN_GERAR_RELATORIO',
    name: 'Gerar Relatório Financeiro',
    description: 'Elaboração de relatório de desempenho financeiro',
    functional_area: 'Financeiro',
    executor_role: 'Gerente Financeiro',
    parameters: [
      { name: 'tipo_relatorio', type: 'select', label: 'Tipo de Relatório', required: true, options: ['DRE', 'Fluxo de Caixa', 'Balanço', 'Budget vs Real', 'Contas a Pagar/Receber'] },
      { name: 'periodo', type: 'select', label: 'Período', required: true, options: ['Semanal', 'Mensal', 'Trimestral', 'Anual'] },
      { name: 'destinatarios', type: 'text', label: 'Destinatários', required: true, placeholder: 'Emails separados por vírgula' }
    ],
    expected_metrics: [
      { name: 'tempo_elaboracao', target: 8, unit: 'horas', description: 'Tempo para elaborar' },
      { name: 'precisao', target: 99, unit: '%', description: 'Precisão dos dados' }
    ],
    supervision_required: false,
    estimated_duration_hours: 8,
    priority: 'normal',
    automation_potential: 'medium'
  }
];

// =====================================================
// OPERAÇÕES (4 templates)
// =====================================================

export const OPERACOES_TEMPLATES: TaskTemplate[] = [
  {
    code: 'OPS_PROCESSAR_PEDIDO',
    name: 'Processar Pedido',
    description: 'Processamento e preparação de pedido de cliente',
    functional_area: 'Operações',
    executor_role: 'Analista de Operações',
    parameters: [
      { name: 'pedido_id', type: 'text', label: 'ID do Pedido', required: true },
      { name: 'cliente_id', type: 'text', label: 'ID do Cliente', required: true },
      { name: 'tipo_pedido', type: 'select', label: 'Tipo de Pedido', required: true, options: ['Produto', 'Serviço', 'Assinatura', 'Renovação'] },
      { name: 'urgencia', type: 'select', label: 'Urgência', required: true, options: ['Normal', 'Urgente', 'Express'] }
    ],
    expected_metrics: [
      { name: 'tempo_processamento', target: 4, unit: 'horas', description: 'Tempo de processamento' },
      { name: 'precisao', target: 98, unit: '%', description: 'Taxa de precisão' }
    ],
    supervision_required: false,
    estimated_duration_hours: 4,
    priority: 'high',
    automation_potential: 'high'
  },
  {
    code: 'OPS_COORDENAR_ENTREGA',
    name: 'Coordenar Entrega',
    description: 'Logística e acompanhamento de entrega ao cliente',
    functional_area: 'Operações',
    executor_role: 'Gerente de Operações e Entrega',
    parameters: [
      { name: 'pedido_id', type: 'text', label: 'ID do Pedido', required: true },
      { name: 'endereco_destino', type: 'text', label: 'Endereço de Destino', required: true },
      { name: 'prazo_entrega', type: 'date', label: 'Prazo de Entrega', required: true },
      { name: 'transportadora', type: 'select', label: 'Transportadora', required: false, options: ['Correios', 'Transportadora A', 'Transportadora B', 'Entrega Própria'] }
    ],
    expected_metrics: [
      { name: 'entregas_prazo', target: 95, unit: '%', description: 'Entregas no prazo' },
      { name: 'satisfacao_entrega', target: 4.5, unit: 'estrelas', description: 'Avaliação da entrega' }
    ],
    supervision_required: false,
    estimated_duration_hours: 8,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'OPS_ATENDER_SUPORTE',
    name: 'Atender Chamado de Suporte',
    description: 'Resolução de ticket de suporte técnico',
    functional_area: 'Operações',
    executor_role: 'Especialista em Suporte ao Cliente',
    parameters: [
      { name: 'ticket_id', type: 'text', label: 'ID do Ticket', required: true },
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true, options: ['Técnico', 'Billing', 'Produto', 'Acesso', 'Outro'] },
      { name: 'prioridade', type: 'select', label: 'Prioridade', required: true, options: ['Baixa', 'Média', 'Alta', 'Crítica'] },
      { name: 'canal', type: 'select', label: 'Canal', required: true, options: ['Email', 'Chat', 'Telefone', 'Ticket'] }
    ],
    expected_metrics: [
      { name: 'tempo_primeira_resposta', target: 2, unit: 'horas', description: 'Tempo até primeira resposta' },
      { name: 'tempo_resolucao', target: 24, unit: 'horas', description: 'Tempo total de resolução' },
      { name: 'satisfacao', target: 4.5, unit: 'estrelas', description: 'Satisfação do cliente' }
    ],
    supervision_required: false,
    estimated_duration_hours: 4,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'OPS_AUTOMATIZAR_PROCESSO',
    name: 'Automatizar Processo',
    description: 'Identificação e implementação de automação',
    functional_area: 'Operações',
    executor_role: 'Especialista em Automação de Processos',
    parameters: [
      { name: 'processo_nome', type: 'text', label: 'Nome do Processo', required: true },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Marketing', 'Vendas', 'Financeiro', 'Operações', 'Produto'] },
      { name: 'ferramentas', type: 'multiselect', label: 'Ferramentas', required: true, options: ['N8N', 'Zapier', 'Python', 'API', 'RPA'] },
      { name: 'complexidade', type: 'select', label: 'Complexidade', required: true, options: ['Baixa', 'Média', 'Alta'] }
    ],
    expected_metrics: [
      { name: 'tempo_economizado', target: 20, unit: 'horas/mês', description: 'Horas economizadas' },
      { name: 'taxa_erro', target: 2, unit: '%', description: 'Taxa de erro pós-automação' },
      { name: 'roi', target: 300, unit: '%', description: 'Retorno sobre investimento' }
    ],
    supervision_required: true,
    estimated_duration_hours: 80,
    priority: 'normal',
    automation_potential: 'low'
  }
];

// =====================================================
// PRODUTO (5 templates)
// =====================================================

export const PRODUTO_TEMPLATES: TaskTemplate[] = [
  {
    code: 'PRD_DESENVOLVER_FEATURE',
    name: 'Desenvolver Feature',
    description: 'Desenvolvimento de nova funcionalidade do produto',
    functional_area: 'Produto',
    executor_role: 'Engenheiro de Software Sênior',
    parameters: [
      { name: 'feature_nome', type: 'text', label: 'Nome da Feature', required: true },
      { name: 'descricao', type: 'text', label: 'Descrição', required: true },
      { name: 'prioridade', type: 'select', label: 'Prioridade', required: true, options: ['Baixa', 'Média', 'Alta', 'Crítica'] },
      { name: 'estimativa_horas', type: 'number', label: 'Estimativa (horas)', required: true, min: 4, max: 400 },
      { name: 'deadline', type: 'date', label: 'Deadline', required: true }
    ],
    expected_metrics: [
      { name: 'tempo_desenvolvimento', target: 80, unit: 'horas', description: 'Horas de desenvolvimento' },
      { name: 'bugs_producao', target: 2, unit: 'bugs', description: 'Bugs em produção' },
      { name: 'cobertura_testes', target: 85, unit: '%', description: 'Cobertura de testes' }
    ],
    supervision_required: true,
    estimated_duration_hours: 80,
    priority: 'high',
    automation_potential: 'low'
  },
  {
    code: 'PRD_CORRIGIR_BUG',
    name: 'Corrigir Bug',
    description: 'Correção de bug reportado em produção',
    functional_area: 'Produto',
    executor_role: 'Engenheiro de Software Sênior',
    parameters: [
      { name: 'bug_id', type: 'text', label: 'ID do Bug', required: true },
      { name: 'severidade', type: 'select', label: 'Severidade', required: true, options: ['Trivial', 'Menor', 'Maior', 'Crítico', 'Bloqueante'] },
      { name: 'impacto', type: 'select', label: 'Impacto', required: true, options: ['Baixo', 'Médio', 'Alto'] },
      { name: 'descricao', type: 'text', label: 'Descrição do Bug', required: true }
    ],
    expected_metrics: [
      { name: 'tempo_resolucao', target: 8, unit: 'horas', description: 'Tempo de correção' },
      { name: 'regressoes', target: 0, unit: 'bugs', description: 'Bugs introduzidos' }
    ],
    supervision_required: false,
    estimated_duration_hours: 8,
    priority: 'urgent',
    automation_potential: 'low'
  },
  {
    code: 'PRD_LANCAR_VERSAO',
    name: 'Lançar Versão',
    description: 'Deploy de nova versão para produção',
    functional_area: 'Produto',
    executor_role: 'Gerente de Produto',
    parameters: [
      { name: 'versao', type: 'text', label: 'Número da Versão', required: true, placeholder: 'Ex: 2.5.0' },
      { name: 'tipo_release', type: 'select', label: 'Tipo de Release', required: true, options: ['Major', 'Minor', 'Patch', 'Hotfix'] },
      { name: 'features', type: 'text', label: 'Features Incluídas', required: true },
      { name: 'data_lancamento', type: 'date', label: 'Data de Lançamento', required: true }
    ],
    expected_metrics: [
      { name: 'downtime', target: 5, unit: 'minutos', description: 'Tempo de indisponibilidade' },
      { name: 'rollback_rate', target: 2, unit: '%', description: 'Taxa de rollback' },
      { name: 'adocao', target: 70, unit: '%', description: 'Adoção em 7 dias' }
    ],
    supervision_required: true,
    estimated_duration_hours: 16,
    priority: 'high',
    automation_potential: 'medium'
  },
  {
    code: 'PRD_EXECUTAR_TESTES',
    name: 'Executar Testes',
    description: 'Execução de testes de qualidade (QA)',
    functional_area: 'Produto',
    executor_role: 'Especialista em QA',
    parameters: [
      { name: 'tipo_teste', type: 'multiselect', label: 'Tipo de Teste', required: true, options: ['Unitário', 'Integração', 'E2E', 'Performance', 'Segurança', 'Usabilidade'] },
      { name: 'escopo', type: 'text', label: 'Escopo', required: true },
      { name: 'ambiente', type: 'select', label: 'Ambiente', required: true, options: ['Dev', 'Staging', 'Produção'] }
    ],
    expected_metrics: [
      { name: 'casos_teste', target: 50, unit: 'casos', description: 'Casos de teste executados' },
      { name: 'bugs_encontrados', target: 5, unit: 'bugs', description: 'Bugs identificados' },
      { name: 'cobertura', target: 90, unit: '%', description: 'Cobertura de testes' }
    ],
    supervision_required: false,
    estimated_duration_hours: 24,
    priority: 'normal',
    automation_potential: 'high'
  },
  {
    code: 'PRD_REVISAR_CODIGO',
    name: 'Revisar Código',
    description: 'Code review de pull request',
    functional_area: 'Produto',
    executor_role: 'Engenheiro de Software Sênior',
    parameters: [
      { name: 'pr_id', type: 'text', label: 'ID do Pull Request', required: true },
      { name: 'autor', type: 'text', label: 'Autor do PR', required: true },
      { name: 'linhas_alteradas', type: 'number', label: 'Linhas Alteradas', required: false, min: 1 }
    ],
    expected_metrics: [
      { name: 'tempo_review', target: 4, unit: 'horas', description: 'Tempo de revisão' },
      { name: 'issues_encontradas', target: 3, unit: 'issues', description: 'Issues identificadas' }
    ],
    supervision_required: false,
    estimated_duration_hours: 4,
    priority: 'normal',
    automation_potential: 'medium'
  }
];

// =====================================================
// QUALIDADE (3 templates)
// =====================================================

export const QUALIDADE_TEMPLATES: TaskTemplate[] = [
  {
    code: 'QUA_EXECUTAR_AUDITORIA',
    name: 'Executar Auditoria',
    description: 'Auditoria de processos e conformidade',
    functional_area: 'Qualidade',
    executor_role: 'Auditor de Processos',
    parameters: [
      { name: 'tipo_auditoria', type: 'select', label: 'Tipo de Auditoria', required: true, options: ['Processos', 'Qualidade', 'Segurança', 'Conformidade', 'ISO'] },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Marketing', 'Vendas', 'Financeiro', 'Operações', 'Produto', 'Todos'] },
      { name: 'data_auditoria', type: 'date', label: 'Data da Auditoria', required: true }
    ],
    expected_metrics: [
      { name: 'nao_conformidades', target: 3, unit: 'itens', description: 'Não conformidades encontradas' },
      { name: 'score_qualidade', target: 85, unit: 'pontos', description: 'Score de qualidade (0-100)' }
    ],
    supervision_required: false,
    estimated_duration_hours: 16,
    priority: 'normal',
    automation_potential: 'low'
  },
  {
    code: 'QUA_REVISAR_PROCESSO',
    name: 'Revisar Processo',
    description: 'Análise e melhoria de processo existente',
    functional_area: 'Qualidade',
    executor_role: 'Gerente de Qualidade & Auditoria',
    parameters: [
      { name: 'processo_nome', type: 'text', label: 'Nome do Processo', required: true },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Marketing', 'Vendas', 'Financeiro', 'Operações', 'Produto'] },
      { name: 'problemas_identificados', type: 'text', label: 'Problemas Identificados', required: true }
    ],
    expected_metrics: [
      { name: 'melhorias_propostas', target: 5, unit: 'melhorias', description: 'Melhorias identificadas' },
      { name: 'reducao_tempo', target: 20, unit: '%', description: 'Redução de tempo esperada' }
    ],
    supervision_required: true,
    estimated_duration_hours: 24,
    priority: 'normal',
    automation_potential: 'low'
  },
  {
    code: 'QUA_VERIFICAR_CONFORMIDADE',
    name: 'Verificar Conformidade',
    description: 'Verificação de conformidade com normas/regulamentos',
    functional_area: 'Qualidade',
    executor_role: 'Analista de Qualidade',
    parameters: [
      { name: 'norma', type: 'select', label: 'Norma/Regulamento', required: true, options: ['ISO 9001', 'LGPD', 'SOC 2', 'PCI DSS', 'Outra'] },
      { name: 'escopo', type: 'text', label: 'Escopo da Verificação', required: true },
      { name: 'periodicidade', type: 'select', label: 'Periodicidade', required: true, options: ['Mensal', 'Trimestral', 'Semestral', 'Anual'] }
    ],
    expected_metrics: [
      { name: 'conformidade', target: 95, unit: '%', description: 'Taxa de conformidade' },
      { name: 'acoes_corretivas', target: 2, unit: 'ações', description: 'Ações corretivas necessárias' }
    ],
    supervision_required: false,
    estimated_duration_hours: 16,
    priority: 'high',
    automation_potential: 'medium'
  }
];

// =====================================================
// GENÉRICOS (3 templates)
// =====================================================

export const GENERIC_TEMPLATES: TaskTemplate[] = [
  {
    code: 'GEN_REUNIAO',
    name: 'Agendar Reunião',
    description: 'Organização de reunião com stakeholders',
    functional_area: 'Geral',
    executor_role: 'Qualquer',
    parameters: [
      { name: 'assunto', type: 'text', label: 'Assunto da Reunião', required: true },
      { name: 'participantes', type: 'text', label: 'Participantes', required: true },
      { name: 'data', type: 'date', label: 'Data', required: true },
      { name: 'duracao', type: 'number', label: 'Duração (minutos)', required: true, min: 15, max: 480, defaultValue: 60 },
      { name: 'formato', type: 'select', label: 'Formato', required: true, options: ['Online', 'Presencial', 'Híbrido'] }
    ],
    expected_metrics: [
      { name: 'comparecimento', target: 90, unit: '%', description: 'Taxa de comparecimento' },
      { name: 'acao_items', target: 3, unit: 'itens', description: 'Action items gerados' }
    ],
    supervision_required: false,
    estimated_duration_hours: 1,
    priority: 'normal',
    automation_potential: 'high'
  },
  {
    code: 'GEN_PESQUISA',
    name: 'Realizar Pesquisa',
    description: 'Pesquisa e levantamento de informações',
    functional_area: 'Geral',
    executor_role: 'Qualquer',
    parameters: [
      { name: 'tema', type: 'text', label: 'Tema da Pesquisa', required: true },
      { name: 'objetivo', type: 'text', label: 'Objetivo', required: true },
      { name: 'fontes', type: 'multiselect', label: 'Fontes', required: true, options: ['Web', 'Relatórios', 'Entrevistas', 'Dados Internos', 'Benchmarking'] },
      { name: 'prazo', type: 'date', label: 'Prazo de Entrega', required: true }
    ],
    expected_metrics: [
      { name: 'insights', target: 10, unit: 'insights', description: 'Insights gerados' },
      { name: 'fontes_consultadas', target: 5, unit: 'fontes', description: 'Fontes consultadas' }
    ],
    supervision_required: false,
    estimated_duration_hours: 16,
    priority: 'normal',
    automation_potential: 'low'
  },
  {
    code: 'GEN_DOCUMENTACAO',
    name: 'Criar Documentação',
    description: 'Elaboração de documentação técnica ou processo',
    functional_area: 'Geral',
    executor_role: 'Qualquer',
    parameters: [
      { name: 'tipo_doc', type: 'select', label: 'Tipo de Documento', required: true, options: ['Técnica', 'Processo', 'Tutorial', 'Manual', 'Especificação', 'Relatório'] },
      { name: 'titulo', type: 'text', label: 'Título', required: true },
      { name: 'audiencia', type: 'select', label: 'Audiência', required: true, options: ['Técnica', 'Negócio', 'Cliente', 'Interno', 'Todos'] },
      { name: 'formato', type: 'select', label: 'Formato', required: true, options: ['Markdown', 'PDF', 'Google Docs', 'Confluence', 'Notion'] }
    ],
    expected_metrics: [
      { name: 'paginas', target: 10, unit: 'páginas', description: 'Páginas criadas' },
      { name: 'completude', target: 95, unit: '%', description: 'Completude da documentação' }
    ],
    supervision_required: false,
    estimated_duration_hours: 16,
    priority: 'normal',
    automation_potential: 'low'
  }
];

// =====================================================
// AGREGADORES
// =====================================================

export const ALL_TEMPLATES: TaskTemplate[] = [
  ...MARKETING_TEMPLATES,
  ...VENDAS_TEMPLATES,
  ...FINANCEIRO_TEMPLATES,
  ...OPERACOES_TEMPLATES,
  ...PRODUTO_TEMPLATES,
  ...QUALIDADE_TEMPLATES,
  ...GENERIC_TEMPLATES
];

export const TEMPLATES_BY_AREA: Record<string, TaskTemplate[]> = {
  'Marketing': MARKETING_TEMPLATES,
  'Vendas': VENDAS_TEMPLATES,
  'Financeiro': FINANCEIRO_TEMPLATES,
  'Operações': OPERACOES_TEMPLATES,
  'Produto': PRODUTO_TEMPLATES,
  'Qualidade': QUALIDADE_TEMPLATES,
  'Geral': GENERIC_TEMPLATES
};

export function getTemplateByCode(code: string): TaskTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.code === code);
}

export function getTemplatesByArea(area: string): TaskTemplate[] {
  return TEMPLATES_BY_AREA[area] || [];
}

export function getTemplatesByRole(role: string): TaskTemplate[] {
  return ALL_TEMPLATES.filter(t => 
    t.executor_role === role || t.executor_role === 'Qualquer'
  );
}

export function searchTemplates(query: string): TaskTemplate[] {
  const lowerQuery = query.toLowerCase();
  return ALL_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.code.toLowerCase().includes(lowerQuery)
  );
}
