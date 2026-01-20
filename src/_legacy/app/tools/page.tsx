'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building, Database, Activity, Users, Brain, CheckCircle, Clock, AlertCircle,
  Box, Plus, Edit, Trash2, Search, Filter, TrendingUp, Megaphone, Briefcase,
  Headphones, DollarSign, ShoppingCart, Server, Code, BarChart, Settings2,
  Package, Layers, Grid3x3, RefreshCw
} from 'lucide-react'
import { SimpleExecutionMonitor } from '@/components/SimpleExecutionMonitor'
import { supabase } from '@/lib/database'

export default function ToolsPageClean() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [empresaSelecionada, setEmpresaSelecionada] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para Sub-Sistemas
  const [subsistemas, setSubsistemas] = useState<any[]>([])
  const [loadingSubsistemas, setLoadingSubsistemas] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editandoSubsistema, setEditandoSubsistema] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroStatus, setFiltroStatus] = useState('all')
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    categoria: 'comercial',
    tipo: '',
    icone: 'Box',
    cor: '#3B82F6',
    status: 'ativo',
    prioridade: 0
  })

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        // Usar supabase diretamente para evitar problemas com DatabaseService
        const { data: empresasData, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('status', 'ativa')
          .not('nome', 'like', '[DELETED-%')
          .not('nome', 'like', '[EXCLUÍDA]%')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setEmpresas(empresasData || [])
        
        // Auto-selecionar ARVA se disponível
        const arva = empresasData?.find((emp: any) => 
          emp.id === '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17'
        )
        if (arva) {
          setEmpresaSelecionada(arva)
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
        // Fallback: Criar empresa ARVA temporariamente para testes
        const arvaFallback = {
          id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
          nome: 'ARVA Tech Solutions',
          codigo: 'ARVA'
        }
        setEmpresas([arvaFallback])
        setEmpresaSelecionada(arvaFallback)
      } finally {
        setLoading(false)
      }
    }

    loadEmpresas()
  }, [])

  // Carregar sub-sistemas quando empresa é selecionada
  useEffect(() => {
    if (empresaSelecionada) {
      loadSubsistemas()
    }
  }, [empresaSelecionada])

  const loadSubsistemas = async () => {
    if (!empresaSelecionada) return
    
    try {
      setLoadingSubsistemas(true)
      const { data, error } = await supabase
        .from('subsistemas')
        .select('*')
        .eq('empresa_id', empresaSelecionada.id)
        .order('prioridade', { ascending: false })
        .order('nome')
      
      if (error) throw error
      setSubsistemas(data || [])
    } catch (error) {
      console.error('Erro ao carregar sub-sistemas:', error)
    } finally {
      setLoadingSubsistemas(false)
    }
  }

  const handleOpenModal = (subsistema?: any) => {
    if (subsistema) {
      setEditandoSubsistema(subsistema)
      setFormData({
        nome: subsistema.nome,
        codigo: subsistema.codigo,
        descricao: subsistema.descricao || '',
        categoria: subsistema.categoria,
        tipo: subsistema.tipo || '',
        icone: subsistema.icone || 'Box',
        cor: subsistema.cor || '#3B82F6',
        status: subsistema.status,
        prioridade: subsistema.prioridade || 0
      })
    } else {
      setEditandoSubsistema(null)
      setFormData({
        nome: '',
        codigo: '',
        descricao: '',
        categoria: 'comercial',
        tipo: '',
        icone: 'Box',
        cor: '#3B82F6',
        status: 'ativo',
        prioridade: 0
      })
    }
    setModalOpen(true)
  }

  const handleSaveSubsistema = async () => {
    if (!empresaSelecionada) return
    
    try {
      if (editandoSubsistema) {
        // Atualizar
        const { error } = await supabase
          .from('subsistemas')
          .update(formData)
          .eq('id', editandoSubsistema.id)
        
        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('subsistemas')
          .insert([{
            ...formData,
            empresa_id: empresaSelecionada.id
          }])
        
        if (error) throw error
      }
      
      setModalOpen(false)
      loadSubsistemas()
    } catch (error) {
      console.error('Erro ao salvar sub-sistema:', error)
      alert('Erro ao salvar sub-sistema: ' + (error as any).message)
    }
  }

  const handleDeleteSubsistema = async (id: string) => {
    if (!confirm('Tem certeza que deseja arquivar este sub-sistema?')) return
    
    try {
      const { error } = await supabase
        .from('subsistemas')
        .update({ status: 'arquivado' })
        .eq('id', id)
      
      if (error) throw error
      loadSubsistemas()
    } catch (error) {
      console.error('Erro ao arquivar sub-sistema:', error)
      alert('Erro ao arquivar sub-sistema')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'
      const { error } = await supabase
        .from('subsistemas')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      loadSubsistemas()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  // Filtros de sub-sistemas
  const subsistemasFiltrados = subsistemas.filter((s) => {
    if (filtroCategoria !== 'all' && s.categoria !== filtroCategoria) return false
    if (filtroStatus !== 'all' && s.status !== filtroStatus) return false
    if (searchTerm && !s.nome.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !s.codigo.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Estatísticas
  const statsSubsistemas = {
    total: subsistemas.length,
    ativos: subsistemas.filter(s => s.status === 'ativo').length,
    inativos: subsistemas.filter(s => s.status === 'inativo').length,
    desenvolvimento: subsistemas.filter(s => s.status === 'desenvolvimento').length,
    porCategoria: subsistemas.reduce((acc, s) => {
      acc[s.categoria] = (acc[s.categoria] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Mapeamento de ícones
  const iconMap: Record<string, any> = {
    Users, TrendingUp, Megaphone, Briefcase, Headphones, CheckCircle,
    DollarSign, ShoppingCart, Server, Code, BarChart, Box, Settings2,
    Package, Database, Activity, Brain, Layers, Grid3x3
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Box
  }

  const scripts = [
    {
      id: 'placeholders',
      nome: '01 - Criar Placeholders',
      descricao: 'Cria personas básicas com estrutura inicial (role, department, specialty)',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 01_create_personas_from_structure.js'
    },
    {
      id: 'biografias',
      nome: '02 - Gerar Biografias',
      descricao: 'LLM cria biografias com contexto OKR e experiência',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 02_generate_biografias_COMPLETO.js'
    },
    {
      id: 'atribuicoes',
      nome: '03 - Atribuições Contextualizadas',
      descricao: 'LLM define responsabilidades com vinculação a subsistemas',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 03_generate_atribuicoes_contextualizadas.js'
    },
    {
      id: 'competencias',
      nome: '04 - Competências + Metas SMART',
      descricao: 'LLM define competências alinhadas com OKRs e subsistemas',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 04_generate_competencias_grok.js'
    },
    {
      id: 'avatar-prompts',
      nome: '05a - Prompts de Avatares',
      descricao: 'LLM gera descrições físicas detalhadas para Fal.ai (rápido, ~3min)',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 05a_generate_avatar_prompts.js'
    },
    {
      id: 'avatar-images',
      nome: '05b - Gerar Imagens Fal.ai',
      descricao: 'Fal.ai gera imagens fotorrealistas (custo: $0.05/img, ~15min)',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 05b_generate_images_fal.js'
    },
    {
      id: 'avatar-download',
      nome: '05c - Download e Thumbnails',
      descricao: 'Baixa imagens localmente e cria miniaturas com Sharp',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'core',
      comando: 'node 05c_download_avatares.js'
    },
    {
      id: 'automation',
      nome: '06 - Automação + Procedimentos',
      descricao: 'Analisa tarefas, identifica automação e gera procedimentos detalhados em procedimento_execucao (JSONB)',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'analise',
      comando: 'node 06_analyze_tasks_for_automation.js'
    },
    {
      id: 'workflows',
      nome: '07 - Workflows N8N',
      descricao: 'Gera workflows de automação completos para N8N em personas_workflows',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'automacao',
      comando: 'node 07_generate_n8n_workflows.js'
    },
    {
      id: 'machine-learning',
      nome: '08 - Machine Learning',
      descricao: 'Gera modelos preditivos e otimizações ML em personas_ml_models',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'evolucao',
      comando: 'node 08_generate_machine_learning.js'
    },
    {
      id: 'auditoria',
      nome: '09 - Auditoria Completa',
      descricao: 'Valida qualidade e consistência de todos os dados em personas_audit_logs',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'validacao',
      comando: 'node 09_generate_auditoria.js'
    },
    {
      id: 'knowledge-base',
      nome: '10 - Base de Conhecimento',
      descricao: 'Gera documentação estruturada e base de conhecimento RAG em rag_knowledge',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'rag',
      comando: 'node 10_generate_knowledge_base.js'
    },
    {
      id: 'rag-test',
      nome: '11 - Test RAG System',
      descricao: 'Testa sistema RAG com consultas de exemplo e validação de respostas',
      apiEndpoint: '/api/automation/execute-script',
      status: 'ativo',
      categoria: 'rag',
      comando: 'node 11_test_rag_system.js'
    }
    // 11 Scripts da Cascata Completa + RAG (01-11)
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 animate-spin" />
            <span>Carregando sistema...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Activity className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de Controle de Execução</h1>
          <p className="text-muted-foreground">Execute scripts com monitoramento em tempo real</p>
        </div>
      </div>

      <Tabs defaultValue="execucao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="execucao">Controle de Execução</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="subsistemas">Sub-Sistemas</TabsTrigger>
        </TabsList>

        <TabsContent value="execucao" className="space-y-6">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>🎯 Controle de Execução em Tempo Real:</strong> Execute scripts com monitoramento completo de progresso, logs e status.
              Sistema desenvolvido para o Master Fluxo VCM.
            </AlertDescription>
          </Alert>

          {!empresaSelecionada ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Selecione uma empresa para visualizar os controles de execução</p>
                
                {empresas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Empresas disponíveis:</p>
                    <div className="grid gap-2 max-w-md mx-auto">
                      {empresas.map((empresa) => (
                        <Button 
                          key={empresa.id}
                          onClick={() => setEmpresaSelecionada(empresa)}
                          variant="outline"
                          className="justify-start"
                        >
                          <Building className="w-4 h-4 mr-2" />
                          {empresa.nome}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {empresas.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-red-600">Nenhuma empresa encontrada!</p>
                    <Button 
                      onClick={() => window.location.href = '/empresas'}
                      variant="outline"
                    >
                      Criar Empresa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Empresa Selecionada: {empresaSelecionada.nome}</span>
                    <Button 
                      onClick={() => setEmpresaSelecionada(null)}
                      variant="outline"
                      size="sm"
                    >
                      Trocar
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Scripts com controle de execução disponível para {empresaSelecionada.nome}
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {scripts.map((script) => (
                  <SimpleExecutionMonitor
                    key={script.id}
                    scriptName={script.nome}
                    apiEndpoint={script.apiEndpoint}
                    onExecutionComplete={() => {
                      console.log(`🎉 Execução do script ${script.nome} concluída!`)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="empresas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Empresas</CardTitle>
              <CardDescription>
                Visualize e gerencie as empresas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {empresas.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Nenhuma empresa cadastrada</p>
                  <Button onClick={() => window.location.href = '/empresas'}>
                    Criar Nova Empresa
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {empresas.map((empresa) => (
                    <Card key={empresa.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{empresa.nome}</h3>
                          <p className="text-sm text-gray-500">ID: {empresa.id}</p>
                          {empresa.codigo && (
                            <Badge variant="outline" className="mt-1">
                              {empresa.codigo}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={empresa.id === empresaSelecionada?.id ? "default" : "secondary"}
                          >
                            {empresa.id === empresaSelecionada?.id ? "Selecionada" : "Disponível"}
                          </Badge>
                          {empresa.id !== empresaSelecionada?.id && (
                            <Button 
                              onClick={() => setEmpresaSelecionada(empresa)}
                              size="sm"
                            >
                              Selecionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subsistemas" className="space-y-6">
          <Alert>
            <Layers className="h-4 w-4" />
            <AlertDescription>
              <strong>🎯 Gestão de Sub-Sistemas:</strong> Configure os módulos da empresa virtual (CRM, Vendas, Marketing, RH, Financeiro, etc.).
            </AlertDescription>
          </Alert>

          {!empresaSelecionada ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Selecione uma empresa para gerenciar os sub-sistemas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header com estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Grid3x3 className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-blue-600">{statsSubsistemas.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Ativos</p>
                        <p className="text-2xl font-bold text-green-600">{statsSubsistemas.ativos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-gray-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Inativos</p>
                        <p className="text-2xl font-bold text-gray-600">{statsSubsistemas.inativos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Em Desenvolvimento</p>
                        <p className="text-2xl font-bold text-orange-600">{statsSubsistemas.desenvolvimento}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros e Busca */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar sub-sistema..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Categorias</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button onClick={() => handleOpenModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Sub-Sistema
                    </Button>

                    <Button variant="outline" onClick={loadSubsistemas}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Grid de Sub-Sistemas */}
              {loadingSubsistemas ? (
                <div className="text-center py-12">
                  <Clock className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Carregando sub-sistemas...</p>
                </div>
              ) : subsistemasFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Box className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum sub-sistema encontrado</h3>
                    <p className="text-gray-500 mb-4">
                      {subsistemas.length === 0 ? 'Crie o primeiro sub-sistema para começar.' : 'Nenhum resultado para os filtros aplicados.'}
                    </p>
                    <Button onClick={() => handleOpenModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Sub-Sistema
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subsistemasFiltrados.map((subsistema) => {
                    const IconComponent = getIconComponent(subsistema.icone)
                    return (
                      <Card key={subsistema.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="p-2 rounded-lg" 
                                style={{ backgroundColor: `${subsistema.cor}20` }}
                              >
                                <IconComponent 
                                  className="h-6 w-6" 
                                  style={{ color: subsistema.cor }}
                                />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{subsistema.nome}</CardTitle>
                                <Badge variant="outline" className="mt-1">{subsistema.codigo}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {subsistema.descricao || 'Sem descrição'}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={
                              subsistema.status === 'ativo' ? 'bg-green-100 text-green-700' :
                              subsistema.status === 'inativo' ? 'bg-gray-100 text-gray-700' :
                              'bg-orange-100 text-orange-700'
                            }>
                              {subsistema.status}
                            </Badge>
                            <Badge variant="secondary">{subsistema.categoria}</Badge>
                            {subsistema.tipo && <Badge variant="outline">{subsistema.tipo}</Badge>}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                            <div>
                              <p className="text-gray-500">Personas</p>
                              <p className="font-medium">{subsistema.total_personas || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Tarefas</p>
                              <p className="font-medium">{subsistema.total_tarefas || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Workflows</p>
                              <p className="font-medium">{subsistema.total_workflows || 0}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleToggleStatus(subsistema.id, subsistema.status)}
                            >
                              {subsistema.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenModal(subsistema)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSubsistema(subsistema.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal CRUD */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoSubsistema ? 'Editar Sub-Sistema' : 'Novo Sub-Sistema'}
            </DialogTitle>
            <DialogDescription>
              {editandoSubsistema ? 'Atualize as informações do sub-sistema' : 'Preencha os dados do novo sub-sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: CRM - Gestão de Relacionamento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="Ex: CRM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva as funcionalidades e objetivo do sub-sistema..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Input
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  placeholder="Ex: crm, erp, marketing"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select value={formData.icone} onValueChange={(v) => setFormData({ ...formData, icone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                    <SelectItem value="Megaphone">Megaphone</SelectItem>
                    <SelectItem value="Briefcase">Briefcase</SelectItem>
                    <SelectItem value="Headphones">Headphones</SelectItem>
                    <SelectItem value="CheckCircle">CheckCircle</SelectItem>
                    <SelectItem value="DollarSign">DollarSign</SelectItem>
                    <SelectItem value="ShoppingCart">ShoppingCart</SelectItem>
                    <SelectItem value="Server">Server</SelectItem>
                    <SelectItem value="Code">Code</SelectItem>
                    <SelectItem value="BarChart">BarChart</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade (0-12)</Label>
              <Input
                id="prioridade"
                type="number"
                min="0"
                max="12"
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSubsistema}>
              {editandoSubsistema ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}