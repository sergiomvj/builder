'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { DatabaseService } from '@/lib/database';
import { ExecutionMonitor } from '@/components/ExecutionMonitor';
import { 
  Play,
  Pause,
  Settings,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Code,
  Zap,
  Database,
  Activity,
  Eye,
  FileCode,
  Users,
  Brain,
  BarChart3,
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Mail,
  HeadphonesIcon,
  DollarSign,
  TrendingUp,
  Archive,
  Building,
  Plus
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

// Sistemas reais do projeto VCM
const realSystems = {
  cascade: [
    {
      id: 'generate_biografias',
      nome: 'Gerador de Biografias',
      arquivo: '01_biografias.js',
      descricao: 'Sistema real de geração automática de biografias detalhadas para personas',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['Geração via LLM', 'Validação automática', 'Export JSON', 'Integração VCM Central'],
      dependencias: [],
      output: 'personas table',
      tempoMedio: '2-3 min por empresa'
    },
    {
      id: 'generate_atribuicoes',
      nome: 'Atribuições Contextualizadas',
      arquivo: '01.5_generate_atribuicoes_contextualizadas.js',
      descricao: 'Geração de atribuições específicas para cada cargo via LLM (Master Fluxo: Cargos tem atribuições)',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['LLM contextual', 'Zero templates', 'Análise específica por ramo', 'Fallback inteligente'],
      dependencias: ['personas'],
      output: 'personas_atribuicoes table',
      tempoMedio: '3-5 min por empresa'
    },
    {
      id: 'generate_competencias',
      nome: 'Analisador de Competências', 
      arquivo: '02_competencias.js',
      descricao: 'Extração e análise de competências técnicas e comportamentais',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['Análise semântica', 'Categorização automática', 'Scoring de habilidades'],
      dependencias: ['biografias'],
      output: 'personas_competencias table',
      tempoMedio: '1-2 min'
    },
    {
      id: 'generate_avatares',
      nome: 'Gerador de Avatares', 
      arquivo: '03_avatares.js',
      descricao: 'Geração automática de avatares profissionais para personas usando IA',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['Geração via DALL-E', 'Múltiplos estilos', 'Alta resolução', 'Armazenamento automático'],
      dependencias: ['competencias'],
      output: 'avatares_personas table',
      tempoMedio: '30-60 seg por persona'
    },
    {
      id: 'generate_tech_specs',
      nome: 'Especificações Técnicas',
      arquivo: '04_tech_specs.js', 
      descricao: 'Geração de specs técnicas e requisitos do sistema',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['Análise de requisitos', 'Documentação automática', 'Validação técnica'],
      dependencias: ['avatares'],
      output: 'empresas_tech_specs table',
      tempoMedio: '2-4 min'
    },
    {
      id: 'populate_rag',
      nome: 'RAG Knowledge Base',
      arquivo: '05_rag_knowledge.js',
      descricao: 'População do banco de conhecimento RAG com dados estruturados',
      status: 'ativo',
      categoria: 'core',
      funcionalidades: ['Indexação vetorial', 'Embeddings', 'Sync multi-database'],
      dependencias: ['tech_specs'],
      output: 'empresas_knowledge_base table',
      tempoMedio: '3-5 min'
    },
    {
      id: 'generate_fluxos',
      nome: 'Fluxos de Trabalho',
      arquivo: '06_fluxos.js',
      descricao: 'Criação automática de fluxos de trabalho para automação empresarial',
      status: 'ativo',
      categoria: 'core', 
      funcionalidades: ['Mapeamento de processos', 'Automação de fluxos', 'Análise de colaboração'],
      dependencias: ['rag'],
      output: 'empresas_workflows table',
      tempoMedio: '2-3 min'
    }
  ],
  
  subsistemas: [
    {
      id: 'ai_assistant',
      nome: 'AI Assistant System',
      componente: 'AIAssistantSystem',
      descricao: 'Sistema de assistente AI para automação de tarefas e suporte',
      status: 'ativo',
      categoria: 'ai',
      funcionalidades: ['Chat inteligente', 'Automação de tarefas', 'Análise preditiva']
    },
    {
      id: 'crm_system', 
      nome: 'CRM System',
      componente: 'CRMSystem',
      descricao: 'Sistema completo de gestão de relacionamento com clientes',
      status: 'ativo',
      categoria: 'sales',
      funcionalidades: ['Gestão de leads', 'Pipeline de vendas', 'Automação de follow-up']
    },
    {
      id: 'analytics_reporting',
      nome: 'Analytics & Reporting',
      componente: 'AnalyticsReportingSystem', 
      descricao: 'Sistema de análise de dados e relatórios avançados',
      status: 'ativo',
      categoria: 'analytics',
      funcionalidades: ['Dashboards dinâmicos', 'KPIs personalizados', 'Relatórios automáticos']
    },
    {
      id: 'business_intelligence',
      nome: 'Business Intelligence',
      componente: 'BusinessIntelligenceSystem',
      descricao: 'Plataforma de inteligência empresarial e análise estratégica', 
      status: 'ativo',
      categoria: 'bi',
      funcionalidades: ['Data mining', 'Análise preditiva', 'Insights estratégicos']
    },
    {
      id: 'sdr_leadgen',
      nome: 'SDR Lead Generation',
      componente: 'SDRLeadGenSystem',
      descricao: 'Sistema automatizado de geração e qualificação de leads',
      status: 'ativo', 
      categoria: 'sales',
      funcionalidades: ['Prospecção automática', 'Qualificação de leads', 'Cadência de outreach']
    },
    {
      id: 'social_media',
      nome: 'Social Media Management',
      componente: 'SocialMediaSystem',
      descricao: 'Gestão completa de redes sociais e marketing digital',
      status: 'ativo',
      categoria: 'marketing',
      funcionalidades: ['Agendamento de posts', 'Analytics sociais', 'Gestão multi-plataforma']
    },
    {
      id: 'content_creation',
      nome: 'Content Creation',
      componente: 'ContentCreationSystem', 
      descricao: 'Sistema de criação e gestão de conteúdo automatizada',
      status: 'ativo',
      categoria: 'marketing',
      funcionalidades: ['Geração de conteúdo AI', 'Calendário editorial', 'SEO otimização']
    },
    {
      id: 'customer_support',
      nome: 'Customer Support',
      componente: 'CustomerSupportSystem',
      descricao: 'Sistema completo de atendimento e suporte ao cliente',
      status: 'ativo',
      categoria: 'support',
      funcionalidades: ['Tickets automáticos', 'Chat bot', 'Base de conhecimento']
    },
    {
      id: 'email_management',
      nome: 'Email Management',
      componente: 'EmailManagementSystem',
      descricao: 'Sistema de gestão e automação de emails marketing',
      status: 'ativo',
      categoria: 'marketing',
      funcionalidades: ['Campanhas automáticas', 'Segmentação', 'A/B testing']
    },
    {
      id: 'financial_system',
      nome: 'Financial System', 
      componente: 'FinancialSystem',
      descricao: 'Sistema financeiro completo com controle de orçamento',
      status: 'ativo',
      categoria: 'finance',
      funcionalidades: ['Controle financeiro', 'Relatórios', 'Projeções']
    },
    {
      id: 'hr_employee',
      nome: 'HR Employee Management',
      componente: 'HREmployeeManagementSystem',
      descricao: 'Sistema de gestão de recursos humanos e funcionários',
      status: 'ativo',
      categoria: 'hr',
      funcionalidades: ['Gestão de personas', 'Avaliações', 'Desenvolvimento']
    },
    {
      id: 'ecommerce',
      nome: 'E-commerce System',
      componente: 'EcommerceSystem',
      descricao: 'Plataforma completa de comércio eletrônico',
      status: 'ativo',
      categoria: 'sales',
      funcionalidades: ['Catálogo de produtos', 'Processamento de pagamentos', 'Gestão de estoque']
    }
  ]
};

export default function ToolsPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('empresas');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<{ nome: string; id: string; codigo: string } | null>(null);
  const [lastExecution, setLastExecution] = useState<{
    script: string;
    empresa: string;
    timestamp: string;
    status: 'success' | 'error' | 'running';
  } | null>(null);
  const router = useRouter();
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      // Simular carregamento inicial
      setTimeout(() => setLoading(false), 1000);
    }
  }, [isClient]);

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'core': return <Database className="h-4 w-4" />;
      case 'ai': return <Brain className="h-4 w-4" />;
      case 'sales': return <TrendingUp className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'bi': return <BarChart3 className="h-4 w-4" />;
      case 'marketing': return <MessageCircle className="h-4 w-4" />;
      case 'support': return <HeadphonesIcon className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'hr': return <Users className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'desenvolvimento':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Desenvolvimento</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExecuteScript = async (scriptId: string) => {
    try {
      // Carregar empresas reais do Supabase
      const empresasData = await DatabaseService.getEmpresas();
      const empresasDisponiveis = empresasData?.map(emp => ({ nome: emp.nome, id: emp.id, codigo: emp.codigo })) || [];
      
      if (empresasDisponiveis.length === 0) {
        alert('Nenhuma empresa encontrada. Crie uma empresa primeiro em /empresas');
        return;
      }

      // Usar empresa já selecionada ou forçar seleção
      let empresaParaExecucao = empresaSelecionada;
      
      if (!empresaParaExecucao) {
        if (empresasDisponiveis.length === 1) {
          empresaParaExecucao = empresasDisponiveis[0];
          setEmpresaSelecionada(empresaParaExecucao);
        } else {
          // Criar diálogo de seleção obrigatória
          const opcoes = empresasDisponiveis.map((empresa, index) => `${index + 1}. ${empresa.nome}`).join('\\n');
          const resposta = prompt(`🏢 SELECIONE A EMPRESA para executar o script "${scriptId}":

${opcoes}

Digite o número da empresa (OBRIGATÓRIO):`);
          
          if (!resposta || resposta.trim() === '') {
            alert('⚠️ Execução cancelada: Seleção de empresa é OBRIGATÓRIA!');
            return;
          }
          
          const indice = parseInt(resposta.trim()) - 1;
          if (indice >= 0 && indice < empresasDisponiveis.length) {
            empresaParaExecucao = empresasDisponiveis[indice];
            setEmpresaSelecionada(empresaParaExecucao);
          } else {
            alert('❌ Seleção inválida! Tente novamente.');
            return;
          }
        }
      }
      
      // Confirmação final
      if (!confirm(`🚀 Executar script "${scriptId}" para a empresa "${empresaParaExecucao.nome}"?`)) {
        return;
      }

      console.log(`🔄 EXECUÇÃO REAL - Script ${scriptId} para empresa: ${empresaParaExecucao.nome}`);
      
      // EXECUÇÃO REAL via API
      setLastExecution({
        script: scriptId,
        empresa: empresaParaExecucao.nome,
        timestamp: new Date().toLocaleString(),
        status: 'running'
      });

      try {
        let response;
        
        // Rota específica baseada no script
        if (scriptId === 'generate_biografias') {
          response = await fetch('/api/execute-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: 'generate_biografias'
            })
          });
        } else if (scriptId === 'generate_atribuicoes') {
          // Novo script de atribuições contextualizadas via LLM
          response = await fetch('/api/generate-atribuicoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresaId: empresaParaExecucao.id
            })
          });
        } else if (scriptId === 'generate_avatares') {
          // Execução específica do script de avatares
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresaId: empresaParaExecucao.id,
              script_name: 'generate_avatares'
            })
          });
        } else if (scriptId === 'generate_competencias') {
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: 'generate_competencias'
            })
          });
        } else if (scriptId === 'generate_tech_specs') {
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: 'generate_tech_specs'
            })
          });
        } else if (scriptId === 'populate_rag') {
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: 'populate_rag'
            })
          });
        } else if (scriptId === 'generate_fluxos') {
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: 'generate_fluxos'
            })
          });
        } else if (scriptId === 'full_cascade') {
          // Execução da cascata completa (todos os 6 scripts em sequência)
          response = await fetch('/api/cascade-nodejs', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresaCodigo: empresaParaExecucao.codigo,
              executeAll: true // Flag para executar todos os scripts
            })
          });
        } else {
          // Para outros scripts não mapeados, usar endpoint genérico
          response = await fetch('/api/execute-script', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              empresa_id: empresaParaExecucao.id,
              script_name: scriptId
            })
          });
        }
        
        const result = await response.json();
        
        if (response.ok && result.success !== false) {
          const executionTypeMsg = scriptId === 'full_cascade' ? 'Cascata Completa' : `Script "${scriptId}"`;
          const detailsMsg = result.executionType ? `\nTipo: ${result.executionType}` : '';
          const scriptsMsg = result.summary ? `\nScripts executados: ${result.summary.successfulScripts}/${result.summary.totalScripts}` : '';
          
          alert(`✅ EXECUÇÃO CONCLUÍDA: ${executionTypeMsg}!\n\nEmpresa: ${empresaParaExecucao.nome}${detailsMsg}${scriptsMsg}\n\nResultado: ${result.message || 'Processamento concluído com sucesso'}`);
          
          setLastExecution({
            script: scriptId === 'full_cascade' ? 'Cascata Completa (5 scripts)' : scriptId,
            empresa: empresaSelecionada.nome,
            timestamp: new Date().toLocaleString(),
            status: 'success'
          });
        } else {
          throw new Error(result.message || result.error || 'Erro desconhecido');
        }
        
      } catch (error: any) {
        console.error('❌ Erro na execução real:', error);
        alert(`❌ ERRO EXECUÇÃO REAL: ${error.message}\n\nVerifique o console para detalhes.`);
        
        setLastExecution({
          script: scriptId,
          empresa: empresaSelecionada.nome,
          timestamp: new Date().toLocaleString(),
          status: 'error'
        });
      }
      
    } catch (error) {
      console.error('Erro ao executar script:', error);
      alert('❌ Erro ao executar script. Verifique o console para detalhes.');
      
      if (lastExecution) {
        setLastExecution({
          ...lastExecution,
          status: 'error'
        });
      }
    }
  };

  const handleViewSystem = (system: any) => {
    // Navegar para a página de subsistemas específica
    router.push('/subsystems');
    console.log('Navegando para subsistemas:', system.nome);
  };

  const handleConfigureSystem = (system: any) => {
    // Navegar para página de configuração do sistema
    router.push('/configuracoes');
    console.log('Navegando para configurações:', system.nome);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isClient) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tools & Scripts VCM</h1>
            <p className="text-gray-600 mt-1">Gerenciamento unificado de empresas, execução de scripts e subsistemas empresariais</p>
          </div>
          <Button className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar Status</span>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar sistemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="core">Core (Scripts Principais)</option>
            <option value="ai">Inteligência Artificial</option>
            <option value="sales">Vendas & CRM</option>
            <option value="marketing">Marketing</option>
            <option value="analytics">Analytics & BI</option>
            <option value="support">Suporte</option>
            <option value="finance">Financeiro</option>
            <option value="hr">Recursos Humanos</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="empresas">Empresas & Scripts</TabsTrigger>
          <TabsTrigger value="execucao">Controle de Execução</TabsTrigger>
          <TabsTrigger value="cascade">Scripts Core (5)</TabsTrigger>
          <TabsTrigger value="subsistemas">Subsistemas ({realSystems.subsistemas.length})</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="space-y-4">
          <Alert className="mb-6">
            <Building className="h-4 w-4" />
            <AlertDescription>
              <strong>Gestão Unificada:</strong> Execute scripts para empresas específicas, monitore status de execução e veja resultados em tempo real.
              Esta seção centraliza o gerenciamento de empresas e execução de scripts que antes estava espalhado em diferentes páginas.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção de Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Empresas Disponíveis</span>
                </CardTitle>
                <CardDescription>
                  Selecione uma empresa para executar scripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Conteúdo será preenchido dinamicamente via JavaScript */}
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">ARVA Tech Solutions</p>
                        <p className="text-xs text-gray-500">15 personas • Scripts: 4/5 concluídos</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/empresas'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ver Todas as Empresas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status de Scripts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Status dos Scripts</span>
                </CardTitle>
                <CardDescription>
                  Status de execução dos scripts principais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1. Biografias</span>
                    <Badge className="bg-green-100 text-green-800">✓ Concluído</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">2. Competências</span>
                    <Badge className="bg-green-100 text-green-800">✓ Concluído</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">3. Tech Specs</span>
                    <Badge className="bg-blue-100 text-blue-800">⏳ Executando</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">4. RAG Database</span>
                    <Badge variant="outline">⏸ Pendente</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">5. Workflows N8N</span>
                    <Badge variant="outline">⏸ Pendente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Execução em Cascata */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <span>Execução Unificada</span>
                </CardTitle>
                <CardDescription>
                  Execute scripts individuais ou em cascata completa para a empresa selecionada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Scripts Individuais */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">Scripts Individuais</h4>
                    <div className="space-y-2">
                      {realSystems.cascade.slice(0, 5).map((script) => (
                        <Button
                          key={script.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleExecuteScript(script.id)}
                        >
                          <Play className="h-3 w-3 mr-2" />
                          {script.nome}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Cascata Completa */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">Execução em Cascata</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3">
                        Execute todos os 5 scripts em sequência automática (1→2→3→4→5)
                      </p>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleExecuteScript('full_cascade')}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Executar Cascata Completa
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Última Execução */}
          {lastExecution && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Última Execução</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{lastExecution.script}</p>
                    <p className="text-xs text-gray-500">
                      Empresa: {lastExecution.empresa} • {lastExecution.timestamp}
                    </p>
                  </div>
                  <Badge 
                    className={
                      lastExecution.status === 'success' ? 'bg-green-100 text-green-800' :
                      lastExecution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {lastExecution.status === 'success' ? '✓ Sucesso' :
                     lastExecution.status === 'running' ? '⏳ Executando' :
                     '✗ Erro'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="execucao" className="space-y-4">
          <Alert className="mb-6">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>🎯 Controle de Execução em Tempo Real:</strong> Execute scripts com monitoramento completo de progresso, logs e status.
              Sistema desenvolvido para o Master Fluxo VCM.
            </AlertDescription>
          </Alert>

          {!empresaSelecionada ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Selecione uma empresa acima para visualizar os controles de execução</p>
                <Button 
                  onClick={() => setEmpresaSelecionada({ nome: 'ARVA Tech Solutions', id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17', codigo: 'ARVA' })}
                  className="mt-4"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Usar ARVA Tech (Teste)
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Empresa Selecionada: {empresaSelecionada.nome}</CardTitle>
                  <CardDescription>
                    Scripts com controle de execução disponível para {empresaSelecionada.nome}
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {/* Script de Atribuições com Monitoramento Completo */}
                <ExecutionMonitor
                  scriptName="01.5 - Atribuições Contextualizadas"
                  apiEndpoint="/api/generate-atribuicoes"
                  onExecutionComplete={() => {
                    // Recarregar dados ou fazer alguma ação
                    console.log('🎉 Execução das atribuições concluída!')
                  }}
                />

                {/* Placeholder para próximos scripts */}
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-6 text-center">
                    <Plus className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">Próximos scripts com controle de execução</p>
                    <p className="text-sm text-gray-500 mt-1">
                      02_competencias.js, 03_avatares.js, 04_tech_specs.js, etc.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cascade" className="space-y-4">
          <Alert className="mb-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Scripts Core do VCM:</strong> Sistema de processamento em cascata (1→2→3→4→5) que transforma empresas em sistemas funcionais completos.
              Cada script é um arquivo real no diretório AUTOMACAO/ do projeto.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realSystems.cascade
              .filter(script => 
                (selectedCategory === 'todos' || script.categoria === selectedCategory) &&
                (script.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 script.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((script) => (
              <Card key={script.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(script.categoria)}
                      <span>{script.nome}</span>
                    </div>
                    {getStatusBadge(script.status)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {script.descricao}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs bg-gray-100 p-2 rounded font-mono">
                      📁 AUTOMACAO/{script.arquivo}
                    </div>
                    
                    <div className="text-sm">
                      <div className="mb-1 font-medium">Funcionalidades:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {script.funcionalidades.map((func, idx) => (
                          <li key={idx}>• {func}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-medium">Output:</div>
                        <div className="text-gray-600">{script.output}</div>
                      </div>
                      <div>
                        <div className="font-medium">Tempo:</div>
                        <div className="text-gray-600">{script.tempoMedio}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleExecuteScript(script.id)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewSystem(script)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureSystem(script)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subsistemas" className="space-y-4">
          <Alert className="mb-6">
            <Building className="h-4 w-4" />
            <AlertDescription>
              <strong>Subsistemas Empresariais:</strong> Módulos especializados para diferentes áreas da empresa. 
              Cada subsistema é um componente React funcional real em src/components/sub-sistemas/
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realSystems.subsistemas
              .filter(system => 
                (selectedCategory === 'todos' || system.categoria === selectedCategory) &&
                (system.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 system.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((system) => (
              <Card key={system.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(system.categoria)}
                      <span>{system.nome}</span>
                    </div>
                    {getStatusBadge(system.status)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {system.descricao}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-xs bg-gray-100 p-2 rounded font-mono">
                      🧩 components/sub-sistemas/{system.componente}.tsx
                    </div>
                    
                    <div className="text-sm">
                      <div className="mb-1 font-medium">Recursos:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {system.funcionalidades.map((func, idx) => (
                          <li key={idx}>• {func}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewSystem(system)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Sistema
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureSystem(system)}
                      >
                        <Settings className="h-4 w-4" />
                        Ajustar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automacoes" className="space-y-4">
          <Alert className="mb-6">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Automações em Desenvolvimento:</strong> Esta seção mostrará automações N8N e scripts de manutenção 
              quando conectadas ao sistema de pipeline.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Automações em Desenvolvimento</h3>
                <p className="text-gray-500 mb-4">Esta seção será populada com workflows N8N gerados pelos scripts core.</p>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Automações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
