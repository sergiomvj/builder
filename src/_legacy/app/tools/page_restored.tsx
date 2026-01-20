'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play,
  Pause,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Code,
  Zap,
  Database,
  Globe,
  Activity,
  Calendar,
  Eye,
  Terminal,
  FileCode,
  Cpu,
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Brain
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';
import { DatabaseService } from '@/lib/database';

interface Script {
  id: string;
  nome: string;
  descricao: string;
  status: 'ativo' | 'pausado' | 'manutencao' | 'erro';
  tipo: 'python' | 'javascript' | 'bash';
  empresa_id: string;
  ultima_execucao?: string;
  duracao_media?: string;
  sucessos: number;
  falhas: number;
}

interface Automacao {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'agendada' | 'webhook' | 'manual' | 'manutencao';
  status: 'ativa' | 'pausada' | 'erro';
  frequencia?: string;
  proxima_execucao?: string;
  empresa_id: string;
}

export default function ToolsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cascade');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const isClient = useIsClient();

  // Scripts do Sistema Cascade (Scripts Reais do Projeto)
  const cascadeScripts = [
    {
      id: 'script_1',
      nome: '01_generate_biografias.py',
      descricao: 'Geração automática de biografias detalhadas para todas as personas da empresa',
      status: 'ativo' as const,
      tipo: 'python' as const,
      categoria: 'biografia',
      ordem: 1,
      dependencias: ['personas_config.json'],
      outputs: ['biografias_output/'],
      duracao_estimada: '2-3 min'
    },
    {
      id: 'script_2', 
      nome: '02_generate_competencias.py',
      descricao: 'Análise e extração de competências técnicas e comportamentais',
      status: 'ativo' as const,
      tipo: 'python' as const,
      categoria: 'competencias',
      ordem: 2,
      dependencias: ['biografias_output/'],
      outputs: ['competencias_output/'],
      duracao_estimada: '1-2 min'
    },
    {
      id: 'script_3',
      nome: '03_generate_tech_specs.py', 
      descricao: 'Geração de especificações técnicas e requisitos do sistema',
      status: 'ativo' as const,
      tipo: 'python' as const,
      categoria: 'tech_specs',
      ordem: 3,
      dependencias: ['competencias_output/'],
      outputs: ['tech_specs_output/'],
      duracao_estimada: '2-4 min'
    },
    {
      id: 'script_4',
      nome: '04_populate_rag.py',
      descricao: 'População do banco de conhecimento RAG com dados estruturados',
      status: 'ativo' as const,
      tipo: 'python' as const,
      categoria: 'rag',
      ordem: 4,
      dependencias: ['tech_specs_output/'],
      outputs: ['RAG Database'],
      duracao_estimada: '3-5 min'
    },
    {
      id: 'script_5',
      nome: '05_generate_workflows.py',
      descricao: 'Criação de workflows N8N automatizados para a empresa',
      status: 'ativo' as const,
      tipo: 'python' as const,
      categoria: 'workflows',
      ordem: 5,
      dependencias: ['RAG Database'],
      outputs: ['06_N8N_WORKFLOWS/'],
      duracao_estimada: '2-3 min'
    }
  ];

  // Automações do Sistema
  const systemAutomations = [
    {
      id: 'sync_daily',
      nome: 'Sincronização Diária VCM ↔ RAG',
      descricao: 'Sincronização automática entre VCM Central e bancos RAG das empresas',
      tipo: 'agendada' as const,
      status: 'ativa' as const,
      frequencia: 'Diário às 02:00',
      categoria: 'sync'
    },
    {
      id: 'backup_weekly',
      nome: 'Backup Semanal Completo',
      descricao: 'Backup completo de personas, biografias e configurações',
      tipo: 'agendada' as const,
      status: 'ativa' as const,
      frequencia: 'Semanal - Domingo 03:00',
      categoria: 'backup'
    },
    {
      id: 'health_check',
      nome: 'Health Check Contínuo',
      descricao: 'Monitoramento da saúde dos serviços e APIs',
      tipo: 'agendada' as const,
      status: 'ativa' as const,
      frequencia: 'A cada 5 minutos',
      categoria: 'monitoring'
    },
    {
      id: 'cascade_auto',
      nome: 'Execução Automática Cascade',
      descricao: 'Execução automática do cascade quando nova empresa é criada',
      tipo: 'webhook' as const,
      status: 'ativa' as const,
      frequencia: 'On-demand (Webhook)',
      categoria: 'cascade'
    }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados reais dos scripts e automações do banco de dados
      const [scriptsData, automacoesData] = await Promise.all([
        // DatabaseService.getScripts(), // Método não implementado
        Promise.resolve([]),
        // DatabaseService.getAutomacoes() // Método não implementado
        Promise.resolve([])
      ]);
      
      // Se não houver dados no banco, manter os sistemas definidos localmente
      setScripts(scriptsData && scriptsData.length > 0 ? scriptsData : []);
      setAutomacoes(automacoesData && automacoesData.length > 0 ? automacoesData : []);
    } catch (error) {
      console.error('Error loading tools data:', error);
      // Em caso de erro, manter arrays vazios (sem fallback para mock data)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      loadData();
    }
  }, [isClient]);

  const handleExecuteScript = async (scriptId: string) => {
    try {
      console.log('Executing script:', scriptId);
      // Implementar execução real via API
    } catch (error) {
      console.error('Error executing script:', error);
    }
  };

  const handleToggleAutomacao = async (automacaoId: string) => {
    try {
      console.log('Toggling automation:', automacaoId);
      // Implementar toggle real via API
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'ativa':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'pausado':
      case 'pausada':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pausado</Badge>;
      case 'manutencao':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Manutenção</Badge>;
      case 'erro':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'biografia': return <Users className="h-4 w-4" />;
      case 'competencias': return <Brain className="h-4 w-4" />;
      case 'tech_specs': return <Settings className="h-4 w-4" />;
      case 'rag': return <Database className="h-4 w-4" />;
      case 'workflows': return <Zap className="h-4 w-4" />;
      case 'sync': return <RefreshCw className="h-4 w-4" />;
      case 'backup': return <BarChart3 className="h-4 w-4" />; // Archive substituído 
      case 'monitoring': return <Activity className="h-4 w-4" />;
      case 'cascade': return <TrendingUp className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Scripts & Automações VCM</h1>
            <p className="text-gray-600 mt-1">Sistema de processamento em cascade e automações empresariais</p>
          </div>
          <Button onClick={loadData} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar scripts ou automações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="ativa">Ativa</option>
            <option value="pausado">Pausado</option>
            <option value="pausada">Pausada</option>
            <option value="manutencao">Manutenção</option>
            <option value="erro">Erro</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cascade">Scripts Cascade</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="custom">Scripts Personalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="cascade" className="space-y-4">
          <Alert className="mb-6">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Sistema Cascade VCM:</strong> Sequência de 5 scripts que processa empresas de forma automática: 
              Biografias → Competências → Tech Specs → RAG → Workflows N8N
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cascadeScripts.map((script) => (
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span>Ordem: {script.ordem}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{script.duracao_estimada}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="mb-1">
                        <span className="text-gray-500">Dependências:</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {script.dependencias.join(', ')}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="mb-1">
                        <span className="text-gray-500">Output:</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {script.outputs.join(', ')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleExecuteScript(script.id)}
                        disabled={script.status === 'manutencao'}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
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
              <strong>Automações do Sistema:</strong> Processos automatizados que mantêm o VCM funcionando: 
              sincronização, backups, monitoramento e triggers automáticos.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemAutomations.map((automacao) => (
              <Card key={automacao.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(automacao.categoria)}
                      <span>{automacao.nome}</span>
                    </div>
                    {getStatusBadge(automacao.status)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {automacao.descricao}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Tipo:</span>
                      <Badge variant="outline">{automacao.tipo}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Frequência:</span>
                      <span className="text-right text-xs">{automacao.frequencia}</span>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant={automacao.status === 'ativa' ? 'destructive' : 'default'}
                        onClick={() => handleToggleAutomacao(automacao.id)}
                        className="flex-1"
                      >
                        {automacao.status === 'ativa' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {scripts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <div className="text-center">
                  <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum script personalizado encontrado</p>
                  <p className="text-sm text-gray-400">Configure seu banco de dados para ver scripts personalizados</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scripts.map((script) => (
                <Card key={script.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {script.nome}
                      {getStatusBadge(script.status)}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {script.descricao}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{script.duracao_media || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{script.sucessos}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>{script.falhas}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span>{script.tipo}</span>
                        </div>
                      </div>
                      
                      {script.ultima_execucao && (
                        <div className="text-xs text-gray-500 border-t pt-3">
                          Última execução: {new Date(script.ultima_execucao).toLocaleString()}
                        </div>
                      )}
                      
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleExecuteScript(script.id)}
                          disabled={script.status === 'manutencao'}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Executar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}