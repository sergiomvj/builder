'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { 
  TaskTemplate, 
  TaskParameter, 
  ALL_TEMPLATES, 
  TEMPLATES_BY_AREA,
  getTemplateByCode 
} from '@/lib/task-templates';

type WizardStep = 'select-area' | 'select-template' | 'fill-parameters' | 'review' | 'confirmation';

interface TaskCreationWizardProps {
  onComplete?: (taskData: {
    template_code: string;
    template_name: string;
    parameters: Record<string, any>;
    assigned_to?: string;
    priority?: string;
  }) => void;
  onTaskCreated?: (task: any) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function TaskCreationWizard({ onComplete, onTaskCreated, onCancel, isSubmitting: externalSubmitting }: TaskCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-area');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const areas = Object.keys(TEMPLATES_BY_AREA);
  const progress = {
    'select-area': 20,
    'select-template': 40,
    'fill-parameters': 60,
    'review': 80,
    'confirmation': 100
  }[currentStep];

  // Validação de parâmetros
  const validateParameters = (): boolean => {
    if (!selectedTemplate) return false;

    const newErrors: Record<string, string> = {};

    selectedTemplate.parameters.forEach(param => {
      const value = parameters[param.name];

      if (param.required && !value) {
        newErrors[param.name] = 'Campo obrigatório';
      }

      if (param.type === 'number' && value) {
        const numValue = Number(value);
        if (param.min && numValue < param.min) {
          newErrors[param.name] = `Valor mínimo: ${param.min}`;
        }
        if (param.max && numValue > param.max) {
          newErrors[param.name] = `Valor máximo: ${param.max}`;
        }
      }

      if (param.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[param.name] = 'Email inválido';
      }

      if (param.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
        newErrors[param.name] = 'URL inválida (deve começar com http:// ou https://)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão da tarefa
  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);

    try {
      // Integrar com API de criação de tarefas
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_code: selectedTemplate.code,
          parameters,
          assigned_to: 'auto',
          priority: selectedTemplate.priority || 'normal',
          user_id: 'current-user', // TODO: Pegar do contexto de autenticação
          user_email: 'user@example.com' // TODO: Pegar do contexto de autenticação
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar tarefa');
      }

      console.log('Task created:', data);

      setCurrentStep('confirmation');

      // Chamar callback onComplete se fornecido (usado pela página)
      if (onComplete) {
        onComplete({
          template_code: selectedTemplate.code,
          template_name: selectedTemplate.name,
          parameters,
          priority: selectedTemplate.priority || 'normal'
        });
      }

      // Chamar callback onTaskCreated (legacy)
      if (onTaskCreated) {
        onTaskCreated(data);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderiza campo de parâmetro
  const renderParameterField = (param: TaskParameter) => {
    const value = parameters[param.name] || param.defaultValue || '';
    const error = errors[param.name];

    const updateValue = (newValue: any) => {
      setParameters(prev => ({ ...prev, [param.name]: newValue }));
      if (error) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[param.name];
          return newErrors;
        });
      }
    };

    return (
      <div key={param.name} className="space-y-2">
        <Label htmlFor={param.name}>
          {param.label}
          {param.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {param.type === 'text' && (
          <Input
            id={param.name}
            placeholder={param.placeholder}
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {param.type === 'textarea' && (
          <Textarea
            id={param.name}
            placeholder={param.placeholder}
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        )}

        {param.type === 'number' && (
          <Input
            id={param.name}
            type="number"
            min={param.min}
            max={param.max}
            placeholder={param.placeholder}
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {param.type === 'date' && (
          <Input
            id={param.name}
            type="date"
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {param.type === 'email' && (
          <Input
            id={param.name}
            type="email"
            placeholder={param.placeholder}
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {param.type === 'url' && (
          <Input
            id={param.name}
            type="url"
            placeholder={param.placeholder || 'https://example.com'}
            value={value}
            onChange={e => updateValue(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {param.type === 'select' && param.options && (
          <Select value={value} onValueChange={updateValue}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {param.options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {param.type === 'multiselect' && param.options && (
          <div className="space-y-2">
            {param.options.map(option => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={e => {
                    const current = value || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter((v: string) => v !== option);
                    updateValue(updated);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Nova Tarefa</CardTitle>
        <CardDescription>
          {currentStep === 'select-area' && 'Selecione a área funcional'}
          {currentStep === 'select-template' && 'Escolha um template de tarefa'}
          {currentStep === 'fill-parameters' && 'Preencha os parâmetros da tarefa'}
          {currentStep === 'review' && 'Revise os dados antes de criar'}
          {currentStep === 'confirmation' && 'Tarefa criada com sucesso!'}
        </CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1: Selecionar Área */}
        {currentStep === 'select-area' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {areas.map(area => (
              <Button
                key={area}
                variant={selectedArea === area ? 'default' : 'outline'}
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => {
                  setSelectedArea(area);
                  setCurrentStep('select-template');
                }}
              >
                <span className="font-semibold">{area}</span>
                <span className="text-xs opacity-70">
                  {TEMPLATES_BY_AREA[area].length} templates
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* STEP 2: Selecionar Template */}
        {currentStep === 'select-template' && selectedArea && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentStep('select-area');
                setSelectedTemplate(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para áreas
            </Button>

            <div className="grid gap-4">
              {TEMPLATES_BY_AREA[selectedArea].map(template => (
                <Card
                  key={template.code}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTemplate?.code === template.code ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setParameters({});
                    setErrors({});
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Badge variant={template.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {template.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {template.estimated_duration_hours}h
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {template.expected_metrics.length} métricas
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Auto: {template.automation_potential}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Preencher Parâmetros */}
        {currentStep === 'fill-parameters' && selectedTemplate && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>{selectedTemplate.name}</strong> — {selectedTemplate.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {selectedTemplate.parameters.map(param => renderParameterField(param))}
            </div>

            {selectedTemplate.supervision_required && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Esta tarefa requer aprovação de supervisor antes da execução.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* STEP 4: Revisar */}
        {currentStep === 'review' && selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Tarefa</h3>
              <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Parâmetros</h3>
              <div className="space-y-2">
                {selectedTemplate.parameters.map(param => (
                  <div key={param.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{param.label}:</span>
                    <span className="font-medium">
                      {Array.isArray(parameters[param.name])
                        ? parameters[param.name].join(', ')
                        : parameters[param.name] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Métricas Esperadas</h3>
              <div className="space-y-2">
                {selectedTemplate.expected_metrics.map(metric => (
                  <div key={metric.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.description}</span>
                    <Badge variant="outline">
                      {metric.target} {metric.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmação */}
        {currentStep === 'confirmation' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold">Tarefa Criada!</h3>
            <p className="text-muted-foreground">
              Sua tarefa foi criada e será processada pelo sistema.
              {selectedTemplate?.supervision_required && (
                <><br />Aguardando aprovação do supervisor.</>
              )}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {currentStep !== 'confirmation' && (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>

            <div className="flex gap-2">
              {currentStep === 'fill-parameters' && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('select-template')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}

              {currentStep === 'review' && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('fill-parameters')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}

              {currentStep === 'select-template' && selectedTemplate && (
                <Button onClick={() => setCurrentStep('fill-parameters')}>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 'fill-parameters' && (
                <Button
                  onClick={() => {
                    if (validateParameters()) {
                      setCurrentStep('review');
                    }
                  }}
                >
                  Revisar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 'review' && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        )}

        {currentStep === 'confirmation' && (
          <Button onClick={onCancel} className="w-full">
            Criar Outra Tarefa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
