'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Building,
  Users,
  CheckCircle,
  ArrowRight,
  FileText,
  Database,
  Zap,
  Play,
  BookOpen
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: string;
  href?: string;
}

export default function OnBoardingPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao VCM',
      description: 'Conheça o Virtual Company Manager e suas funcionalidades principais',
      icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
      completed: true,
      action: 'Começar Tour',
      href: '/manual'
    },
    {
      id: 'company',
      title: 'Criar Primeira Empresa',
      description: 'Configure sua primeira empresa virtual com dados básicos',
      icon: <Building className="h-8 w-8 text-green-600" />,
      completed: false,
      action: 'Incluir Empresa',
      href: '/create-strategic-company'
    },
    {
      id: 'personas',
      title: 'Gerar Personas',
      description: 'Crie personas realistas para sua empresa usando IA',
      icon: <Users className="h-8 w-8 text-purple-600" />,
      completed: false,
      action: 'Gerar Personas',
      href: '/personas'
    },
    {
      id: 'database',
      title: 'Configurar Banco RAG',
      description: 'Configure a base de conhecimento para suas personas',
      icon: <Database className="h-8 w-8 text-orange-600" />,
      completed: false,
      action: 'Configurar RAG',
      href: '/tools'
    },
    {
      id: 'workflows',
      title: 'Setup Workflows N8N',
      description: 'Configure automações e fluxos de trabalho',
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      completed: false,
      action: 'Ver Workflows',
      href: '/integrations'
    },
    {
      id: 'deploy',
      title: 'Deploy & Sincronização',
      description: 'Faça o deploy da sua empresa virtual',
      icon: <Play className="h-8 w-8 text-red-600" />,
      completed: false,
      action: 'Fazer Deploy',
      href: '/provisionamento'
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const progress = (completedSteps / onboardingSteps.length) * 100;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">OnBoarding Guiado</h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Processo Guiado
          </Badge>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          Configure sua primeira empresa virtual seguindo este processo guiado passo-a-passo.
        </p>

        {/* Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Progresso Geral</h3>
              <span className="text-sm text-gray-500">{completedSteps}/{onboardingSteps.length} completos</span>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-gray-600">{Math.round(progress)}% concluído</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/manual'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-sm">Documentação</h3>
                <p className="text-xs text-gray-600">Manual completo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/status'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-sm">Status do Sistema</h3>
                <p className="text-xs text-gray-600">Verificar saúde</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/config'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-sm">Configurações</h3>
                <p className="text-xs text-gray-600">APIs e setup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onboardingSteps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`relative transition-all duration-200 ${
              step.completed 
                ? 'border-green-200 bg-green-50' 
                : index === currentStep 
                  ? 'border-blue-200 bg-blue-50 shadow-lg' 
                  : 'hover:shadow-md'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {step.icon}
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">Passo {index + 1}</span>
                      {step.completed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {step.description}
              </CardDescription>
              
              {step.action && (
                <Button 
                  className="w-full"
                  variant={step.completed ? "outline" : "default"}
                  onClick={() => {
                    if (step.href && typeof window !== 'undefined') {
                      window.location.href = step.href;
                    }
                  }}
                >
                  {step.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">💡 Dicas de OnBoarding</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Comece devagar:</strong> Siga os passos na ordem para melhor resultado</li>
            <li>• <strong>Teste constantemente:</strong> Verifique cada etapa antes de prosseguir</li>
            <li>• <strong>Use dados reais:</strong> Para melhores resultados, use dados da sua empresa real</li>
            <li>• <strong>Documente tudo:</strong> Anote configurações importantes durante o processo</li>
            <li>• <strong>Backup regular:</strong> Faça backup dos dados antes de mudanças maiores</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}