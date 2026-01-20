'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/lib/database';
import CreatePersonaModal from '@/components/CreatePersonaModal';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  User,
  Brain,
  Code,
  Workflow,
  BookOpen,
  Target,
  Award,
  Clock,
  Building,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Activity,
  FileText,
  Zap,
  Database,
  GitBranch
} from 'lucide-react';

// Interfaces completas
interface PersonaBiografia {
  id: string;
  biografia: string;
  objetivos_profissionais?: string;
  motivacoes?: string;
  desafios?: string;
}

interface Competencia {
  id: string;
  tipo: 'tecnica' | 'comportamental';
  nome: string;
  nivel: number;
  descricao?: string;
}

interface PersonaTechSpecs {
  id: string;
  linguagens_programacao?: string[];
  frameworks?: string[];
  ferramentas?: string[];
}

interface RagKnowledge {
  id: string;
  knowledge_base: string;
  categoria: string;
  conteudo: string;
}

interface Workflow {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'automatizado' | 'manual' | 'hibrido';
  status: 'ativo' | 'inativo';
}

interface PersonaAtribuicoes {
  id: string;
  responsabilidades: string[];
  kpis: string[];
  metas: Record<string, any>;
}

interface Persona {
  id: string;
  full_name: string;
  role: string;
  empresa_id: string;
  empresas?: {
    id: string;
    nome: string;
    codigo: string;
  };
  status: 'active' | 'inactive' | 'generating';
  avatar_url?: string;
  department: string;
  specialty: string;
  created_at: string;
  biografia_completa?: string;
  email?: string;
  whatsapp?: string;
  experiencia_anos?: number;
  temperatura_ia?: number;
  // Dados relacionados completos
  personas_biografias?: PersonaBiografia[];
  competencias?: Competencia[];
  personas_tech_specs?: PersonaTechSpecs[];
  rag_knowledge?: RagKnowledge[];
  workflows?: Workflow[];
  personas_atribuicoes?: PersonaAtribuicoes[];
}

export default function PersonasCompleta() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPersonas();
  }, [personas, searchTerm, filterStatus, filterDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [personasData, empresasData] = await Promise.all([
        DatabaseService.getPersonas(),
        DatabaseService.getEmpresas()
      ]);
      setPersonas(personasData || []);
      setEmpresas(empresasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPersonas = () => {
    let filtered = [...personas];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(p => p.department === filterDepartment);
    }

    setFilteredPersonas(filtered);
  };

  const handleDelete = async (personaId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta persona?')) return;

    try {
      await DatabaseService.deletePersona(personaId);
      await loadData();
      toast({
        title: 'Sucesso',
        description: 'Persona deletada com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao deletar persona',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
  };

  const handleView = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handleExport = (persona: Persona) => {
    const exportData = {
      basic: {
        name: persona.full_name,
        role: persona.role,
        department: persona.department,
        company: persona.empresas?.nome
      },
      biography: persona.personas_biografias?.[0],
      competencias: persona.competencias,
      techSpecs: persona.personas_tech_specs?.[0],
      ragKnowledge: persona.rag_knowledge,
      workflows: persona.workflows,
      attributions: persona.personas_atribuicoes?.[0]
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persona-${persona.full_name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Persona exportada com sucesso'
    });
  };

  const toggleCardExpansion = (personaId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(personaId)) {
      newExpanded.delete(personaId);
    } else {
      newExpanded.add(personaId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, color: 'bg-green-500' },
      inactive: { label: 'Inativo', variant: 'secondary' as const, color: 'bg-gray-500' },
      generating: { label: 'Gerando', variant: 'outline' as const, color: 'bg-blue-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const renderCompetenciasBadges = (competencias?: Competencia[]) => {
    if (!competencias?.length) return <span className="text-gray-400">Nenhuma</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {competencias.slice(0, 3).map((comp, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {comp.nome} ({comp.nivel}/5)
          </Badge>
        ))}
        {competencias.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{competencias.length - 3} mais
          </Badge>
        )}
      </div>
    );
  };

  const renderTechSpecs = (techSpecs?: PersonaTechSpecs[]) => {
    const specs = techSpecs?.[0];
    if (!specs) return <span className="text-gray-400">Nenhuma</span>;

    const allTechs = [
      ...(specs.linguagens_programacao || []),
      ...(specs.frameworks || []),
      ...(specs.ferramentas || [])
    ];

    return (
      <div className="flex flex-wrap gap-1">
        {allTechs.slice(0, 4).map((tech, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
        {allTechs.length > 4 && (
          <Badge variant="secondary" className="text-xs">
            +{allTechs.length - 4} mais
          </Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Central de Personas</h1>
          <p className="text-gray-600">
            {filteredPersonas.length} de {personas.length} personas
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Persona
          </Button>
          <Button variant="outline" onClick={loadData}>
            <Activity className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar Personas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, cargo, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="generating">Gerando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dept-filter">Departamento</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="executivo">Executivo</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterDepartment('all');
              }}>
                <Filter className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de personas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPersonas.map((persona) => {
          const isExpanded = expandedCards.has(persona.id);
          
          return (
            <Card key={persona.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {persona.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{persona.full_name}</h3>
                      <p className="text-sm text-gray-600">{persona.role}</p>
                    </div>
                  </div>
                  {getStatusBadge(persona.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Informações básicas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Empresa</span>
                    <span className="font-medium">{persona.empresas?.nome || persona.empresa_id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Departamento</span>
                    <Badge variant="outline">{persona.department}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Especialidade</span>
                    <span className="font-medium">{persona.specialty}</span>
                  </div>
                </div>

                {/* Dados expandidos */}
                {isExpanded && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Biografia */}
                    {persona.personas_biografias?.[0] && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          Biografia
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {persona.personas_biografias[0].biografia}
                        </p>
                      </div>
                    )}

                    {/* Competências */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        Competências ({persona.competencias?.length || 0})
                      </h4>
                      {renderCompetenciasBadges(persona.competencias)}
                    </div>

                    {/* Tech Specs */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Code className="w-4 h-4 mr-1" />
                        Tecnologias
                      </h4>
                      {renderTechSpecs(persona.personas_tech_specs)}
                    </div>

                    {/* RAG Knowledge */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-1" />
                        Base de Conhecimento
                      </h4>
                      <span className="text-sm text-gray-600">
                        {persona.rag_knowledge?.length || 0} documentos
                      </span>
                    </div>

                    {/* Workflows */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <GitBranch className="w-4 h-4 mr-1" />
                        Workflows
                      </h4>
                      <span className="text-sm text-gray-600">
                        {persona.workflows?.length || 0} fluxos configurados
                      </span>
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleView(persona)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(persona)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport(persona)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(persona.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => toggleCardExpansion(persona.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!selectedPersona} onOpenChange={() => setSelectedPersona(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {selectedPersona?.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <span>{selectedPersona?.full_name}</span>
                <p className="text-sm text-gray-600 font-normal">{selectedPersona?.role}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedPersona && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="bio">Biografia</TabsTrigger>
                <TabsTrigger value="skills">Competências</TabsTrigger>
                <TabsTrigger value="tech">Tech Specs</TabsTrigger>
                <TabsTrigger value="knowledge">RAG</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Empresa</Label>
                    <p className="font-medium">{selectedPersona.empresas?.nome}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    {getStatusBadge(selectedPersona.status)}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{selectedPersona.email}</p>
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <p>{selectedPersona.whatsapp}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bio" className="space-y-4">
                {selectedPersona.personas_biografias?.[0] ? (
                  <div>
                    <Label>Biografia Completa</Label>
                    <p className="text-sm text-gray-700 mt-2">
                      {selectedPersona.personas_biografias[0].biografia}
                    </p>
                    
                    {selectedPersona.personas_biografias[0].objetivos_profissionais && (
                      <div className="mt-4">
                        <Label>Objetivos Profissionais</Label>
                        <p className="text-sm text-gray-700 mt-2">
                          {selectedPersona.personas_biografias[0].objetivos_profissionais}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Biografia não disponível</p>
                )}
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                {selectedPersona.competencias?.length ? (
                  <div className="space-y-3">
                    {selectedPersona.competencias.map((comp, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{comp.nome}</h4>
                          <Badge variant={comp.tipo === 'tecnica' ? 'default' : 'secondary'}>
                            {comp.tipo}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm">Nível:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={`w-4 h-4 ${star <= comp.nivel ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {comp.descricao && <p className="text-sm text-gray-600 mt-2">{comp.descricao}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma competência cadastrada</p>
                )}
              </TabsContent>

              <TabsContent value="tech" className="space-y-4">
                {selectedPersona.personas_tech_specs?.[0] ? (
                  <div className="space-y-4">
                    {selectedPersona.personas_tech_specs[0].linguagens_programacao?.length && (
                      <div>
                        <Label>Linguagens de Programação</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPersona.personas_tech_specs[0].linguagens_programacao.map((lang, idx) => (
                            <Badge key={idx} variant="default">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPersona.personas_tech_specs[0].frameworks?.length && (
                      <div>
                        <Label>Frameworks</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPersona.personas_tech_specs[0].frameworks.map((fw, idx) => (
                            <Badge key={idx} variant="secondary">{fw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPersona.personas_tech_specs[0].ferramentas?.length && (
                      <div>
                        <Label>Ferramentas</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPersona.personas_tech_specs[0].ferramentas.map((tool, idx) => (
                            <Badge key={idx} variant="outline">{tool}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Especificações técnicas não disponíveis</p>
                )}
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-4">
                {selectedPersona.rag_knowledge?.length ? (
                  <div className="space-y-3">
                    {selectedPersona.rag_knowledge.map((knowledge, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{knowledge.knowledge_base}</h4>
                          <Badge variant="outline">{knowledge.categoria}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                          {knowledge.conteudo}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum conhecimento RAG cadastrado</p>
                )}
              </TabsContent>

              <TabsContent value="workflows" className="space-y-4">
                {selectedPersona.workflows?.length ? (
                  <div className="space-y-3">
                    {selectedPersona.workflows.map((workflow, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{workflow.nome}</h4>
                          <Badge variant={workflow.status === 'ativo' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{workflow.descricao}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">{workflow.tipo}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum workflow configurado</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de criação funcional */}
      <CreatePersonaModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadData}
        empresas={empresas}
      />

      {/* Placeholder para modal de edição */}

      {editingPersona && (
        <Dialog open={!!editingPersona} onOpenChange={() => setEditingPersona(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Persona</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center text-gray-500">
              Funcionalidade de edição será implementada aqui
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}