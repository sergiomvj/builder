'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SupervisionDashboard } from '@/components/SupervisionDashboard';
import { Shield, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

interface Persona {
  id: string;
  nome: string;
  cargo: string;
  avatar_url: string | null;
}

interface DashboardStats {
  total_pending: number;
  overdue: number;
  urgent: number;
  high_value: number;
  avg_waiting_hours: number;
  sla_exceeded_count: number;
}

export default function SupervisionPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('all');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedSupervisorId) {
      loadStats();
    }
  }, [selectedSupervisorId]);

  const loadPersonas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = SupabaseSingleton.getInstance();
      
      // Buscar personas que são supervisores (aparecem em task_supervision_chains)
      const { data: chains } = await supabase
        .from('task_supervision_chains')
        .select('supervisor_persona_id');

      if (chains) {
        const supervisorIds = Array.from(new Set(chains.map(c => c.supervisor_persona_id)));
        
        const { data, error: fetchError } = await supabase
          .from('personas')
          .select('id, nome, cargo, avatar_url')
          .in('id', supervisorIds)
          .order('nome', { ascending: true });

        if (fetchError) throw fetchError;
        setPersonas(data || []);
      }

    } catch (err: any) {
      console.error('Error loading personas:', err);
      setError(err.message || 'Erro ao carregar supervisores');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const url = selectedSupervisorId === 'all' 
        ? '/api/supervision/dashboard'
        : `/api/supervision/dashboard?supervisor_id=${selectedSupervisorId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar estatísticas');
      }

      setStats(data.stats);

    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const selectedPersona = personas.find(p => p.id === selectedSupervisorId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Central de Supervisão
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie aprovações e supervisione tarefas da organização
          </p>
        </div>
        <Button onClick={loadStats} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Passaram do deadline
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
              <p className="text-xs text-muted-foreground">
                Menos de 24h restantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alto Valor</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.high_value}</div>
              <p className="text-xs text-muted-foreground">
                Valor &gt; R$ 10k
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seletor de Supervisor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Filtrar por Supervisor
          </CardTitle>
          <CardDescription>
            Visualize aprovações de um supervisor específico ou todos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando supervisores...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={loadPersonas}
                >
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um supervisor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="font-medium">Todos os Supervisores</span>
                  </SelectItem>
                  {personas.map(persona => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        {(persona.avatar_local_path || persona.avatar_url) && (
                          <img 
                            src={(persona.avatar_local_path || persona.avatar_url)} 
                            alt={persona.nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{persona.nome}</span>
                        <span className="text-muted-foreground text-sm">({persona.cargo})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPersona && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  {selected(persona.avatar_local_path || persona.avatar_url) ? (
                    <img 
                      src={selected(persona.avatar_local_path || persona.avatar_url)} 
                      alt={selectedPersona.nome}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{selectedPersona.nome}</p>
                    <p className="text-sm text-muted-foreground">{selectedPersona.cargo}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard de Supervisão */}
      <SupervisionDashboard 
        supervisorId={selectedSupervisorId === 'all' ? undefined : selectedSupervisorId}
      />

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Sobre a Supervisão</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Sistema de Aprovação Hierárquica:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Nível 1:</strong> Supervisores diretos (cargo imediatamente superior)</li>
            <li><strong>Nível 2:</strong> Gerentes (cargo de nível médio)</li>
            <li><strong>Nível 3+:</strong> Diretoria e C-Level (decisões estratégicas)</li>
          </ul>

          <p className="mt-4">
            <strong>Decisões Disponíveis:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-green-600">Aprovar:</strong> Autoriza execução sem alterações</li>
            <li><strong className="text-blue-600">Aprovar com Modificações:</strong> Autoriza com ajustes específicos</li>
            <li><strong className="text-red-600">Rejeitar:</strong> Nega a solicitação com justificativa</li>
            <li><strong className="text-orange-600">Escalar:</strong> Envia para próximo nível hierárquico</li>
          </ul>

          <p className="mt-4">
            <strong>SLA (Service Level Agreement):</strong>
          </p>
          <p className="ml-2">
            Supervisões devem ser respondidas em até <strong>48 horas</strong>.
            Aprovações atrasadas são destacadas em vermelho e afetam métricas de performance.
          </p>

          <p className="mt-4 text-xs">
            <strong>💡 Dica:</strong> Priorize aprovações atrasadas e de alto valor.
            Use a funcionalidade de "Quick Actions" para agilizar decisões comuns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
