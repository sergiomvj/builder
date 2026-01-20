'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Zap, 
  PlayCircle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CascadeStep {
  id: string;
  name: string;
  script: string;
  apiKey: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
  output?: string;
}

export function QuickCascadePanel() {
  const params = useParams();
  const empresaId = params?.id as string;
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<CascadeStep[]>([
    { id: '01', name: 'Criar Personas', script: '01_create_personas_from_structure.js', apiKey: 'create_personas', status: 'pending' },
    { id: '02', name: 'Gerar Biografias', script: '02_generate_biografias_COMPLETO.js', apiKey: 'biografias', status: 'pending' },
    { id: '03', name: 'Atribuições', script: '03_generate_atribuicoes_contextualizadas.cjs', apiKey: 'atribuicoes', status: 'pending' },
    { id: '04', name: 'Competências', script: '04_generate_competencias_grok.cjs', apiKey: 'competencias', status: 'pending' },
    { id: '05', name: 'Avatares', script: '05_generate_avatares.cjs', apiKey: 'avatares', status: 'pending' },
    { id: '06', name: 'Análise Automação', script: '06_analyze_tasks_for_automation_v2.js', apiKey: 'automation_analysis', status: 'pending' },
    { id: '07', name: 'Workflows N8N', script: '07_generate_n8n_workflows.js', apiKey: 'workflows', status: 'pending' },
    { id: '08', name: 'Machine Learning', script: '08_generate_machine_learning.cjs', apiKey: 'machine_learning', status: 'pending' },
    { id: '09', name: 'Auditoria', script: '09_generate_auditoria.cjs', apiKey: 'auditoria', status: 'pending' }
  ]);

  // Polling para verificar status dos scripts no banco
  useEffect(() => {
    if (!empresaId) return;

    const pollStatus = async () => {
      const { data } = await supabase
        .from('empresas')
        .select('scripts_status')
        .eq('id', empresaId)
        .single();

      if (data?.scripts_status) {
        setSteps(prev => prev.map(step => ({
          ...step,
          status: data.scripts_status[step.apiKey] ? 'completed' : step.status
        })));

        // Calcular progresso
        const completed = Object.values(data.scripts_status).filter(Boolean).length;
        setProgress((completed / 9) * 100);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000); // A cada 5s

    return () => clearInterval(interval);
  }, [empresaId, isRunning]);

  const runCascade = async () => {
    if (!empresaId) {
      alert('Empresa ID não encontrado');
      return;
    }

    setIsRunning(true);

    try {
      // Executar cada script em sequência
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStep(i);

        // Marca como running
        setSteps(prev => prev.map((s, idx) => ({
          ...s,
          status: idx === i ? 'running' : s.status
        })));

        console.log(`🚀 Executando ${step.name}...`);

        // Chama API para executar script
        const response = await fetch('/api/automation/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptId: step.apiKey,
            empresaId: empresaId
          })
        });

        if (!response.ok) {
          throw new Error(`Erro ao executar ${step.name}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Marca como completed
          setSteps(prev => prev.map((s, idx) => ({
            ...s,
            status: idx === i ? 'completed' : s.status
          })));

          console.log(`✅ ${step.name} concluído`);
        } else {
          throw new Error(result.error || `Erro em ${step.name}`);
        }

        // Aguarda sync_script_status atualizar o banco
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setProgress(100);
      alert('🎉 Cascata completa concluída com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro na cascata:', error);
      
      // Marca step atual como error
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx === currentStep ? 'error' : s.status
      })));

      alert(`Erro: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCascade = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setProgress(0);
    setCurrentStep(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <PlayCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <span className="text-blue-900">Execução Rápida - Cascata Completa</span>
        </CardTitle>
        <p className="text-blue-700 text-sm">
          Execute toda a sequência de 9 scripts automaticamente (00 → 01 → 01.3 → 01.4 → 01.5 → 01.7 → 02 → 02.5 → 03)
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Botões de Controle */}
        <div className="flex space-x-3 mb-6">
          <Button
            onClick={runCascade}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isRunning ? 'Executando...' : 'Executar Cascata'}</span>
          </Button>
          
          {!isRunning && (
            <Button
              variant="outline"
              onClick={resetCascade}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Resetar
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Progresso Geral</span>
              <span className="text-sm text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-blue-100" />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                step.status === 'running' 
                  ? 'bg-yellow-50 border-yellow-200 shadow-md' 
                  : step.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : step.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(step.status)}
                <div>
                  <p className="font-medium text-sm">
                    Script {step.id}: {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.script}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={
                    step.status === 'running' ? 'border-yellow-400 text-yellow-700' :
                    step.status === 'completed' ? 'border-green-400 text-green-700' :
                    step.status === 'error' ? 'border-red-400 text-red-700' :
                    'border-gray-400 text-gray-700'
                  }
                >
                  {step.status === 'pending' && 'Aguardando'}
                  {step.status === 'running' && 'Executando'}
                  {step.status === 'completed' && 'Concluído'}
                  {step.status === 'error' && 'Erro'}
                </Badge>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            {isRunning ? (
              `Executando Script ${currentStep + 1} de ${steps.length}...`
            ) : progress === 100 ? (
              'Cascata concluída com sucesso! ✨'
            ) : (
              'Pronto para execução da cascata completa'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}