'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Workflow,
  Users,
  Building,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  Trash2,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/database';

interface Empresa {
  id: string;
  nome: string;
  codigo: string;
}

interface Persona {
  id: string;
  full_name: string;
  role: string;
  empresa_id: string;
}

interface WorkflowData {
  id: string;
  workflow_name: string;
  persona_id: string;
  empresa_id: string;
  workflow_type: string;
  status: string;
  n8n_workflow_id?: string;
  workflow_json?: any;
  last_execution_at?: string;
  total_executions: number;
  success_count: number;
  error_count: number;
  avg_execution_time?: number;
  created_at: string;
  updated_at: string;
  persona?: Persona;
}

interface AutomationOpportunity {
  id: string;
  persona_id: string;
  task_id: string;
  automation_score: number;
  workflow_type: string;
  status: string;
  required_integrations?: string[];
  estimated_time_saved_per_execution?: string;
}

export default function WorkflowsPage() {
  // Estados principais
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasSelecionadas, setPersonasSelecionadas] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroScore, setFiltroScore] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [workflowSelecionado, setWorkflowSelecionado] = useState<WorkflowData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pipeline execution
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<string>('');

  // Carregar empresas
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Carregar personas quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada) {
      loadPersonas(empresaSelecionada);
      loadWorkflows(empresaSelecionada);
      loadOpportunities(empresaSelecionada);
    }
  }, [empresaSelecionada]);

  // Recarregar workflows quando personas são selecionadas
  useEffect(() => {
    if (empresaSelecionada && personasSelecionadas.length > 0) {
      loadWorkflows(empresaSelecionada, personasSelecionadas);
    }
  }, [personasSelecionadas]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, codigo')
        .eq('status', 'ativa')
        .order('nome');

      if (error) throw error;

      setEmpresas(data || []);

      // Auto-selecionar ARVA se disponível
      const arva = data?.find((e) => e.id === '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17');
      if (arva) {
        setEmpresaSelecionada(arva.id);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadPersonas = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id, full_name, role, empresa_id')
        .eq('empresa_id', empresaId)
        .order('full_name');

      if (error) throw error;

      setPersonas(data || []);
    } catch (error) {
      console.error('Erro ao carregar personas:', error);
    }
  };

  const loadWorkflows = async (empresaId: string, personaIds?: string[]) => {
    try {
      setLoading(true);

      let query = supabase
        .from('personas_workflows')
        .select(`
          *,
          persona:personas(id, full_name, role)
        `)
        .eq('empresa_id', empresaId);

      if (personaIds && personaIds.length > 0) {
        query = query.in('persona_id', personaIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setWorkflows(data || []);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from('personas_automation_opportunities')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('automation_score', 60);

      if (error) throw error;

      setOpportunities(data || []);
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error);
    }
  };

  const togglePersona = (personaId: string) => {
    setPersonasSelecionadas((prev) =>
      prev.includes(personaId)
        ? prev.filter((id) => id !== personaId)
        : [...prev, personaId]
    );
  };

  const toggleAllPersonas = () => {
    if (personasSelecionadas.length === personas.length) {
      setPersonasSelecionadas([]);
    } else {
      setPersonasSelecionadas(personas.map((p) => p.id));
    }
  };

  const handleActivateWorkflow = async (workflowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('personas_workflows')
        .update({ status: newStatus })
        .eq('id', workflowId);

      if (error) throw error;

      // Atualizar no N8N se tiver n8n_workflow_id
      const workflow = workflows.find((w) => w.id === workflowId);
      if (workflow?.n8n_workflow_id) {
        await fetch(`/api/n8n/workflows/${workflow.n8n_workflow_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: newStatus === 'active' }),
        });
      }

      // Recarregar workflows
      if (empresaSelecionada) {
        loadWorkflows(empresaSelecionada, personasSelecionadas.length > 0 ? personasSelecionadas : undefined);
      }
    } catch (error) {
      console.error('Erro ao ativar/desativar workflow:', error);
      alert('Erro ao alterar status do workflow');
    }
  };

  const handleExecuteWorkflow = async (workflow: WorkflowData) => {
    if (!workflow.n8n_workflow_id) {
      alert('Workflow não está vinculado ao N8N');
      return;
    }

    try {
      const response = await fetch(`/api/n8n/workflows/${workflow.n8n_workflow_id}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Workflow executado com sucesso!');
      } else {
        alert('Erro ao executar workflow');
      }
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      alert('Erro ao executar workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este workflow?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('personas_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      // Recarregar workflows
      if (empresaSelecionada) {
        loadWorkflows(empresaSelecionada, personasSelecionadas.length > 0 ? personasSelecionadas : undefined);
      }
    } catch (error) {
      console.error('Erro ao excluir workflow:', error);
      alert('Erro ao excluir workflow');
    }
  };

  const handleGenerateWorkflows = async () => {
    if (!empresaSelecionada) {
      alert('Selecione uma empresa primeiro');
      return;
    }

    const personasToProcess = personasSelecionadas.length > 0 
      ? personasSelecionadas 
      : personas.map(p => p.id);

    if (personasToProcess.length === 0) {
      alert('Nenhuma persona disponível');
      return;
    }

    const confirmMsg = personasSelecionadas.length > 0
      ? `Gerar workflows para ${personasSelecionadas.length} persona(s) selecionada(s)?`
      : `Gerar workflows para TODAS as ${personas.length} personas?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setPipelineRunning(true);
    setPipelineProgress('Iniciando geração de workflows...');

    try {
      const response = await fetch('/api/automation/generate-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaSelecionada,
          personaIds: personasToProcess
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao gerar workflows');
      }

      setPipelineProgress('Workflows gerados com sucesso!');
      
      // Recarregar workflows após 2 segundos
      setTimeout(() => {
        loadWorkflows(empresaSelecionada, personasSelecionadas.length > 0 ? personasSelecionadas : undefined);
        setPipelineRunning(false);
        setPipelineProgress('');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao gerar workflows:', error);
      setPipelineProgress('');
      setPipelineRunning(false);
      alert(`Erro: ${error.message}`);
    }
  };

  // Estatísticas calculadas
  const stats = {
    total: workflows.length,
    ativos: workflows.filter((w) => w.status === 'active').length,
    inativos: workflows.filter((w) => w.status === 'inactive').length,
    totalExecutions: workflows.reduce((acc, w) => acc + w.total_executions, 0),
    successRate: workflows.length > 0
      ? Math.round((workflows.reduce((acc, w) => acc + w.success_count, 0) / Math.max(workflows.reduce((acc, w) => acc + w.total_executions, 0), 1)) * 100)
      : 0,
    avgExecutionTime: workflows.length > 0
      ? (workflows.reduce((acc, w) => acc + (w.avg_execution_time || 0), 0) / workflows.length).toFixed(2)
      : '0'
  };

  // Workflows filtrados
  const workflowsFiltrados = workflows.filter((w) => {
    // Filtro de status
    if (filtroStatus !== 'all' && w.status !== filtroStatus) return false;

    // Filtro de tipo
    if (filtroTipo !== 'all' && w.workflow_type !== filtroTipo) return false;

    // Filtro de busca
    if (searchTerm && !w.workflow_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Workflow className="h-8 w-8 mr-3 text-blue-600" />
            Workflows de Automação
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie workflows N8N das personas da empresa
          </p>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => loadWorkflows(empresaSelecionada, personasSelecionadas.length > 0 ? personasSelecionadas : undefined)}
            disabled={pipelineRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${pipelineRunning ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={handleGenerateWorkflows}
            disabled={!empresaSelecionada || pipelineRunning}
            variant="default"
          >
            <Play className="h-4 w-4 mr-2" />
            Gerar Workflows
          </Button>
          <Button onClick={() => window.open('/integracoes', '_blank')} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Configurar N8N
          </Button>
        </div>
      </div>

      {/* Pipeline Status */}
      {pipelineRunning && (
        <Alert>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription className="ml-2">
            {pipelineProgress || 'Gerando workflows...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Seletor de Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Selecionar Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Selecione uma empresa..." />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome} ({empresa.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grid de Personas */}
      {empresaSelecionada && personas.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Selecionar Personas ({personasSelecionadas.length}/{personas.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={toggleAllPersonas}>
                {personasSelecionadas.length === personas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </Button>
            </div>
            <CardDescription>
              Selecione as personas para visualizar seus workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    id={persona.id}
                    checked={personasSelecionadas.includes(persona.id)}
                    onCheckedChange={() => togglePersona(persona.id)}
                  />
                  <Label htmlFor={persona.id} className="cursor-pointer flex-1" onClick={() => togglePersona(persona.id)}>
                    <p className="font-medium text-sm">{persona.full_name}</p>
                    <p className="text-xs text-gray-500">{persona.role}</p>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Workflow className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Pause className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inativos</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Execuções</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalExecutions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa Sucesso</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.avgExecutionTime}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      {workflows.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar workflow..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="error">Com Erro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="cron">Cron (Agendado)</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="secondary" className="px-3 py-1">
                {workflowsFiltrados.length} workflow(s)
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Workflows */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Carregando workflows...</p>
        </div>
      ) : workflowsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum workflow encontrado</h3>
            <p className="text-gray-500 mb-4">
              {empresaSelecionada
                ? personasSelecionadas.length > 0
                  ? 'As personas selecionadas não possuem workflows ainda.'
                  : 'Selecione personas para visualizar seus workflows.'
                : 'Selecione uma empresa para começar.'}
            </p>
            {opportunities.length > 0 && (
              <Alert className="max-w-md mx-auto mt-4">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Existem {opportunities.length} oportunidade(s) de automação disponíveis para esta empresa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflowsFiltrados.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={workflow.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {workflow.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">{workflow.workflow_type}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{workflow.workflow_name}</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  {workflow.persona?.full_name} - {workflow.persona?.role}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Métricas */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Execuções</p>
                    <p className="font-medium">{workflow.total_executions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sucessos</p>
                    <p className="font-medium text-green-600">{workflow.success_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Erros</p>
                    <p className="font-medium text-red-600">{workflow.error_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tempo Médio</p>
                    <p className="font-medium">{workflow.avg_execution_time ? `${workflow.avg_execution_time}s` : 'N/A'}</p>
                  </div>
                </div>

                {workflow.last_execution_at && (
                  <div className="text-xs text-gray-500">
                    Última execução: {new Date(workflow.last_execution_at).toLocaleString()}
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={workflow.status === 'active' ? 'outline' : 'default'}
                    onClick={() => handleActivateWorkflow(workflow.id, workflow.status)}
                  >
                    {workflow.status === 'active' ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>

                  {workflow.n8n_workflow_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteWorkflow(workflow)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Executar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWorkflowSelecionado(workflow);
                      setModalOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Detalhes
                  </Button>

                  {workflow.n8n_workflow_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/integracoes`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{workflowSelecionado?.workflow_name}</DialogTitle>
            <DialogDescription>
              {workflowSelecionado?.persona?.full_name} - {workflowSelecionado?.persona?.role}
            </DialogDescription>
          </DialogHeader>

          {workflowSelecionado && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center space-x-2">
                <Badge className={workflowSelecionado.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {workflowSelecionado.status}
                </Badge>
                <Badge variant="outline">{workflowSelecionado.workflow_type}</Badge>
                {workflowSelecionado.n8n_workflow_id && (
                  <Badge variant="secondary">N8N: {workflowSelecionado.n8n_workflow_id}</Badge>
                )}
              </div>

              {/* Métricas Detalhadas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded">
                  <p className="text-sm text-gray-500">Total de Execuções</p>
                  <p className="text-2xl font-bold">{workflowSelecionado.total_executions}</p>
                </div>
                <div className="border p-3 rounded">
                  <p className="text-sm text-gray-500">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-green-600">
                    {workflowSelecionado.total_executions > 0
                      ? ((workflowSelecionado.success_count / workflowSelecionado.total_executions) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="border p-3 rounded">
                  <p className="text-sm text-gray-500">Sucessos</p>
                  <p className="text-2xl font-bold text-green-600">{workflowSelecionado.success_count}</p>
                </div>
                <div className="border p-3 rounded">
                  <p className="text-sm text-gray-500">Erros</p>
                  <p className="text-2xl font-bold text-red-600">{workflowSelecionado.error_count}</p>
                </div>
              </div>

              {/* JSON do Workflow */}
              {workflowSelecionado.workflow_json && (
                <div>
                  <h4 className="font-medium mb-2">Configuração do Workflow</h4>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    <pre>{JSON.stringify(workflowSelecionado.workflow_json, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>Criado em: {new Date(workflowSelecionado.created_at).toLocaleString()}</p>
                <p>Atualizado em: {new Date(workflowSelecionado.updated_at).toLocaleString()}</p>
                {workflowSelecionado.last_execution_at && (
                  <p>Última execução: {new Date(workflowSelecionado.last_execution_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            {workflowSelecionado?.n8n_workflow_id && (
              <Button onClick={() => window.open(`/integracoes`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no N8N
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
