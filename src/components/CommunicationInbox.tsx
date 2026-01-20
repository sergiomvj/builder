'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  MailOpen, 
  Archive, 
  Reply, 
  AlertCircle,
  Clock,
  Filter,
  Search,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

type CommunicationType = 'handoff' | 'notification' | 'approval_request' | 'question';
type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';
type CommunicationStatus = 'pending' | 'read' | 'acted_upon' | 'archived';

interface Communication {
  id: string;
  sender_persona_id: string;
  receiver_persona_id: string;
  communication_type: CommunicationType;
  priority: CommunicationPriority;
  subject: string;
  message: string;
  context_data: any;
  status: CommunicationStatus;
  requires_action: boolean;
  deadline: string | null;
  created_at: string;
  sender_name: string;
  sender_cargo: string;
  receiver_name: string;
  receiver_cargo: string;
  hours_since_created: number;
  hours_until_deadline: number | null;
}

interface CommunicationInboxProps {
  personaId?: string;
  empresaId?: string;
}

const TYPE_LABELS: Record<CommunicationType, string> = {
  handoff: 'Transferência',
  notification: 'Notificação',
  approval_request: 'Aprovação',
  question: 'Pergunta'
};

const TYPE_COLORS: Record<CommunicationType, string> = {
  handoff: 'bg-blue-100 text-blue-800',
  notification: 'bg-gray-100 text-gray-800',
  approval_request: 'bg-orange-100 text-orange-800',
  question: 'bg-purple-100 text-purple-800'
};

const PRIORITY_COLORS: Record<CommunicationPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
};

export function CommunicationInbox({ personaId, empresaId }: CommunicationInboxProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'read' | 'archived'>('pending');

  useEffect(() => {
    loadCommunications();
  }, [personaId, activeTab]);

  const loadCommunications = async () => {
    if (!personaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Usar API REST ao invés de query direta
      const params = new URLSearchParams({
        status: activeTab,
      });

      const response = await fetch(`/api/communications/${personaId}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar comunicações');
      }

      setCommunications(data.communications || []);
    } catch (error: any) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (commId: string) => {
    if (!personaId) return;

    try {
      const response = await fetch(`/api/communications/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: commId,
          action: 'mark_read'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      await loadCommunications();
    } catch (error: any) {
      console.error('Error marking as read:', error);
      alert(error.message || 'Erro ao marcar como lida.');
    }
  };

  const markAsActed = async (commId: string) => {
    if (!personaId) return;

    try {
      const response = await fetch(`/api/communications/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: commId,
          action: 'mark_acted'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      await loadCommunications();
    } catch (error: any) {
      console.error('Error marking as acted:', error);
      alert(error.message || 'Erro ao marcar ação feita.');
    }
  };

  const archiveCommunication = async (commId: string) => {
    if (!personaId) return;

    try {
      const response = await fetch(`/api/communications/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: commId,
          action: 'archive'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      await loadCommunications();
      setSelectedComm(null);
    } catch (error: any) {
      console.error('Error archiving:', error);
      alert(error.message || 'Erro ao arquivar.');
    }
  };

  const filteredCommunications = communications.filter(comm => {
    if (searchQuery && !comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !comm.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && comm.communication_type !== filterType) {
      return false;
    }
    if (filterPriority !== 'all' && comm.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const stats = {
    pending: communications.filter(c => c.status === 'pending').length,
    requires_action: communications.filter(c => c.requires_action).length,
    overdue: communications.filter(c => c.deadline && new Date(c.deadline) < new Date()).length
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Lista de Comunicações */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inbox de Comunicações</CardTitle>
              <CardDescription>
                {stats.pending} pendentes · {stats.requires_action} requerem ação · {stats.overdue} atrasadas
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={loadCommunications}>
              Atualizar
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="handoff">Transferência</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
                <SelectItem value="approval_request">Aprovação</SelectItem>
                <SelectItem value="question">Pergunta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="read">Lidas</TabsTrigger>
              <TabsTrigger value="archived">Arquivadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredCommunications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Mail className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma mensagem</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterType !== 'all' || filterPriority !== 'all'
                    ? 'Nenhuma mensagem corresponde aos filtros'
                    : 'Sua caixa de entrada está vazia'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCommunications.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedComm?.id === comm.id ? 'bg-accent' : ''
                    } ${comm.status === 'pending' ? 'bg-blue-50/50' : ''}`}
                    onClick={() => setSelectedComm(comm)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {comm.status === 'pending' ? (
                          <Mail className="w-5 h-5 text-blue-600" />
                        ) : (
                          <MailOpen className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{comm.sender_name}</span>
                          <Badge className={TYPE_COLORS[comm.communication_type]}>
                            {TYPE_LABELS[comm.communication_type]}
                          </Badge>
                          <Badge className={PRIORITY_COLORS[comm.priority]}>
                            {comm.priority}
                          </Badge>
                          {comm.requires_action && (
                            <Badge variant="destructive">Ação Requerida</Badge>
                          )}
                        </div>

                        <p className="text-sm font-medium truncate">{comm.subject}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {comm.message}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {comm.hours_since_created < 1
                              ? 'Agora'
                              : `há ${comm.hours_since_created}h`}
                          </div>
                          {comm.deadline && (
                            <div className={`flex items-center gap-1 ${
                              comm.hours_until_deadline && comm.hours_until_deadline < 0
                                ? 'text-red-600 font-medium'
                                : ''
                            }`}>
                              <AlertCircle className="w-3 h-3" />
                              {comm.hours_until_deadline && comm.hours_until_deadline < 0
                                ? `Atrasada ${Math.abs(comm.hours_until_deadline)}h`
                                : `Prazo: ${comm.hours_until_deadline}h`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detalhes da Comunicação */}
      {selectedComm && (
        <Card className="w-[500px] flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={TYPE_COLORS[selectedComm.communication_type]}>
                    {TYPE_LABELS[selectedComm.communication_type]}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[selectedComm.priority]}>
                    {selectedComm.priority}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{selectedComm.subject}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">De:</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedComm.sender_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedComm.sender_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedComm.sender_cargo}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Para:</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedComm.receiver_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedComm.receiver_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedComm.receiver_cargo}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm whitespace-pre-wrap">{selectedComm.message}</p>
              </div>

              {selectedComm.context_data && Object.keys(selectedComm.context_data).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Contexto Adicional:</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedComm.context_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedComm.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Prazo: {new Date(selectedComm.deadline).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t">
              {selectedComm.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead(selectedComm.id)}
                  >
                    <MailOpen className="w-4 h-4 mr-2" />
                    Marcar como Lida
                  </Button>
                  {selectedComm.requires_action && (
                    <Button
                      size="sm"
                      onClick={() => markAsActed(selectedComm.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar Ação Feita
                    </Button>
                  )}
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => archiveCommunication(selectedComm.id)}
              >
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </Button>
              <Button size="sm" variant="outline">
                <Reply className="w-4 h-4 mr-2" />
                Responder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
