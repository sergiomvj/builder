'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Filter,
  TrendingUp,
  Users
} from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

type SupervisionDecision = 'approved' | 'approved_with_modifications' | 'rejected' | 'escalated' | 'pending';

interface SupervisionLog {
  id: string;
  task_id: string;
  task_title: string;
  task_template_code: string;
  task_value: number;
  executor_persona_id: string;
  executor_name: string;
  executor_cargo: string;
  supervisor_persona_id: string;
  supervisor_name: string;
  supervisor_cargo: string;
  decision: SupervisionDecision;
  requested_at: string;
  deadline: string | null;
  hours_waiting: number;
  hours_until_deadline: number | null;
  is_overdue: boolean;
}

interface SupervisionDashboardProps {
  supervisorId?: string;
  empresaId?: string;
}

const DECISION_COLORS: Record<SupervisionDecision, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  approved_with_modifications: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-purple-100 text-purple-800'
};

const DECISION_ICONS: Record<SupervisionDecision, any> = {
  pending: Clock,
  approved: CheckCircle2,
  approved_with_modifications: CheckCircle2,
  rejected: XCircle,
  escalated: ArrowRight
};

export function SupervisionDashboard({ supervisorId, empresaId }: SupervisionDashboardProps) {
  const [supervisions, setSupervisions] = useState<SupervisionLog[]>([]);
  const [selectedSupervision, setSelectedSupervision] = useState<SupervisionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);

  useEffect(() => {
    loadSupervisions();
  }, [supervisorId]);

  const loadSupervisions = async () => {
    setLoading(true);
    try {
      // Usar API REST ao invés de query direta
      const params = new URLSearchParams();
      if (supervisorId) {
        params.append('supervisor_id', supervisorId);
      }

      const response = await fetch(`/api/supervision/dashboard?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar supervisões');
      }

      setSupervisions(data.pending_items || []);
    } catch (error: any) {
      console.error('Error loading supervisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisions = supervisions.filter(sup => {
    if (filterArea !== 'all') {
      // Extrai área do código do template (ex: MKT_GERAR_LEADS -> MKT)
      const area = sup.task_template_code.split('_')[0];
      return area === filterArea;
    }
    return true;
  });

  const stats = {
    total: filteredSupervisions.length,
    overdue: filteredSupervisions.filter(s => s.is_overdue).length,
    urgent: filteredSupervisions.filter(s => s.hours_until_deadline && s.hours_until_deadline < 24).length,
    highValue: filteredSupervisions.filter(s => s.task_value && s.task_value > 10000).length
  };

  const areaDistribution = filteredSupervisions.reduce((acc, sup) => {
    const area = sup.task_template_code.split('_')[0];
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueAreas = Array.from(new Set(supervisions.map(s => s.task_template_code.split('_')[0])));

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              SLA excedido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prazo &lt; 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alto Valor</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.highValue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor &gt; R$ 10k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Área */}
      {Object.keys(areaDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Área Funcional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(areaDistribution).map(([area, count]) => {
                const percentage = (count / stats.total) * 100;
                return (
                  <div key={area}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{area}</span>
                      <span className="text-muted-foreground">{count} tarefas ({percentage.toFixed(0)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Supervisões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aprovações Pendentes</CardTitle>
              <CardDescription>
                Tarefas aguardando sua supervisão
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {uniqueAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadSupervisions} variant="outline">
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredSupervisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-medium">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground">
                Não há aprovações pendentes no momento
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredSupervisions.map((supervision) => {
                  const area = supervision.task_template_code.split('_')[0];
                  const isOverdue = supervision.is_overdue;
                  const isUrgent = supervision.hours_until_deadline && supervision.hours_until_deadline < 24;

                  return (
                    <Card
                      key={supervision.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        isOverdue ? 'border-red-500 bg-red-50/50' : ''
                      } ${isUrgent && !isOverdue ? 'border-orange-500 bg-orange-50/50' : ''}`}
                      onClick={() => {
                        setSelectedSupervision(supervision);
                        setShowApprovalQueue(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{area}</Badge>
                              {isOverdue && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  ATRASADA
                                </Badge>
                              )}
                              {isUrgent && !isOverdue && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  URGENTE
                                </Badge>
                              )}
                              {supervision.task_value && supervision.task_value > 10000 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Alto Valor
                                </Badge>
                              )}
                            </div>

                            <h4 className="font-semibold mb-1">{supervision.task_title}</h4>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{supervision.executor_name}</span>
                              </div>
                              {supervision.task_value && (
                                <div className="font-medium text-green-600">
                                  R$ {supervision.task_value.toLocaleString('pt-BR')}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Aguardando há {supervision.hours_waiting.toFixed(0)}h
                              </div>
                              {supervision.deadline && (
                                <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                  {isOverdue
                                    ? `Atrasada ${Math.abs(supervision.hours_until_deadline || 0).toFixed(0)}h`
                                    : `Prazo: ${supervision.hours_until_deadline?.toFixed(0)}h`}
                                </div>
                              )}
                            </div>

                            {supervision.deadline && !isOverdue && (
                              <Progress 
                                value={Math.min(100, ((supervision.hours_waiting / 48) * 100))} 
                                className="h-1 mt-2"
                              />
                            )}
                          </div>

                          <Button size="sm" variant="outline">
                            Revisar
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal/Sidebar de Aprovação */}
      {showApprovalQueue && selectedSupervision && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Revisar Solicitação de Supervisão</CardTitle>
                  <CardDescription>
                    {selectedSupervision.task_title}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowApprovalQueue(false);
                    setSelectedSupervision(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Executor:</p>
                    <p className="font-medium">{selectedSupervision.executor_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedSupervision.executor_cargo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Template:</p>
                    <Badge variant="outline">{selectedSupervision.task_template_code}</Badge>
                  </div>
                  {selectedSupervision.task_value && (
                    <div>
                      <p className="text-muted-foreground mb-1">Valor:</p>
                      <p className="font-medium text-green-600">
                        R$ {selectedSupervision.task_value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Solicitado em:</p>
                    <p className="font-medium">
                      {new Date(selectedSupervision.requested_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Esta solicitação será implementada em componente ApprovalQueue</p>
                  <Button className="w-full">
                    Abrir Fila de Aprovação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
