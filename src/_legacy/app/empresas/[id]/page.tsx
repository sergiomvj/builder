'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatabaseService } from '@/lib/database';
import { CompanyForm } from '@/components/company-form';
import { QuickCascadePanel } from '@/components/quick-cascade-panel';
import { ScriptProgressMonitor } from '@/components/ScriptProgressMonitor';
import { LiveExecutionMonitor } from '@/components/LiveExecutionMonitor';
import { RetryPanel } from '@/components/retry-panel';
import { useEmpresaById } from '@/lib/supabase-hooks';
import { supabase } from '@/lib/supabase';
import {
  Building,
  ArrowLeft,
  Users,
  Globe,
  MapPin,
  Calendar,
  Edit,
  Activity,
  FileText,
  Database,
  Zap,
  Play
} from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  codigo: string;
  industria: string;
  pais: string;
  idiomas: string[];
  status: 'ativa' | 'inativa' | 'processando';
  total_personas: number;
  created_at: string;
  dominio?: string;
  descricao: string;
  scripts_status: {
    company_foundation: boolean;
    create_personas: boolean;
    biografias: boolean;
    atribuicoes: boolean;
    competencias: boolean;
    avatar_prompts: boolean;
    avatar_images: boolean;
    avatar_download: boolean;
    automation_analysis: boolean;
    rag_recommendations: boolean;
    export_topics: boolean;
    add_custom_topics: boolean;
    generate_documents_rag: boolean;
    workflows_n8n: boolean;
    supervision_chains: boolean;
    machine_learning: boolean;
    auditoria: boolean;
    knowledge_base: boolean;
    test_rag_system: boolean;
  };
  ceo_gender: 'masculino' | 'feminino';
  executives_male: number;
  executives_female: number;
  assistants_male: number;
  assistants_female: number;
  specialists_male: number;
  specialists_female: number;
}

export default function EmpresaDetalhes() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params.id as string;
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [executandoScript, setExecutandoScript] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [personasReais, setPersonasReais] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [scriptProgress, setScriptProgress] = useState<{
    status: string;
    current: number;
    total: number;
    currentPersona: string;
  } | null>(null);

  useEffect(() => {
    loadEmpresa();
  }, [empresaId]);
  
  // Polling de progresso quando script está executando
  useEffect(() => {
    if (!executandoScript) {
      setScriptProgress(null);
      return;
    }
    
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/automation/progress');
        const data = await response.json();
        setScriptProgress(data);
        
        if (data.status === 'completed' || data.status === 'stopped' || data.status === 'error') {
          setExecutandoScript(null);
          loadEmpresa(); // Recarregar empresa quando terminar
        }
      } catch (error) {
        console.error('Erro ao buscar progresso:', error);
      }
    };
    
    fetchProgress();
    const interval = setInterval(fetchProgress, 2000); // Atualiza a cada 2 segundos
    
    return () => clearInterval(interval);
  }, [executandoScript]);

  const loadEmpresa = async () => {
    try {
      setLoading(true);
      const empresas = await DatabaseService.getEmpresas();
      const empresaEncontrada = empresas?.find(e => e.id === empresaId);
      
      // Garantir que scripts_status tenha todos os campos necessários
      if (empresaEncontrada) {
        empresaEncontrada.scripts_status = {
          company_foundation: empresaEncontrada.scripts_status?.company_foundation || false,
          create_personas: empresaEncontrada.scripts_status?.create_personas || false,
          biografias: empresaEncontrada.scripts_status?.biografias || false,
          atribuicoes: empresaEncontrada.scripts_status?.atribuicoes || false,
          competencias: empresaEncontrada.scripts_status?.competencias || false,
          avatar_prompts: empresaEncontrada.scripts_status?.avatar_prompts || false,
          avatar_images: empresaEncontrada.scripts_status?.avatar_images || false,
          avatar_download: empresaEncontrada.scripts_status?.avatar_download || false,
          automation_analysis: empresaEncontrada.scripts_status?.automation_analysis || false,
          rag_recommendations: empresaEncontrada.scripts_status?.rag_recommendations || false,
          export_topics: empresaEncontrada.scripts_status?.export_topics || false,
          add_custom_topics: empresaEncontrada.scripts_status?.add_custom_topics || false,
          generate_documents_rag: empresaEncontrada.scripts_status?.generate_documents_rag || false,
          workflows_n8n: empresaEncontrada.scripts_status?.workflows_n8n || false,
          supervision_chains: empresaEncontrada.scripts_status?.supervision_chains || false,
          machine_learning: empresaEncontrada.scripts_status?.machine_learning || false,
          auditoria: empresaEncontrada.scripts_status?.auditoria || false,
          knowledge_base: empresaEncontrada.scripts_status?.knowledge_base || false,
          test_rag_system: empresaEncontrada.scripts_status?.test_rag_system || false,
        };
      }
      
      setEmpresa(empresaEncontrada || null);
      
      // Carregar personas reais para esta empresa E atualizar status
      if (empresaEncontrada) {
        await loadPersonasReais(empresaEncontrada);
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonasReais = async (empresaAtual?: any) => {
    try {
      setLoadingPersonas(true);
      console.log(`🔍 [loadPersonasReais] Buscando personas para empresaId: ${empresaId}`);
      const personas = await DatabaseService.getPersonas(empresaId);
      console.log(`📊 [loadPersonasReais] Personas encontradas:`, personas?.map(p => ({ 
        id: p.id, 
        nome: p.full_name, 
        empresa_id: p.empresa_id,
        empresa_nome: p.empresas?.nome 
      })));
      setPersonasReais(personas || []);
      console.log(`📊 Personas reais encontradas para empresa ${empresaId}:`, personas?.length || 0);
      
      // Usar empresaAtual se fornecido, senão usar o estado empresa
      const empresaParaAtualizar = empresaAtual || empresa;
      
      console.log(`🔍 Estado empresa existe?`, !!empresaParaAtualizar);
      console.log(`🔍 Personas existe?`, !!personas);
      
      // Atualizar status real dos scripts baseado nos dados
      if (empresaParaAtualizar && personas) {
        console.log('✅ Entrando no bloco de cálculo de status');
        
        // Buscar dados das tabelas normalizadas para verificar status
        const personaIds = personas.map(p => p.id);
        
        const { data: biografias } = await supabase
          .from('personas_biografias')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: atribuicoes } = await supabase
          .from('personas_atribuicoes')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: competencias } = await supabase
          .from('personas_competencias')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: avatares } = await supabase
          .from('personas_avatares')
          .select('*')
          .in('persona_id', personaIds);
        
        const { data: automationData } = await supabase
          .from('personas_automation_opportunities')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: ragData } = await supabase
          .from('rag_knowledge')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: workflowsData } = await supabase
          .from('personas_workflows')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: mlModels } = await supabase
          .from('personas_machine_learning')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: auditoriaData } = await supabase
          .from('personas_auditorias')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        const { data: knowledgeChunks } = await supabase
          .from('knowledge_chunks')
          .select('persona_id')
          .in('persona_id', personaIds);
        
        // Verificar avatares em 3 etapas
        const hasPrompts = avatares?.some(a => a.prompt_usado) || false;
        const hasGeneratedImages = avatares?.some(a => a.avatar_url) || false;
        const hasLocalImages = avatares?.some(a => a.avatar_local_path) || false;
        
        // Verificar scripts RAG adicionais (06.75, 06.76, 06.8)
        const hasExportTopics = ragData && ragData.length > 0; // Se tem RAG, pode exportar
        const hasCustomTopics = ragData?.some((r: any) => r.categoria === 'custom') || false;
        const hasGeneratedDocs = (knowledgeChunks?.length || 0) > 0; // Se tem chunks, docs foram gerados
        
        const statusReal = {
          company_foundation: false, // TODO: Implementar quando colunas forem criadas no DB
          create_personas: personas.length > 0,
          biografias: (biografias?.length || 0) > 0,
          atribuicoes: (atribuicoes?.length || 0) > 0,
          competencias: (competencias?.length || 0) > 0,
          avatar_prompts: hasPrompts,
          avatar_images: hasGeneratedImages,
          avatar_download: hasLocalImages,
          automation_analysis: (automationData?.length || 0) > 0,
          rag_recommendations: (ragData?.length || 0) > 0,
          export_topics: hasExportTopics,
          add_custom_topics: hasCustomTopics,
          generate_documents_rag: hasGeneratedDocs,
          workflows_n8n: (workflowsData?.length || 0) > 0,
          supervision_chains: false, // TODO: Implementar quando coluna for criada no DB
          machine_learning: (mlModels?.length || 0) > 0,
          auditoria: (auditoriaData?.length || 0) > 0,
          knowledge_base: (knowledgeChunks?.length || 0) > 0,
          test_rag_system: (knowledgeChunks?.length || 0) > 0 // Se tem chunks, RAG pode ser testado
        };
        
        console.log('🔍 Status calculado:', statusReal);
        console.log('🔍 hasPrompts:', hasPrompts);
        console.log('🔍 hasGeneratedImages:', hasGeneratedImages);
        console.log('🔍 hasLocalImages:', hasLocalImages);
        
        // Atualizar empresa com status real
        setEmpresa(prev => prev ? {
          ...prev,
          scripts_status: statusReal
        } : null);
      }
    } catch (error) {
      console.error('Erro ao carregar personas reais:', error);
      setPersonasReais([]);
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Funções dos botões
  const handleEditarEmpresa = () => {
    setShowEditModal(true);
  };

  const handleVerPersonas = () => {
    // Navegar para personas com filtro da empresa - APENAS desta empresa
    const url = `/personas?empresaId=${empresaId}&empresaNome=${encodeURIComponent(empresa?.nome || '')}`;
    router.push(url);
  };



  const handleExecutarScript = async (scriptName: string, forceMode: boolean = false) => {
    if (!empresa) return;
    
    const info = scriptInfo[scriptName];
    const modoTexto = forceMode ? '🧹 FORÇA TOTAL (limpa e regenera tudo)' : '⏭️ INCREMENTAL (apenas o que falta)';
    const confirmacao = confirm(`🚀 Executar "${info?.nome || scriptName}"?\n\nModo: ${modoTexto}\n\nComando: ${info?.comando.replace('<ID>', empresaId)}${forceMode ? ' --force' : ''}\n\nDescrição: ${info?.descricao}`);
    if (!confirmacao) return;

    setExecutandoScript(scriptName);
    
    try {
      console.log(`🔄 Executando script ${scriptName} para empresa ${empresa.nome}`);
      console.log(`   Modo: ${modoTexto}`);
      
      // Chamar API de automação
      const response = await fetch('/api/automation/execute-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaId,
          scriptName: scriptName,
          scriptCommand: info?.comando.replace('<ID>', empresaId),
          force_mode: forceMode
        })
      });
      
      const result = await response.json();
      
      console.log('📊 Resultado da execução:', result);
      
      if (result.success) {
        // Atualizar status do script
        const empresaAtualizada = {
          ...empresa,
          scripts_status: {
            ...empresa.scripts_status,
            [scriptName]: true
          }
        };
        setEmpresa(empresaAtualizada);
        
        // Recarregar personas para ver mudanças
        await loadPersonasReais();
        
        alert(`✅ Script "${info?.nome}" executado com sucesso!\n\n${result.message || ''}`);
      } else {
        const errorDetails = result.errors || result.error || result.output || 'Erro desconhecido';
        console.error('❌ Detalhes do erro:', errorDetails);
        throw new Error(errorDetails);
      }
    } catch (error) {
      console.error('Erro ao executar script:', error);
      alert(`❌ Erro ao executar script: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setExecutandoScript(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'processando':
        return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getScriptStatusIcon = (status: boolean) => {
    return status ? 
      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" title="Script executado" /> : 
      <div className="h-3 w-3 bg-gray-300 rounded-full" title="Script não executado" />;
  };

  const getScriptStatusText = (status: boolean) => {
    return status ? 
      <span className="text-green-600 font-medium">✓ Executado</span> :
      <span className="text-gray-500">Pendente</span>;
  };

  // Mapear nomes e descrições dos scripts (ORDEM CORRETA: 00-11)
  const scriptInfo: Record<string, { nome: string; descricao: string; ordem: number; comando: string }> = {
    company_foundation: {
      nome: '00. Fundação da Empresa',
      descricao: 'Gera Missão, Objetivos, OKRs, Cadeia de Valor e Governança',
      ordem: 0,
      comando: 'node 00_generate_company_foundation.js --empresaId=<ID>'
    },
    create_personas: {
      nome: '01. Criar Placeholders',
      descricao: 'Cria personas básicas com estrutura inicial',
      ordem: 1,
      comando: 'node 01_create_personas_from_structure.js --empresaId=<ID>'
    },
    biografias: {
      nome: '02. Gerar Biografias',
      descricao: 'LLM cria biografias com contexto OKR e experiência',
      ordem: 2,
      comando: 'node 02_generate_biografias_COMPLETO.js --empresaId=<ID>'
    },
    atribuicoes: {
      nome: '03. Atribuições Contextualizadas',
      descricao: 'LLM define responsabilidades com vinculação a subsistemas',
      ordem: 3,
      comando: 'node 03_generate_atribuicoes_contextualizadas.js --empresaId=<ID>'
    },
    competencias: {
      nome: '04. Gerar Competências',
      descricao: 'LLM define competências alinhadas com OKRs e subsistemas',
      ordem: 4,
      comando: 'node 04_generate_competencias_grok.js --empresaId=<ID>'
    },
    avatar_prompts: {
      nome: '05a. Prompts de Avatares',
      descricao: 'LLM gera descrições físicas detalhadas para Fal.ai',
      ordem: 5.1,
      comando: 'node 05a_generate_avatar_prompts.js --empresaId=<ID>'
    },
    avatar_images: {
      nome: '05b. Gerar Imagens (FREE)',
      descricao: 'Pollinations.ai gera avatares fotorrealistas com diversidade extrema ($0.00)',
      ordem: 5.2,
      comando: 'node 05b_generate_images_pollinations.js --empresaId=<ID>'
    },
    avatar_download: {
      nome: '05c. Download e Thumbnails',
      descricao: 'Baixa imagens localmente e cria miniaturas',
      ordem: 5.3,
      comando: 'node 05c_download_avatares.js --empresaId=<ID>'
    },
    automation_analysis: {
      nome: '06. Análise de Automação',
      descricao: 'LLM analisa tarefas e identifica oportunidades',
      ordem: 6,
      comando: 'node 06_analyze_tasks_for_automation.js --empresaId=<ID>'
    },
    rag_recommendations: {
      nome: '06.5. Recomendações RAG',
      descricao: 'LLM gera conteúdo de treinamento especializado',
      ordem: 6.5,
      comando: 'node 06.5_generate_rag_recommendations.js --empresaId=<ID>'
    },
    export_topics: {
      nome: '06.75. Exportar Tópicos RAG',
      descricao: 'Consolida e exporta todos os tópicos para geração externa',
      ordem: 6.75,
      comando: 'node 06.75_export_topics_for_generation.js --empresaId=<ID>'
    },
    add_custom_topics: {
      nome: '06.76. Adicionar Tópicos Customizados',
      descricao: 'Adiciona tópicos especializados (veterinário, jurídico, etc)',
      ordem: 6.76,
      comando: 'node 06.76_add_custom_topics.js --empresaId=<ID> --cargo="Cargo" --topicos="X,Y,Z"'
    },
    generate_documents_rag: {
      nome: '06.8. Gerar Documentos RAG',
      descricao: 'LLM gera FAQs de 1200 palavras para cada tópico RAG',
      ordem: 6.8,
      comando: 'node 06.8_generate_documents_from_rag.js --empresaId=<ID>'
    },
    workflows_n8n: {
      nome: '07. Workflows N8N',
      descricao: 'Gera workflows de automação completos',
      ordem: 7,
      comando: 'node 07_generate_n8n_workflows.js --empresaId=<ID>'
    },
    supervision_chains: {
      nome: '07.5. Cadeias de Supervisão',
      descricao: 'Define hierarquias e relacionamentos de supervisão',
      ordem: 7.5,
      comando: 'node 07.5_generate_supervision_chains.js --empresaId=<ID>'
    },
    machine_learning: {
      nome: '08. Machine Learning',
      descricao: 'Gera modelos preditivos e otimizações',
      ordem: 8,
      comando: 'node 08_generate_machine_learning.js --empresaId=<ID>'
    },
    auditoria: {
      nome: '09. Auditoria Completa',
      descricao: 'Valida qualidade e consistência de todos os dados',
      ordem: 9,
      comando: 'node 09_generate_auditoria.js --empresaId=<ID>'
    },
    knowledge_base: {
      nome: '10. Base de Conhecimento',
      descricao: 'Processa documentos, gera embeddings e armazena chunks para RAG',
      ordem: 10,
      comando: 'node 10_generate_knowledge_base.js --empresaId=<ID> --source=<PATH>'
    },
    test_rag_system: {
      nome: '11. Teste Sistema RAG',
      descricao: 'Testa qualidade RAG com perguntas pré-definidas e gera relatório',
      ordem: 11,
      comando: 'node 11_test_rag_system.js --empresaId=<ID>'
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Empresa não encontrada</h3>
          <p className="text-gray-600 mb-4">A empresa solicitada não foi encontrada.</p>
          <Button onClick={() => router.push('/empresas')}>Voltar para Empresas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/empresas')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{empresa.nome}</h1>
              <p className="text-gray-600">Código: {empresa.codigo}</p>
            </div>
          </div>
          <div className="ml-auto">
            {getStatusBadge(empresa.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Informações Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Indústria</label>
                  <p className="text-lg font-medium">{empresa.industria}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">País</label>
                  <p className="text-lg font-medium">{empresa.pais}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Domínio</label>
                  <p className="text-lg font-medium">{empresa.dominio || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total de Personas</label>
                  <p className="text-lg font-medium">{empresa.total_personas}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Descrição</label>
                <p className="text-gray-700 mt-1">{empresa.descricao}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Idiomas</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {empresa.idiomas?.map((idioma, index) => (
                    <Badge key={index} variant="outline">{idioma}</Badge>
                  )) || <Badge variant="outline">Português</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Scripts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Status dos Scripts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Monitor de Execução em Tempo Real */}
              <div className="mb-6">
                <LiveExecutionMonitor />
              </div>

              {/* Barra de Progresso */}
              {scriptProgress && scriptProgress.status === 'running' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Executando: {scriptProgress.currentPersona || 'Iniciando...'}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {scriptProgress.current} / {scriptProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${scriptProgress.total > 0 ? (scriptProgress.current / scriptProgress.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    {Math.round((scriptProgress.current / scriptProgress.total) * 100)}% completo
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {Object.entries(empresa.scripts_status)
                  .sort(([keyA], [keyB]) => {
                    const ordemA = scriptInfo[keyA]?.ordem || 999;
                    const ordemB = scriptInfo[keyB]?.ordem || 999;
                    return ordemA - ordemB;
                  })
                  .map(([script, status]) => {
                    const info = scriptInfo[script] || { 
                      nome: script, 
                      descricao: 'Script de automação',
                      ordem: 999,
                      comando: `node ${script}.js`
                    };
                    
                    return (
                      <div key={script} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-center space-x-3 flex-1">
                          {getScriptStatusIcon(status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">{info.nome}</span>
                              {getScriptStatusText(status)}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{info.descricao}</p>
                            
                            {/* Indicador de status inline */}
                            <div className="flex items-center gap-2 mt-2">
                              {executandoScript === script ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                                  <span className="text-blue-600 font-medium">Executando...</span>
                                </div>
                              ) : status ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                  </svg>
                                  Concluído
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">⏳ Aguardando execução</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status ? "outline" : "default"}
                            onClick={() => handleExecutarScript(script, false)}
                            disabled={executandoScript === script}
                            className={`min-w-[100px] ${status ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''}`}
                          >
                            {executandoScript === script ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                ...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                {status ? 'Re-exec' : 'Executar'}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleExecutarScript(script, true)}
                            disabled={executandoScript === script}
                            className="min-w-[100px]"
                            title="Limpa tudo e regenera do zero"
                          >
                            {executandoScript === script ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                ...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                                Forçar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Execução Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Execução Rápida - Cascata Completa</span>
              </CardTitle>
              <CardDescription>
                Execute toda a sequência de scripts automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickCascadePanel />
            </CardContent>
          </Card>

          {/* Sistema de Recuperação de Falhas */}
          <RetryPanel empresaId={empresaId} />
        </div>

        {/* Painel Lateral */}
        <div className="space-y-6">
          {/* Monitor de Progresso dos Scripts */}
          <ScriptProgressMonitor empresaId={empresaId} />

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" onClick={handleEditarEmpresa}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Empresa
              </Button>
              <Button className="w-full" variant="outline" onClick={handleVerPersonas}>
                <Users className="h-4 w-4 mr-2" />
                Ver Personas
              </Button>
            </CardContent>
          </Card>

          {/* Composição da Equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Composição da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Executivos (M/F):</span>
                  <span>{empresa.executives_male}/{empresa.executives_female}</span>
                </div>
                <div className="flex justify-between">
                  <span>Especialistas (M/F):</span>
                  <span>{empresa.specialists_male}/{empresa.specialists_female}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assistentes (M/F):</span>
                  <span>{empresa.assistants_male}/{empresa.assistants_female}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Planejado:</span>
                  <span>{empresa.total_personas}</span>
                </div>
                <div className="flex justify-between font-medium text-blue-600">
                  <span className="flex items-center space-x-2">
                    <span>Criadas:</span>
                    {loadingPersonas && <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />}
                  </span>
                  <span>{personasReais.length}</span>
                </div>
                {personasReais.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    ⚠️ Nenhuma persona criada ainda. Execute o script "Biografias" para gerar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Criada em {new Date(empresa.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>ID: {empresa.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && empresa && (
        <CompanyForm 
          company={empresa}
          onClose={(updatedCompany) => {
            setShowEditModal(false);
            if (updatedCompany) {
              setEmpresa(updatedCompany);
            }
          }}
        />
      )}
    </div>
  );
}