'use client';

import React, { useState } from 'react';
import { 
  Calendar, CheckCircle, Clock, Users, Target,
  Plus, Filter, MoreHorizontal, AlertCircle,
  TrendingUp, Flag, MapPin, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Milestone {
  id: string;
  titulo: string;
  descricao: string;
  metaId: string;
  metaTitulo: string;
  dataInicio: string;
  dataFim: string;
  status: 'pendente' | 'em-progresso' | 'concluido' | 'atrasado';
  progresso: number;
  responsaveis: string[];
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  criteriosAceitacao: string[];
  dependencias: string[];
}

export function Milestones() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [filtroMeta, setFiltroMeta] = useState<string>('todas');

  const milestones: Milestone[] = [
    {
      id: '1',
      titulo: 'Análise de Mercado Q1',
      descricao: 'Estudo completo do mercado alvo e identificação de oportunidades',
      metaId: '1',
      metaTitulo: 'Crescimento 300% em 2026',
      dataInicio: '2024-01-01',
      dataFim: '2024-03-31',
      status: 'concluido',
      progresso: 100,
      responsaveis: ['Maria Silva (CEO)', 'João Santos (CMO)'],
      prioridade: 'alta',
      criteriosAceitacao: [
        'Relatório de análise competitiva',
        'Identificação de 5 nichos de mercado',
        'Projeção de crescimento validada'
      ],
      dependencias: []
    },
    {
      id: '2',
      titulo: 'Desenvolvimento de MVP',
      descricao: 'Criação do produto mínimo viável para validação no mercado',
      metaId: '1',
      metaTitulo: 'Crescimento 300% em 2026',
      dataInicio: '2024-04-01',
      dataFim: '2024-06-30',
      status: 'em-progresso',
      progresso: 65,
      responsaveis: ['Carlos Tech (CTO)', 'Ana Dev (Tech Lead)'],
      prioridade: 'critica',
      criteriosAceitacao: [
        'Interface funcional implementada',
        'Backend com APIs principais',
        'Testes automatizados > 80%',
        'Deploy em ambiente de staging'
      ],
      dependencias: ['1']
    },
    {
      id: '3',
      titulo: 'Campanha de Marketing Digital',
      descricao: 'Lançamento da estratégia de marketing digital para captação',
      metaId: '1',
      metaTitulo: 'Crescimento 300% em 2026',
      dataInicio: '2024-07-01',
      dataFim: '2024-09-30',
      status: 'pendente',
      progresso: 0,
      responsaveis: ['João Santos (CMO)', 'Luna Creative (Designer)'],
      prioridade: 'alta',
      criteriosAceitacao: [
        'Estratégia de conteúdo definida',
        '10 campanhas publicitárias ativas',
        'ROI > 200% nas campanhas',
        '50.000 leads qualificados'
      ],
      dependencias: ['2']
    },
    {
      id: '4',
      titulo: 'Expansão da Equipe',
      descricao: 'Contratação de talentos para suportar o crescimento',
      metaId: '1',
      metaTitulo: 'Crescimento 300% em 2026',
      dataInicio: '2024-05-01',
      dataFim: '2024-12-31',
      status: 'atrasado',
      progresso: 25,
      responsaveis: ['Sofia RH (Head de RH)', 'Maria Silva (CEO)'],
      prioridade: 'media',
      criteriosAceitacao: [
        '20 novos colaboradores contratados',
        'Processo de onboarding estruturado',
        'NPS interno > 8.0',
        'Retenção de talentos > 90%'
      ],
      dependencias: ['1']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em-progresso': return 'bg-blue-100 text-blue-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'atrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'em-progresso': return <Timer className="h-5 w-5 text-blue-500" />;
      case 'pendente': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'atrasado': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const milestonesFiltrados = milestones.filter(milestone => {
    if (filtroStatus !== 'todos' && milestone.status !== filtroStatus) return false;
    if (filtroPrioridade !== 'todas' && milestone.prioridade !== filtroPrioridade) return false;
    if (filtroMeta !== 'todas' && milestone.metaId !== filtroMeta) return false;
    return true;
  });

  const estatisticas = {
    total: milestones.length,
    concluidos: milestones.filter(m => m.status === 'concluido').length,
    emProgresso: milestones.filter(m => m.status === 'em-progresso').length,
    atrasados: milestones.filter(m => m.status === 'atrasado').length,
    progressoMedio: Math.round(milestones.reduce((acc, m) => acc + m.progresso, 0) / milestones.length)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marcos e Milestones</h2>
          <p className="text-gray-600">Acompanhe o progresso dos marcos das suas metas</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Marco
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
              <Flag className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.concluidos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.emProgresso}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.atrasados}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progresso Médio</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.progressoMedio}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em-progresso">Em Progresso</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroMeta} onValueChange={setFiltroMeta}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Metas</SelectItem>
                <SelectItem value="1">Crescimento 300% em 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Milestones */}
      <div className="space-y-4">
        {milestonesFiltrados.map((milestone) => (
          <Card key={milestone.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header do milestone */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(milestone.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{milestone.titulo}</h3>
                        <div 
                          className={`w-3 h-3 rounded-full ${getPrioridadeColor(milestone.prioridade)}`}
                          title={`Prioridade ${milestone.prioridade}`}
                        />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{milestone.descricao}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{milestone.metaTitulo}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(milestone.dataInicio).toLocaleDateString()} - {new Date(milestone.dataFim).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-medium">{milestone.progresso}%</span>
                  </div>
                  <Progress value={milestone.progresso} className="h-2" />
                </div>

                <Separator />

                {/* Responsáveis e critérios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Responsáveis</h4>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {milestone.responsaveis.map((responsavel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {responsavel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Critérios de Aceitação</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {milestone.criteriosAceitacao.slice(0, 2).map((criterio, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="mt-1">•</span>
                          <span>{criterio}</span>
                        </li>
                      ))}
                      {milestone.criteriosAceitacao.length > 2 && (
                        <li className="text-blue-600 cursor-pointer">
                          +{milestone.criteriosAceitacao.length - 2} mais...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {milestonesFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum marco encontrado</h3>
            <p className="text-gray-600">Ajuste os filtros ou crie um novo marco</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}