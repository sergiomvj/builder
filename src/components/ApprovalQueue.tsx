'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ArrowRight,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

type SupervisionDecision = 'approved' | 'approved_with_modifications' | 'rejected' | 'escalated' | 'pending';

interface SupervisionLog {
  id: string;
  task_id: string;
  task_title: string;
  task_template_code: string;
  task_value: number | null;
  task_risk_level: string | null;
  task_context: any;
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

interface ApprovalQueueProps {
  supervision: SupervisionLog;
  onApproved?: () => void;
  onRejected?: () => void;
  onEscalated?: () => void;
  onClose?: () => void;
}

interface ModificationField {
  field: string;
  originalValue: any;
  newValue: any;
  reason: string;
}

export function ApprovalQueue({ 
  supervision, 
  onApproved, 
  onRejected, 
  onEscalated,
  onClose 
}: ApprovalQueueProps) {
  const [decision, setDecision] = useState<SupervisionDecision>('pending');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [modifications, setModifications] = useState<ModificationField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'modify' | 'reject'>('review');

  // Quick actions com notas pré-definidas
  const quickApprovals = [
    { label: 'Aprovar sem Ressalvas', notes: 'Aprovado conforme solicitado. Todas as condições foram atendidas.' },
    { label: 'Aprovar com Ressalvas Menores', notes: 'Aprovado com pequenas observações que devem ser consideradas na execução.' },
    { label: 'Aprovar Emergencialmente', notes: 'Aprovação emergencial devido à urgência. Revisão posterior necessária.' }
  ];

  const quickRejections = [
    { label: 'Orçamento Insuficiente', notes: 'Rejeitado: o valor solicitado excede o orçamento disponível.' },
    { label: 'Falta de Justificativa', notes: 'Rejeitado: a justificativa apresentada não é suficiente para aprovação.' },
    { label: 'Não Prioritário', notes: 'Rejeitado: existem outras prioridades mais urgentes no momento.' },
    { label: 'Documentação Incompleta', notes: 'Rejeitado: documentação incompleta. Favor reenviar com todos os dados.' }
  ];

  const addModification = () => {
    setModifications([...modifications, { field: '', originalValue: '', newValue: '', reason: '' }]);
  };

  const updateModification = (index: number, field: keyof ModificationField, value: any) => {
    const updated = [...modifications];
    updated[index] = { ...updated[index], [field]: value };
    setModifications(updated);
  };

  const removeModification = (index: number) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!decisionNotes.trim() && (decision === 'rejected' || decision === 'escalated')) {
      alert('Por favor, adicione uma justificativa para sua decisão.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Usar API REST ao invés de update direto
      const response = await fetch(`/api/approvals/${supervision.task_id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisor_persona_id: supervision.supervisor_persona_id,
          decision,
          decision_notes: decisionNotes,
          modifications_requested: decision === 'approved_with_modifications' ? modifications : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao submeter decisão');
      }

      // Callbacks
      if (decision === 'approved' || decision === 'approved_with_modifications') {
        onApproved?.();
      } else if (decision === 'rejected') {
        onRejected?.();
      } else if (decision === 'escalated') {
        onEscalated?.();
      }

      onClose?.();
    } catch (error: any) {
      console.error('Error submitting decision:', error);
      alert(error.message || 'Erro ao submeter decisão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTaskDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Executor</Label>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">{supervision.executor_name}</p>
              <p className="text-xs text-muted-foreground">{supervision.executor_cargo}</p>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Template</Label>
          <Badge variant="outline" className="mt-1">
            {supervision.task_template_code}
          </Badge>
        </div>

        {supervision.task_value && (
          <div>
            <Label className="text-muted-foreground">Valor</Label>
            <div className="flex items-center gap-1 mt-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-600">
                R$ {supervision.task_value.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {supervision.task_risk_level && (
          <div>
            <Label className="text-muted-foreground">Nível de Risco</Label>
            <Badge 
              variant={supervision.task_risk_level === 'high' ? 'destructive' : 'secondary'}
              className="mt-1"
            >
              {supervision.task_risk_level}
            </Badge>
          </div>
        )}

        <div>
          <Label className="text-muted-foreground">Solicitado em</Label>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Calendar className="w-4 h-4" />
            {new Date(supervision.requested_at).toLocaleString('pt-BR')}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Aguardando</Label>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Clock className="w-4 h-4" />
            {supervision.hours_waiting.toFixed(0)} horas
          </div>
        </div>
      </div>

      {supervision.deadline && (
        <Alert variant={supervision.is_overdue ? 'destructive' : 'default'}>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            {supervision.is_overdue ? (
              <span className="font-medium">
                ATRASADA: Prazo expirou há {Math.abs(supervision.hours_until_deadline || 0).toFixed(0)} horas
              </span>
            ) : (
              <span>
                Prazo: {new Date(supervision.deadline).toLocaleString('pt-BR')} 
                ({supervision.hours_until_deadline?.toFixed(0)}h restantes)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {supervision.task_context && Object.keys(supervision.task_context).length > 0 && (
        <div>
          <Label className="text-muted-foreground mb-2 block">Contexto da Tarefa</Label>
          <div className="bg-muted p-3 rounded-md text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(supervision.task_context, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{supervision.task_title}</CardTitle>
            <CardDescription>
              Revisão de Solicitação de Supervisão
            </CardDescription>
          </div>
          {supervision.is_overdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              ATRASADA
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aprovar
            </TabsTrigger>
            <TabsTrigger value="modify">
              <Edit3 className="w-4 h-4 mr-2" />
              Modificar
            </TabsTrigger>
            <TabsTrigger value="reject">
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </TabsTrigger>
          </TabsList>

          {/* TAB: Aprovar */}
          <TabsContent value="review" className="space-y-4">
            {renderTaskDetails()}

            <div className="space-y-2">
              <Label htmlFor="approval-notes">Observações (Opcional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Adicione observações sobre a aprovação..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Aprovações Rápidas</Label>
              <div className="flex flex-wrap gap-2">
                {quickApprovals.map((qa) => (
                  <Button
                    key={qa.label}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDecisionNotes(qa.notes);
                      setDecision('approved');
                    }}
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB: Modificar */}
          <TabsContent value="modify" className="space-y-4">
            {renderTaskDetails()}

            <Alert>
              <Edit3 className="w-4 h-4" />
              <AlertDescription>
                Liste as modificações necessárias. A tarefa será aprovada com estas alterações.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {modifications.map((mod, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Modificação {index + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeModification(index)}
                      >
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Campo</Label>
                        <Input
                          placeholder="Ex: orçamento, prazo, escopo"
                          value={mod.field}
                          onChange={(e) => updateModification(index, 'field', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor Original</Label>
                        <Input
                          placeholder="Valor atual"
                          value={mod.originalValue}
                          onChange={(e) => updateModification(index, 'originalValue', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Novo Valor</Label>
                        <Input
                          placeholder="Valor corrigido"
                          value={mod.newValue}
                          onChange={(e) => updateModification(index, 'newValue', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Motivo</Label>
                        <Input
                          placeholder="Razão da mudança"
                          value={mod.reason}
                          onChange={(e) => updateModification(index, 'reason', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addModification}
                className="w-full"
              >
                + Adicionar Modificação
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modification-notes">Observações Adicionais</Label>
              <Textarea
                id="modification-notes"
                placeholder="Explique as modificações solicitadas..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* TAB: Rejeitar */}
          <TabsContent value="reject" className="space-y-4">
            {renderTaskDetails()}

            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                Esta tarefa será rejeitada e o executor será notificado.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Rejeições Rápidas</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickRejections.map((qr) => (
                  <Button
                    key={qr.label}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDecisionNotes(qr.notes);
                      setDecision('rejected');
                    }}
                  >
                    {qr.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-notes">Justificativa da Rejeição *</Label>
              <Textarea
                id="rejection-notes"
                placeholder="Explique detalhadamente o motivo da rejeição..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={5}
                className="border-red-300 focus:border-red-500"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDecision('escalated');
              setDecisionNotes('Escalado para nível superior de supervisão devido à complexidade/valor.');
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Escalar
          </Button>
        </div>

        <Button
          onClick={() => {
            if (activeTab === 'review') {
              setDecision('approved');
            } else if (activeTab === 'modify') {
              setDecision('approved_with_modifications');
            } else {
              setDecision('rejected');
            }
            setTimeout(() => handleSubmit(), 100);
          }}
          disabled={isSubmitting || (!decisionNotes.trim() && activeTab !== 'review')}
          className={
            activeTab === 'reject' 
              ? 'bg-red-600 hover:bg-red-700' 
              : activeTab === 'modify'
              ? 'bg-blue-600 hover:bg-blue-700'
              : ''
          }
        >
          {isSubmitting ? (
            'Processando...'
          ) : activeTab === 'review' ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aprovar
            </>
          ) : activeTab === 'modify' ? (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Aprovar com Modificações
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
