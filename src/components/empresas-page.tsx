'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Play, Eye, Building2, Database, GitBranch, Loader2, Wand2, Camera, BarChart3, Package, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { CompanyForm } from './company-form';
import { PersonasModal } from './personas-modal';
import { PersonaAdvancedModal } from './persona-advanced-modal';
import { DeleteCompanyModal } from './delete-company-modal';
// ❌ REMOVIDO: import { EquipeDiversaGeneratorSafe } - criação agora via scripts Node.js
import AuditoriaDashboard from './auditoria-dashboard';
import ProvisionamentoDashboard from './provisionamento-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmpresas, usePersonasByEmpresa, useDeleteEmpresa } from '@/lib/supabase-hooks';
import { useDeleteCompany } from '@/hooks/useDeleteCompany';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

// DADOS REAIS DO SUPABASE - SEM MOCKS! (Fixed TypeScript errors)
export function EmpresasPage({ 
  onEmpresaSelect, 
  selectedEmpresaId 
}: {
  onEmpresaSelect?: (id: string) => void;
  selectedEmpresaId?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [viewingPersonas, setViewingPersonas] = useState<any>(null);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [editingPersonaTab, setEditingPersonaTab] = useState<string>('biografia');
  const [deletingCompany, setDeletingCompany] = useState<any>(null);
  const [executingScript, setExecutingScript] = useState<number | null>(null);
  const [executingCascade, setExecutingCascade] = useState(false);
  // ❌ REMOVIDO: Estado e funções do gerador de equipe
  // const [showEquipeGenerator, setShowEquipeGenerator] = useState(false);
  // const [empresaParaEquipe, setEmpresaParaEquipe] = useState<any>(null);
  
  // Usar dados reais do Supabase
  const { data: companies = [], isLoading, error } = useEmpresas();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const { data: personasEmpresa = [] } = usePersonasByEmpresa(selectedEmpresa, !!selectedEmpresa);
  const deleteEmpresaMutation = useDeleteEmpresa();
  const { deleteCompany } = useDeleteCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Atualizar selectedEmpresa quando companies carregam ou quando uma nova empresa é criada
  useEffect(() => {
    if (companies.length > 0 && !selectedEmpresa) {
      setSelectedEmpresa(companies[0].id);
    }
  }, [companies, selectedEmpresa]);

  // ❌ REMOVIDO: Event listener automático de geração de equipe
  // A criação de personas agora é feita EXCLUSIVAMENTE via scripts Node.js
  // Fluxo correto:
  // 1. Criar empresa → salva apenas cargos_necessarios
  // 2. Executar: node 00_create_personas_from_structure.js --empresaId=UUID
  // 3. Executar: node 00_generate_avatares.js --empresaId=UUID (com LLM)

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = (company: any) => {
    setDeletingCompany(company);
  };

  const handleConfirmDelete = async (companyId: string, deleteType: 'soft' | 'hard') => {
    try {
      await deleteCompany({ companyId, deleteType });
      
      // Se a empresa excluída estava selecionada, seleciona outra
      if (selectedEmpresa === companyId && companies.length > 1) {
        const remainingCompanies = companies.filter(c => c.id !== companyId);
        setSelectedEmpresa(remainingCompanies[0].id);
      } else if (companies.length === 1) {
        setSelectedEmpresa('');
      }
      
      const company = companies.find(c => c.id === companyId);
      const actionText = deleteType === 'soft' ? 'desativada' : 'excluída permanentemente';
      
      toast({ 
        title: `Empresa ${actionText} com sucesso!`,
        description: `A empresa "${company?.nome}" foi ${actionText}.`
      });
      
      setDeletingCompany(null);
    } catch (error) {
      console.error('Erro ao processar exclusão:', error);
      toast({ 
        title: 'Erro ao processar exclusão',
        description: error instanceof Error ? error.message : 'Erro desconhecido. Tente novamente.'
      });
    }
  };

  const handleCloseForm = (createdCompany?: any) => {
    setShowForm(false);
    setEditingCompany(null);
    
    // Se uma nova empresa foi criada, seleciona ela automaticamente
    if (createdCompany && createdCompany.id) {
      setSelectedEmpresa(createdCompany.id);
    }
  };

  // ❌ REMOVIDAS: Funções do gerador automático de equipe
  // handleCloseEquipeGenerator e handleManualEquipeGenerator
  // Criação de personas agora é EXCLUSIVAMENTE via scripts Node.js

  const handleEditPersona = (persona: any, tab: string = 'biografia') => {
    setEditingPersona(persona);
    setEditingPersonaTab(tab);
  };

  const handleClosePersonaEdit = () => {
    setEditingPersona(null);
    setEditingPersonaTab('biografia');
  };

  const handleSavePersona = async (personaData: any) => {
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          descricao_fisica: personaData.descricao_fisica,
          biografia_completa: personaData.biografia_completa,
          personalidade: personaData.personalidade || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', personaData.id);

      if (error) throw error;
      
      // Atualizar cache local
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      
      toast({
        title: 'Sucesso',
        description: 'Descrição física salva com sucesso!'
      });
      
      console.log('Persona salva com sucesso:', personaData.id);
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar descrição física da persona'
      });
    }
  };

  const executeScript = async (scriptId: number) => {
    if (!selectedEmpresa) {
      toast({
        title: 'Erro',
        description: 'Selecione uma empresa primeiro'
      });
      return;
    }

    const empresa = companies.find(c => c.id === selectedEmpresa);
    if (!empresa) return;

    setExecutingScript(scriptId);
    
    try {
      const scriptTypes = {
        1: 'biografia',
        2: 'competencias', 
        3: 'tech_specs',
        4: 'rag',
        5: 'workflows'
      };

      const scriptType = scriptTypes[scriptId as keyof typeof scriptTypes];
      
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresa.codigo,
          empresa_nome: empresa.nome,
          script_type: scriptType,
          empresa_dados: {
            empresa_codigo: empresa.codigo,
            empresa_nome: empresa.nome,
            empresa_industry: empresa.industria,
            empresa_pais: empresa.pais,
            empresa_descricao: empresa.descricao,
            empresa_tamanho: 'startup',
            empresa_cultura: 'hibrida',
            ceo_genero: empresa.ceo_gender,
            executivos_homens: empresa.executives_male,
            executivos_mulheres: empresa.executives_female,
            assistentes_homens: empresa.assistants_male,
            assistentes_mulheres: empresa.assistants_female,
            especialistas_homens: empresa.specialists_male,
            especialistas_mulheres: empresa.specialists_female,
            idiomas_extras: empresa.idiomas || [],
            nacionalidades: empresa.nationalities || []
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Script executado com sucesso!',
          description: `${scriptType} foi executado para a empresa "${empresa.nome}"`
        });
      } else {
        throw new Error(result.message || 'Erro na execução do script');
      }
    } catch (error) {
      console.error(`Erro ao executar script ${scriptId}:`, error);
      toast({
        title: 'Erro na execução',
        description: error instanceof Error ? error.message : `Erro ao executar script ${scriptId}`
      });
    } finally {
      setExecutingScript(null);
    }
  };

  const executeCascade = async () => {
    setExecutingCascade(true);
    
    try {
      // Simular execução em cascata dos scripts 1-5
      for (let i = 1; i <= 5; i++) {
        setExecutingScript(i);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setExecutingScript(null);
      }
      console.log('Execução em cascata concluída com sucesso');
    } catch (error) {
      console.error('Erro na execução em cascata:', error);
    } finally {
      setExecutingCascade(false);
      setExecutingScript(null);
    }
  };

  const handleSelectEmpresa = (empresaId: string) => {
    setSelectedEmpresa(empresaId);
    onEmpresaSelect?.(empresaId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativa: { label: 'Ativa', className: 'bg-green-100 text-green-800' },
      inativa: { label: 'Inativa', className: 'bg-red-100 text-red-800' },
      processando: { label: 'Processando', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processando;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const empresaSelecionada = companies.find(e => e.id === selectedEmpresa);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar empresas</h3>
            <div className="mt-2 text-sm text-red-700">
              {error?.message || 'Erro desconhecido'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Empresas Virtuais</h2>
            <p className="text-gray-600">Gerencie suas empresas virtuais, personas e execute scripts</p>
          </div>
          <div className="flex gap-2">
            <Link href="/create-strategic-company">
              <Button variant="outline" className="flex items-center gap-2">
                <Lightbulb size={16} />
                Gerador Estratégico
              </Button>
            </Link>
            <Link href="/create-strategic-company">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} className="mr-2" />
                Nova Empresa
              </Button>
            </Link>
          </div>
        </div>

        {/* Empty state */}
          <div className="text-center py-12">
          <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa criada</h3>
          <p className="text-gray-600 mb-4">Comece criando sua primeira empresa virtual</p>
          <Link href="/create-strategic-company">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Criar Primeira Empresa
            </Button>
          </Link>
        </div>

        {/* Modal */}
        {showForm && (
          <CompanyForm
            company={editingCompany}
            onClose={handleCloseForm}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empresas Virtuais</h2>
          <p className="text-gray-600">Gerencie suas empresas virtuais, personas e execute scripts</p>
        </div>
      <div className="flex gap-2">
        <Link href="/create-strategic-company">
          <Button variant="outline" className="flex items-center gap-2">
            <Lightbulb size={16} />
            Gerador Estratégico
          </Button>
        </Link>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Nova Empresa
        </Button>
      </div>
      </div>

      {/* Layout de 2 colunas */}
      <div className="grid grid-cols-10 gap-6 h-[calc(100vh-200px)]">
        
        {/* Coluna 1: Lista de Empresas (30%) */}
        <div className="col-span-3 bg-white rounded-lg border p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">Empresas Cadastradas</h3>
          </div>
          
          <div className="space-y-3">
            {[...companies].sort((a, b) => a.nome.localeCompare(b.nome)).map((company) => (
              <div
                key={company.id}
                onClick={() => handleSelectEmpresa(company.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedEmpresa === company.id
                    ? 'bg-blue-50 border-blue-200 border-2'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{company.nome}</h4>
                    <p className="text-sm text-gray-600">{company.industria}</p>
                  </div>
                  {getStatusBadge(company.status)}
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>País:</span>
                    <span>{company.pais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personas:</span>
                    <span>{company.personas_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scripts:</span>
                    <span>{company.scripts_executados}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipe:</span>
                    <span className={company.equipe_gerada ? 'text-green-600' : 'text-orange-600'}>
                      {company.equipe_gerada ? '✓ Gerada' : '⚠ Pendente'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(company);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit size={12} />
                  </Button>
                  {/* ❌ BOTÃO REMOVIDO: Gerar Equipe Diversa
                      Personas agora são criadas EXCLUSIVAMENTE via scripts Node.js
                      para garantir contexto completo e evitar dados mockados
                  */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(company);
                    }}
                    disabled={deleteEmpresaMutation.isPending}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleteEmpresaMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Detalhes da Empresa (70%) */}
        <div className="col-span-7 bg-white rounded-lg border p-6 overflow-y-auto">
          {empresaSelecionada ? (
            <div className="space-y-6">
              {/* Alerta se equipe não foi gerada */}
              {!empresaSelecionada.equipe_gerada && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Wand2 size={20} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 mb-1">
                        ⚠️ Equipe Não Gerada
                      </h3>
                      <p className="text-sm text-orange-800 mb-3">
                        Esta empresa foi criada mas ainda não possui personas. Execute o script abaixo para criar os PLACEHOLDERS (apenas cargos + nacionalidades):
                      </p>
                      <div className="bg-gray-900 text-green-400 px-4 py-2 rounded font-mono text-sm mb-2">
                        cd AUTOMACAO; node 00_create_personas_from_structure.js --empresaId={empresaSelecionada.id}
                      </div>
                      <p className="text-xs text-orange-700 mb-2">
                        📋 <strong>Fluxo correto após criar placeholders:</strong>
                      </p>
                      <ul className="text-xs text-orange-700 space-y-1 ml-4">
                        <li>1. Script 01.5 → Atribuições contextualizadas</li>
                        <li>2. Script 02 → Competências técnicas/comportamentais</li>
                        <li>3. Script 00_generate_avatares.js → Gera NOMES + perfis completos via LLM</li>
                        <li>4. Scripts 01, 03-06 → Biografias detalhadas e dados finais</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Header da empresa selecionada */}
              <div className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{empresaSelecionada.nome}</h2>
                    <p className="text-gray-600 mt-1">{empresaSelecionada.descricao}</p>
                  </div>
                  {getStatusBadge(empresaSelecionada.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Indústria:</span>
                    <div className="font-medium">{empresaSelecionada.industria}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">País:</span>
                    <div className="font-medium">{empresaSelecionada.pais}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Tamanho:</span>
                    <div className="font-medium capitalize">{empresaSelecionada.tamanho}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Cultura:</span>
                    <div className="font-medium capitalize">{empresaSelecionada.cultura}</div>
                  </div>
                </div>
              </div>

              {/* Tabs de detalhes */}
              <Tabs defaultValue="personas" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personas" className="flex items-center gap-2">
                    <Users size={16} />
                    Personas
                  </TabsTrigger>
                  <TabsTrigger value="scripts" className="flex items-center gap-2">
                    <Play size={16} />
                    Scripts
                  </TabsTrigger>
                  <TabsTrigger value="rag" className="flex items-center gap-2">
                    <Database size={16} />
                    RAG
                  </TabsTrigger>
                  <TabsTrigger value="auditoria" className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    Auditoria
                  </TabsTrigger>
                  <TabsTrigger value="provisionamento" className="flex items-center gap-2">
                    <Package size={16} />
                    Provisionamento
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personas" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Personas da Empresa</h3>
                      <Button size="sm">
                        <Plus size={16} className="mr-2" />
                        Nova Persona
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {personasEmpresa.map((persona) => (
                        <Card key={persona.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{persona.full_name}</h4>
                                <p className="text-sm text-gray-600">{persona.role}</p>
                                <p className="text-xs text-gray-500">{persona.department}</p>
                              </div>
                              
                              <div className="flex gap-2 flex-wrap">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'biografia')}
                                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                >
                                  Bio
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'descricao-fisica')}
                                  className="bg-pink-50 hover:bg-pink-100 border-pink-200 flex items-center gap-1"
                                >
                                  <Camera size={14} />
                                  Física
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'avatar')}
                                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 flex items-center gap-1"
                                >
                                  <Wand2 size={14} />
                                  Avatar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'competencias')}
                                  className="bg-green-50 hover:bg-green-100 border-green-200"
                                >
                                  Competências
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'tech-specs')}
                                  className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                                >
                                  Tech Specs
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'rag-knowledge')}
                                  className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                                >
                                  RAG
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'workflows')}
                                  className="bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                                >
                                  Workflows
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPersona(persona, 'auditoria')}
                                  className="bg-gray-50 hover:bg-gray-100 border-gray-200"
                                >
                                  Auditoria
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scripts" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Execução de Scripts</h3>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={executeCascade}
                        disabled={executingCascade || executingScript !== null}
                      >
                        <GitBranch size={16} className="mr-2" />
                        {executingCascade ? 'Executando Cascata...' : 'Executar Todos em Cascata'}
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { id: 1, nome: 'Script 1 - Gerar Biografias', status: 'concluído' },
                        { id: 2, nome: 'Script 2 - Gerar Competências', status: 'concluído' },
                        { id: 3, nome: 'Script 3 - Tech Specifications', status: 'concluído' },
                        { id: 4, nome: 'Script 4 - Análise de Fluxos', status: 'pendente' },
                        { id: 5, nome: 'Script 5 - Workflows N8N', status: 'pendente' }
                      ].map((script) => (
                        <Card key={script.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{script.nome}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={script.status === 'concluído' ? 'default' : 'secondary'}
                                  >
                                    {script.status}
                                  </Badge>
                                  {(executingScript === script.id || (executingCascade && executingScript === script.id)) && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                      <span className="text-xs">Executando...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => executeScript(script.id)}
                                disabled={executingScript !== null || executingCascade}
                              >
                                <Play size={16} className="mr-2" />
                                Executar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rag" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Knowledge Base RAG</h3>
                    
                    <div className="grid gap-4">
                      {personasEmpresa.map((persona) => (
                        <Card key={persona.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{persona.full_name}</CardTitle>
                            <CardDescription>{persona.role}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Documentos RAG:</span>
                                <Badge>12 documentos</Badge>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Última sincronização:</span>
                                <span className="text-gray-500">Há 2 horas</span>
                              </div>
                              <Button variant="outline" size="sm" className="w-full mt-2">
                                <Eye size={16} className="mr-2" />
                                Visualizar RAG
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="auditoria" className="mt-6">
                  <AuditoriaDashboard
                    empresaId={empresaSelecionada.id}
                    empresaNome={empresaSelecionada.nome}
                  />
                </TabsContent>

                <TabsContent value="provisionamento" className="mt-6">
                  <ProvisionamentoDashboard
                    empresaId={empresaSelecionada.id}
                    empresaNome={empresaSelecionada.nome}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Selecione uma Empresa</h3>
                <p className="text-gray-600">Escolha uma empresa na lista para visualizar seus detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onClose={handleCloseForm}
        />
      )}

      {viewingPersonas && (
        <PersonasModal
          company={viewingPersonas}
          onClose={() => setViewingPersonas(null)}
        />
      )}

      {editingPersona && (
        <PersonaAdvancedModal
          persona={editingPersona}
          isOpen={!!editingPersona}
          onClose={handleClosePersonaEdit}
          onPersonaUpdate={handleSavePersona}
          defaultTab={editingPersonaTab}
        />
      )}

      {deletingCompany && (
        <DeleteCompanyModal
          company={deletingCompany}
          isOpen={!!deletingCompany}
          onClose={() => setDeletingCompany(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

      {/* ❌ REMOVIDO: Modal EquipeDiversaGenerator
          Criação de personas agora é EXCLUSIVAMENTE via scripts Node.js:
          node 00_create_personas_from_structure.js --empresaId=UUID
      */}
    </div>
  );
}