'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskCreationWizard } from '@/components/TaskCreationWizard';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTaskCreate = async (taskData: {
    template_code: string;
    template_name: string;
    parameters: Record<string, any>;
    assigned_to?: string;
    priority?: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Chamar API de criação de tarefa
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_code: taskData.template_code,
          parameters: taskData.parameters,
          assigned_to: taskData.assigned_to || 'auto',
          priority: taskData.priority || 'normal',
          user_id: 'current-user', // TODO: Pegar do contexto de autenticação
          user_email: 'user@example.com' // TODO: Pegar do contexto de autenticação
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar tarefa');
      }

      setResult(data);

      // Auto-redirecionar após 3 segundos
      setTimeout(() => {
        router.push('/tasks');
      }, 3000);

    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || 'Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Criar Nova Tarefa</h1>
          <p className="text-muted-foreground mt-1">
            Use templates pré-definidos para criar tarefas estruturadas
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Resultado da Criação */}
      {result && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-semibold">✅ Tarefa criada com sucesso!</p>
              
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Template:</span> {result.task?.template_name}
                </p>
                <p>
                  <span className="font-medium">Assignado para:</span> {result.task?.assigned_to?.nome} ({result.task?.assigned_to?.cargo})
                </p>
                <p>
                  <span className="font-medium">Prioridade:</span> {result.task?.priority}
                </p>
                <p>
                  <span className="font-medium">ID da Intervenção:</span> {result.intervention_id}
                </p>
                
                {result.requires_supervision && (
                  <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-200">
                    <p className="font-medium text-orange-800">
                      ⚠️ Esta tarefa requer aprovação de supervisor
                    </p>
                    <p className="text-xs text-orange-700">
                      Aguardando aprovação antes de iniciar execução
                    </p>
                  </div>
                )}

                {result.task?.expected_metrics && result.task.expected_metrics.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Métricas Esperadas:</p>
                    <ul className="text-xs list-disc list-inside">
                      {result.task.expected_metrics.map((metric: any, index: number) => (
                        <li key={index}>
                          {metric.name}: {metric.target_value} {metric.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 mt-3">
                Redirecionando para lista de tarefas em 3 segundos...
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Erro ao criar tarefa</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setError(null)}
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Wizard de Criação */}
      <Card>
        <CardHeader>
          <CardTitle>Assistente de Criação</CardTitle>
          <CardDescription>
            Siga os passos para criar sua tarefa estruturada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskCreationWizard
            onComplete={handleTaskCreate}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>1. Escolha a área funcional:</strong> Marketing, Vendas, Financeiro, Operações, Produto, Qualidade ou Geral.
          </p>
          <p>
            <strong>2. Selecione um template:</strong> Cada área possui templates específicos com parâmetros pré-definidos.
          </p>
          <p>
            <strong>3. Preencha os parâmetros:</strong> Forneça as informações necessárias para a execução da tarefa.
          </p>
          <p>
            <strong>4. Revise e confirme:</strong> Verifique todos os dados antes de criar a tarefa.
          </p>
          <p className="mt-4 text-xs">
            <strong>⚠️ Nota:</strong> Tarefas que requerem supervisão serão enviadas para aprovação antes de iniciar a execução.
            Você receberá uma notificação quando a aprovação for concedida ou rejeitada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
