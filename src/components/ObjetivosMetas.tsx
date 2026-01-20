'use client';

import React, { useState } from 'react';
import { 
  Target, TrendingUp, Users, Calendar, 
  Plus, Filter, BarChart3, CheckCircle,
  PlayCircle, PauseCircle, XCircle,
  DollarSign, Rocket, Settings,
  Lightbulb, Leaf, Edit, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MetaFormModal } from './meta-form-modal';
import { PersonasMetas } from './personas-metas';
import { Milestones } from './milestones';
import { Analytics } from './analytics';
import { useMetasGlobais, useCreateMetaGlobal, useUpdateMetaGlobal, useDeleteMetaGlobal } from '@/lib/metas-hooks';
import { useEmpresas } from '@/lib/supabase-hooks';
import { testarTabelaMetasGlobais, testarCriacaoMeta } from '@/lib/test-metas';

type TabMetas = 'dashboard' | 'personas' | 'milestones' | 'analytics';

export function ObjetivosMetas() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('atual');
  const [modalAberto, setModalAberto] = useState(false);
  const [metaEdicao, setMetaEdicao] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabMetas>('dashboard');

  // Hooks do Supabase
  const { data: empresas, isLoading: carregandoEmpresas } = useEmpresas();
  const { data: metas, isLoading: carregandoMetas } = useMetasGlobais(selectedEmpresa);
  const createMetaMutation = useCreateMetaGlobal();
  const updateMetaMutation = useUpdateMetaGlobal();
  const deleteMetaMutation = useDeleteMetaGlobal();

  // Debug: Log para verificar se empresas estão carregando
  console.log('Empresas carregando:', carregandoEmpresas);
  console.log('Empresas:', empresas);
  console.log('Empresa selecionada:', selectedEmpresa);

  const resumoGeral = {
    progressoGeral: metas ? Math.round(metas.reduce((acc, meta) => acc + meta.progresso, 0) / metas.length) : 0,
    metasConcluidas: metas ? metas.filter(m => m.status === 'concluida').length : 0,
    metasAndamento: metas ? metas.filter(m => m.status === 'ativa').length : 0,
    metasPausadas: metas ? metas.filter(m => m.status === 'pausada').length : 0,
    metasCanceladas: metas ? metas.filter(m => m.status === 'cancelada').length : 0,
    roiAtual: metas ? Math.round(metas.reduce((acc, meta) => acc + meta.roi_esperado, 0) / metas.length) : 0,
    roiVariacao: 125
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'crescimento': return <Rocket className="h-5 w-5 text-blue-500" />;
      case 'operacional': return <Settings className="h-5 w-5 text-gray-500" />;
      case 'financeira': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'inovacao': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'sustentabilidade': return <Leaf className="h-5 w-5 text-green-600" />;
      default: return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const abrirModalNovaMeta = () => {
    console.log('Abrindo modal para nova meta');
    console.log('Empresas disponíveis:', empresas);
    console.log('Empresa selecionada:', selectedEmpresa);
    
    setMetaEdicao(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (meta: any) => {
    setMetaEdicao(meta);
    setModalAberto(true);
  };

  const salvarMeta = async (metaData: any) => {
    console.log('Iniciando salvamento de meta:', metaData);
    
    try {
      if (metaEdicao) {
        // Atualizar meta existente
        console.log('Atualizando meta existente:', metaEdicao.id);
        await updateMetaMutation.mutateAsync({
          id: metaEdicao.id,
          ...metaData
        });
      } else {
        // Criar nova meta
        const empresaId = selectedEmpresa !== 'todas' ? selectedEmpresa : empresas?.[0]?.id;
        console.log('Empresa selecionada:', empresaId);
        console.log('Lista de empresas:', empresas);
        
        if (!empresaId) {
          throw new Error('Empresa não selecionada');
        }
        
        const novaMeta = {
          ...metaData,
          empresa_id: empresaId
        };
        
        console.log('Criando nova meta:', novaMeta);
        const resultado = await createMetaMutation.mutateAsync(novaMeta);
        console.log('Meta criada com sucesso:', resultado);
      }
      
      setModalAberto(false);
      setMetaEdicao(null);
      console.log('Modal fechado, meta salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert(`Erro ao salvar meta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const excluirMeta = async (metaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await deleteMetaMutation.mutateAsync(metaId);
      } catch (error) {
        console.error('Erro ao excluir meta:', error);
      }
    }
  };

  const testarConexao = async () => {
    console.log('Iniciando teste de conexão...');
    const resultado = await testarTabelaMetasGlobais();
    console.log('Resultado do teste:', resultado);
    
    if (resultado.success) {
      alert('Conexão com tabela metas_globais funcionando!');
    } else {
      alert(`Erro na conexão: ${(resultado.error as any)?.message || 'Erro desconhecido'}`);
    }
  };

  const testarCriacao = async () => {
    console.log('Iniciando teste de criação...');
    const resultado = await testarCriacaoMeta();
    console.log('Resultado do teste de criação:', resultado);
    
    if (resultado.success) {
      alert('Teste de criação de meta funcionou!');
    } else {
      alert(`Erro na criação: ${(resultado.error as any)?.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Objetivos e Metas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Sistema integrado com Supabase</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'personas', label: 'Por Persona', icon: Users },
            { id: 'milestones', label: 'Marcos', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabMetas)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Progresso Geral</p>
                    <p className="text-2xl font-bold text-blue-600">{resumoGeral.progressoGeral}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Concluídas</p>
                    <p className="text-2xl font-bold text-green-600">{resumoGeral.metasConcluidas}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Andamento</p>
                    <p className="text-2xl font-bold text-blue-600">{resumoGeral.metasAndamento}</p>
                  </div>
                  <PlayCircle className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI Médio</p>
                    <p className="text-2xl font-bold text-purple-600">{resumoGeral.roiAtual}%</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Empresas</SelectItem>
                    {empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="crescimento">Crescimento</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="financeira">Financeira</SelectItem>
                    <SelectItem value="inovacao">Inovação</SelectItem>
                    <SelectItem value="sustentabilidade">Sustentabilidade</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={abrirModalNovaMeta} className="flex items-center gap-2 ml-auto">
                  <Plus className="h-4 w-4" />
                  Nova Meta
                </Button>

                <Button onClick={testarConexao} variant="outline" className="flex items-center gap-2">
                  🔍 Testar Tabela
                </Button>

                <Button onClick={testarCriacao} variant="outline" className="flex items-center gap-2">
                  🧪 Testar Criação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metas Globais</CardTitle>
            </CardHeader>
            <CardContent>
              {carregandoMetas ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Carregando metas...</p>
                </div>
              ) : metas && metas.length > 0 ? (
                <div className="grid gap-4">
                  {metas
                    .filter(meta => selectedCategoria === 'todas' || meta.categoria === selectedCategoria)
                    .map((meta) => (
                    <Card key={meta.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 bg-gray-50 rounded-lg">
                              {getCategoriaIcon(meta.categoria)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{meta.titulo}</h4>
                              <p className="text-sm text-gray-600 mb-2">{meta.descricao}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                <Badge variant="secondary">{meta.categoria}</Badge>
                                <Badge variant={meta.prioridade === 'critica' ? 'destructive' : 'outline'}>
                                  {meta.prioridade}
                                </Badge>
                                <span>Responsável: {meta.responsavel_principal}</span>
                                <span>ROI: {meta.roi_esperado}%</span>
                              </div>
                              <Progress value={meta.progresso} className="mt-2" />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Progresso: {meta.progresso}%</span>
                                <span>Prazo: {new Date(meta.prazo).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirModalEdicao(meta)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => excluirMeta(meta.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta encontrada</h3>
                  <p className="text-gray-600 mb-4">Crie sua primeira meta para começar</p>
                  <Button onClick={abrirModalNovaMeta}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Meta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'personas' && (
        <PersonasMetas />
      )}

      {activeTab === 'milestones' && (
        <Milestones />
      )}

      {activeTab === 'analytics' && (
        <Analytics />
      )}

      <MetaFormModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={salvarMeta}
        metaInicial={metaEdicao}
      />
    </div>
  );
}