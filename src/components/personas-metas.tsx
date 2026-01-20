'use client';

import React, { useState } from 'react';
import { 
  Users, UserCheck, Target, Calendar, 
  CheckCircle, Clock, AlertCircle, Plus,
  ArrowRight, BarChart3, Filter, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Persona {
  id: string;
  nome: string;
  cargo: string;
  tipo: 'executivo' | 'especialista' | 'assistente';
  avatar?: string;
  metasAtivas: number;
  progressoMedio: number;
  capacidade: 'baixa' | 'media' | 'alta';
}

interface MetaPersona {
  id: string;
  titulo: string;
  meta_global_id: string;
  meta_global_titulo: string;
  persona_id: string;
  prazo: string;
  progresso: number;
  status: 'ativa' | 'pausada' | 'concluida' | 'atrasada';
  alinhamento_score: number;
}

interface PersonasMetasProps {
  metaGlobalSelecionada?: string | null;
}

export function PersonasMetas({ metaGlobalSelecionada }: PersonasMetasProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [pesquisa, setPesquisa] = useState('');
  const [modalAtribuicaoAberto, setModalAtribuicaoAberto] = useState(false);
  const [personaSelecionada, setPersonaSelecionada] = useState<Persona | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Dados mock - serão substituídos por dados reais do Supabase
  const personas: Persona[] = [
    {
      id: '1',
      nome: 'Maria Silva',
      cargo: 'CEO',
      tipo: 'executivo',
      metasAtivas: 3,
      progressoMedio: 85,
      capacidade: 'alta'
    },
    {
      id: '2',
      nome: 'João Santos',
      cargo: 'CRO',
      tipo: 'executivo',
      metasAtivas: 4,
      progressoMedio: 72,
      capacidade: 'alta'
    },
    {
      id: '3',
      nome: 'Ana Costa',
      cargo: 'Tech Lead',
      tipo: 'especialista',
      metasAtivas: 5,
      progressoMedio: 90,
      capacidade: 'media'
    },
    {
      id: '4',
      nome: 'Carlos Lima',
      cargo: 'Sales Manager',
      tipo: 'especialista',
      metasAtivas: 3,
      progressoMedio: 78,
      capacidade: 'alta'
    },
    {
      id: '5',
      nome: 'Julia Oliveira',
      cargo: 'Marketing Assistant',
      tipo: 'assistente',
      metasAtivas: 2,
      progressoMedio: 95,
      capacidade: 'media'
    }
  ];

  const metasPersonas: MetaPersona[] = [
    {
      id: '1',
      titulo: 'Implementar estratégia de crescimento Q1',
      meta_global_id: '1',
      meta_global_titulo: 'Crescimento 300% em 2026',
      persona_id: '1',
      prazo: '2025-03-31',
      progresso: 80,
      status: 'ativa',
      alinhamento_score: 95
    },
    {
      id: '2',
      titulo: 'Expandir equipe de vendas LATAM',
      meta_global_id: '2',
      meta_global_titulo: 'Expansão LATAM Q2',
      persona_id: '2',
      prazo: '2025-06-30',
      progresso: 60,
      status: 'ativa',
      alinhamento_score: 88
    },
    {
      id: '3',
      titulo: 'Desenvolver nova arquitetura de sistema',
      meta_global_id: '1',
      meta_global_titulo: 'Crescimento 300% em 2026',
      persona_id: '3',
      prazo: '2025-05-15',
      progresso: 45,
      status: 'atrasada',
      alinhamento_score: 92
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-500';
      case 'pausada': return 'bg-yellow-500';
      case 'concluida': return 'bg-blue-500';
      case 'atrasada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCapacidadeColor = (capacidade: string) => {
    switch (capacidade) {
      case 'alta': return 'text-green-600 bg-green-100';
      case 'media': return 'text-yellow-600 bg-yellow-100';
      case 'baixa': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAtribuirMeta = (persona: Persona) => {
    setPersonaSelecionada(persona);
    setModalAtribuicaoAberto(true);
  };

  const handleVerDetalhes = (persona: Persona) => {
    setPersonaSelecionada(persona);
    setModalDetalhesAberto(true);
  };

  const handleSalvarAtribuicao = () => {
    // Implementar lógica para salvar nova atribuição
    console.log('Salvando atribuição para:', personaSelecionada);
    setModalAtribuicaoAberto(false);
    setPersonaSelecionada(null);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'executivo': return '👔';
      case 'especialista': return '🎯';
      case 'assistente': return '🤝';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Matriz de Responsabilidades
          </CardTitle>
          <CardDescription>
            Gerencie a atribuição de metas por persona e acompanhe o progresso individual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Pesquisar personas..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="executivo">Executivos</SelectItem>
                <SelectItem value="especialista">Especialistas</SelectItem>
                <SelectItem value="assistente">Assistentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="atrasada">Atrasadas</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setModalAtribuicaoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Atribuir Meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona) => (
          <Card key={persona.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={persona.avatar} />
                  <AvatarFallback>
                    {persona.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{persona.nome}</h3>
                  <p className="text-sm text-gray-600">{persona.cargo}</p>
                </div>
                <span className="text-lg">{getTipoIcon(persona.tipo)}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Metas Ativas</p>
                  <p className="font-semibold">{persona.metasAtivas}</p>
                </div>
                <div>
                  <p className="text-gray-600">Progresso Médio</p>
                  <p className="font-semibold">{persona.progressoMedio}%</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Capacidade</span>
                  <Badge className={getCapacidadeColor(persona.capacidade)}>
                    {persona.capacidade.charAt(0).toUpperCase() + persona.capacidade.slice(1)}
                  </Badge>
                </div>
                <Progress value={persona.progressoMedio} className="h-2" />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  size="sm"
                  onClick={() => handleVerDetalhes(persona)}
                >
                  Ver Metas
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleAtribuirMeta(persona)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Metas por Persona */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Ativas por Persona</CardTitle>
          <CardDescription>
            Acompanhe o status detalhado de cada meta atribuída
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metasPersonas.map((meta) => {
              const persona = personas.find(p => p.id === meta.persona_id);
              return (
                <div key={meta.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {persona?.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{meta.titulo}</h4>
                          <p className="text-sm text-gray-600">
                            {persona?.nome} • {meta.meta_global_titulo}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(meta.status)}`} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Progresso</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={meta.progresso} className="flex-1" />
                            <span className="font-medium">{meta.progresso}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Prazo</p>
                          <p className="font-medium mt-1">
                            {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Alinhamento</p>
                          <div className="flex items-center gap-1 mt-1">
                            <BarChart3 className="h-3 w-3" />
                            <span className="font-medium">{meta.alinhamento_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Atribuição de Meta */}
      <Dialog open={modalAtribuicaoAberto} onOpenChange={setModalAtribuicaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Nova Meta</DialogTitle>
            <DialogDescription>
              {personaSelecionada ? 
                `Atribuir meta para ${personaSelecionada.nome}` : 
                'Selecionar persona para atribuição'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!personaSelecionada && (
              <Select onValueChange={(value) => {
                const persona = personas.find(p => p.id === value);
                setPersonaSelecionada(persona || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar Persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map(persona => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.nome} - {persona.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar Meta Global" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Crescimento 300% em 2026</SelectItem>
                <SelectItem value="2">Expansão LATAM Q2</SelectItem>
                <SelectItem value="3">Otimização Operacional</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Título da meta específica" />
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSalvarAtribuicao} className="flex-1">
                Atribuir Meta
              </Button>
              <Button variant="outline" onClick={() => {
                setModalAtribuicaoAberto(false);
                setPersonaSelecionada(null);
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Persona */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {personaSelecionada?.nome} - Detalhes das Metas
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie todas as metas atribuídas a esta persona
            </DialogDescription>
          </DialogHeader>
          
          {personaSelecionada && (
            <div className="space-y-4">
              {/* Informações da Persona */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {personaSelecionada.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{personaSelecionada.nome}</h3>
                  <p className="text-sm text-gray-600">{personaSelecionada.cargo}</p>
                </div>
                <Badge className={getCapacidadeColor(personaSelecionada.capacidade)}>
                  Capacidade: {personaSelecionada.capacidade.charAt(0).toUpperCase() + personaSelecionada.capacidade.slice(1)}
                </Badge>
              </div>

              {/* Metas da Persona */}
              <div className="space-y-3">
                <h4 className="font-medium">Metas Ativas ({personaSelecionada.metasAtivas})</h4>
                {metasPersonas
                  .filter(meta => meta.persona_id === personaSelecionada.id)
                  .map(meta => (
                    <div key={meta.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium">{meta.titulo}</h5>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(meta.status)}`} />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{meta.meta_global_titulo}</p>
                      
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Progresso</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={meta.progresso} className="flex-1" />
                            <span className="font-medium">{meta.progresso}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Prazo</p>
                          <p className="font-medium mt-1">
                            {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Alinhamento</p>
                          <p className="font-medium mt-1">{meta.alinhamento_score}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleAtribuirMeta(personaSelecionada)} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Atribuir Nova Meta
                </Button>
                <Button variant="outline" onClick={() => {
                  setModalDetalhesAberto(false);
                  setPersonaSelecionada(null);
                }}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}