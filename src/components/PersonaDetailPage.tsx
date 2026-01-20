'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Edit3, Save, X, Loader2, Play, RefreshCw, Plus,
  User, Mail, Phone, Globe, MapPin, Calendar, Briefcase,
  Brain, Code, Target, FileText, Zap, BarChart, Network,
  CheckCircle2, Clock, AlertCircle, Download, Share2, CheckCircle,
  BookOpen, Workflow, Database, Shield, MessageSquare, Trash2,
  GripVertical, TrendingUp, Flag
} from 'lucide-react';

interface PersonaDetailPageProps {
  persona: any;
  onBack: () => void;
}

export function PersonaDetailPage({ persona, onBack }: PersonaDetailPageProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [executingScript, setExecutingScript] = useState<string | null>(null);

  // Fetch dados completos da persona
  const { data: fullPersona, isLoading } = useQuery({
    queryKey: ['persona-full', persona.id],
    queryFn: async () => {
      const response = await fetch(`/api/personas/${persona.id}/full`);
      if (!response.ok) throw new Error('Failed to fetch persona');
      const data = await response.json();
      console.log('🔍 Dados da persona carregados:', {
        nome: data.full_name,
        email: data.email,
        empresa_id: data.empresa_id
      });
      return data;
    },
    staleTime: 0, // Sempre buscar dados frescos
  });

  // Fetch scripts status
  const { data: scriptsStatus } = useQuery({
    queryKey: ['scripts-status', persona.id],
    queryFn: async () => {
      const response = await fetch(`/api/personas/${persona.id}/scripts-status`);
      if (!response.ok) throw new Error('Failed to fetch scripts');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const executeScript = async (scriptNumber: string, scriptName: string) => {
    console.log('🚀 executeScript chamado:', { scriptNumber, scriptName, personaId: persona.id });
    
    const confirmed = confirm(`Executar Script ${scriptNumber} - ${scriptName}?\n\nIsso pode levar alguns minutos.`);
    if (!confirmed) return;

    setExecutingScript(scriptNumber);
    const toastId = toast.loading(`Executando ${scriptName}...`);

    try {
      const payload = {
        empresaId: persona.empresa_id,
        personaId: persona.id,
        scriptNumber,
        force_mode: true,
      };
      
      console.log('📤 Enviando request:', payload);
      
      const response = await fetch('/api/automation/execute-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      console.log('📥 Resposta recebida:', result);

      if (result.success) {
        toast.success(`${scriptName} executado com sucesso!`, { id: toastId });
        // Invalidar TODOS os caches relacionados à persona
        queryClient.invalidateQueries({ queryKey: ['persona-full', persona.id] });
        queryClient.invalidateQueries({ queryKey: ['scripts-status', persona.id] });
        queryClient.invalidateQueries({ queryKey: ['personas'] }); // Invalida lista também
        // Forçar refetch imediato
        queryClient.refetchQueries({ queryKey: ['persona-full', persona.id] });
      } else {
        toast.error(`Erro: ${result.message}`, { id: toastId });
      }
    } catch (error: any) {
      console.error('❌ Erro ao executar script:', error);
      toast.error(`Erro ao executar: ${error.message}`, { id: toastId });
    } finally {
      setExecutingScript(null);
    }
  };

  const saveField = async (field: string, value: any) => {
    const toastId = toast.loading('Salvando...');
    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Salvo com sucesso!', { id: toastId });
      setEditingSection(null);
      queryClient.invalidateQueries({ queryKey: ['persona-full', persona.id] });
    } catch (error) {
      toast.error('Erro ao salvar', { id: toastId });
    }
  };

  if (isLoading || !fullPersona) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatar = fullPersona.personas_avatares?.[0];
  const biografia = fullPersona.personas_biografias?.[0];
  const atribuicoes = fullPersona.personas_atribuicoes || [];
  const competencias = fullPersona.personas_competencias?.[0];
  const tasks = fullPersona.personas_tasks || [];
  const workflows = fullPersona.personas_workflows || [];
  const mlModels = fullPersona.personas_machine_learning || [];
  const auditoria = fullPersona.personas_auditorias?.[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header com foto e dados principais */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 border-b">
        <div className="flex items-start gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mt-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={avatar?.url_imagem || avatar?.avatar_url} />
            <AvatarFallback className="text-2xl">
              {fullPersona.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {fullPersona.full_name || 'Sem nome'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                  {fullPersona.role} • {fullPersona.department}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {fullPersona.email}
                  </span>
                  {fullPersona.nacionalidade && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {fullPersona.nacionalidade}
                    </span>
                  )}
                  {fullPersona.experiencia_anos && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {fullPersona.experiencia_anos} anos exp.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Quality Score */}
            {auditoria && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-600">
                    {auditoria.quality_score}/100
                  </div>
                  <span className="text-sm text-gray-600">Quality Score</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex gap-2">
                  {auditoria.phase_scores && Object.entries(auditoria.phase_scores).slice(0, 4).map(([phase, score]: any) => (
                    <Badge
                      key={phase}
                      variant={score.score >= 80 ? 'default' : score.score >= 60 ? 'secondary' : 'destructive'}
                    >
                      {phase}: {score.score}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-white dark:bg-gray-950">
          <ScrollArea className="w-full">
            <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="overview" className="gap-2">
                <User className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="biografia" className="gap-2">
                <FileText className="h-4 w-4" />
                Biografia
              </TabsTrigger>
              <TabsTrigger value="atribuicoes" className="gap-2">
                <Target className="h-4 w-4" />
                Atribuições
              </TabsTrigger>
              <TabsTrigger value="competencias" className="gap-2">
                <Brain className="h-4 w-4" />
                Competências
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="ml" className="gap-2">
                <Database className="h-4 w-4" />
                ML & RAG
              </TabsTrigger>
              <TabsTrigger value="scripts" className="gap-2">
                <Zap className="h-4 w-4" />
                Scripts
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* TAB: Visão Geral */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <PersonaOverview 
                persona={fullPersona}
                onSave={saveField}
                editing={editingSection}
                setEditing={setEditingSection}
              />
            </TabsContent>

            {/* TAB: Biografia */}
            <TabsContent value="biografia" className="mt-0">
              <BiografiaSection
                biografia={biografia}
                personaId={persona.id}
                onExecuteScript={() => executeScript('02', 'Gerar Biografia')}
                executing={executingScript === '02'}
              />
            </TabsContent>

            {/* TAB: Atribuições */}
            <TabsContent value="atribuicoes" className="mt-0">
              <AtribuicoesSection
                atribuicoes={atribuicoes}
                personaId={persona.id}
                onExecuteScript={() => executeScript('03', 'Gerar Atribuições')}
                executing={executingScript === '03'}
              />
            </TabsContent>

            {/* TAB: Competências */}
            <TabsContent value="competencias" className="mt-0">
              <CompetenciasSection
                competencias={competencias}
                personaId={persona.id}
                onExecuteScript={() => executeScript('04', 'Gerar Competências')}
                executing={executingScript === '04'}
              />
            </TabsContent>

            {/* TAB: Tarefas */}
            <TabsContent value="tasks" className="mt-0">
              <TasksSection
                tasks={tasks}
                personaId={persona.id}
                onExecuteScript={() => executeScript('06', 'Análise de Automação')}
                executing={executingScript === '06'}
                queryClient={queryClient}
              />
            </TabsContent>

            {/* TAB: Workflows */}
            <TabsContent value="workflows" className="mt-0">
              <WorkflowsSection
                workflows={workflows}
                personaId={persona.id}
                onExecuteScript={() => executeScript('07', 'Gerar Workflows')}
                executing={executingScript === '07'}
              />
            </TabsContent>

            {/* TAB: ML & RAG */}
            <TabsContent value="ml" className="mt-0">
              <MLRagSection
                mlModels={mlModels}
                personaId={persona.id}
                onExecuteScripts={{
                  ml: () => executeScript('08', 'Gerar ML Models'),
                  rag: () => executeScript('06.5', 'RAG Recommendations'),
                  knowledge: () => executeScript('10', 'Knowledge Base'),
                }}
                executing={executingScript}
              />
            </TabsContent>

            {/* TAB: Scripts */}
            <TabsContent value="scripts" className="mt-0">
              <ScriptsSection
                scriptsStatus={scriptsStatus}
                onExecuteScript={executeScript}
                executing={executingScript}
                personaId={persona.id}
                empresaId={persona.empresa_id}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ==================== COMPONENTES DAS SEÇÕES ====================

function PersonaOverview({ persona, onSave, editing, setEditing }: any) {
  const [formData, setFormData] = useState({
    full_name: persona.full_name || '',
    email: persona.email || '',
    whatsapp: persona.whatsapp || '',
    role: persona.role || '',
    department: persona.department || '',
    specialty: persona.specialty || '',
    experiencia_anos: persona.experiencia_anos || 0,
    genero: persona.genero || '',
    nacionalidade: persona.nacionalidade || '',
  });

  return (
    <div className="space-y-6">
      {/* Card: Dados Básicos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dados Básicos</CardTitle>
            <CardDescription>Informações principais da persona</CardDescription>
          </div>
          {editing !== 'basic' ? (
            <Button size="sm" variant="outline" onClick={() => setEditing('basic')}>
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                onSave('basic_data', formData);
              }}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nome Completo</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.full_name || '-'}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            {editing === 'basic' ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.email || '-'}</p>
            )}
          </div>
          <div>
            <Label>WhatsApp</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.whatsapp || '-'}</p>
            )}
          </div>
          <div>
            <Label>Cargo</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.role || '-'}</p>
            )}
          </div>
          <div>
            <Label>Departamento</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.department || '-'}</p>
            )}
          </div>
          <div>
            <Label>Especialidade</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.specialty || '-'}</p>
            )}
          </div>
          <div>
            <Label>Anos de Experiência</Label>
            {editing === 'basic' ? (
              <Input
                type="number"
                value={formData.experiencia_anos}
                onChange={(e) => setFormData({...formData, experiencia_anos: parseInt(e.target.value)})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.experiencia_anos || '-'}</p>
            )}
          </div>
          <div>
            <Label>Gênero</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.genero}
                onChange={(e) => setFormData({...formData, genero: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.genero || '-'}</p>
            )}
          </div>
          <div>
            <Label>Nacionalidade</Label>
            {editing === 'basic' ? (
              <Input
                value={formData.nacionalidade}
                onChange={(e) => setFormData({...formData, nacionalidade: e.target.value})}
              />
            ) : (
              <p className="text-sm mt-1">{persona.nacionalidade || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card: Configurações IA */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de IA</CardTitle>
          <CardDescription>Parâmetros para interação com LLM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={persona.system_prompt || ''}
              onChange={() => {}} 
              readOnly
              rows={4}
              className="mt-1 bg-gray-50"
              placeholder="Prompt do sistema para esta persona..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Temperatura</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={persona.temperatura_ia || 0.7}
                onChange={() => {}}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={persona.max_tokens || 2000}
                onChange={() => {}}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BiografiaSection({ biografia, personaId, onExecuteScript, executing }: any) {
  if (!biografia?.biografia_estruturada) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Biografia ainda não gerada</p>
          <Button onClick={onExecuteScript} disabled={executing}>
            {executing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Gerar Biografia</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const bio = biografia.biografia_estruturada;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Biografia Completa</h2>
        <Button onClick={onExecuteScript} disabled={executing} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerar
        </Button>
      </div>

      {bio.biografia_completa && (
        <Card>
          <CardHeader>
            <CardTitle>História Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{bio.biografia_completa}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {bio.hard_skills && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Hard Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bio.hard_skills.tecnologicas && (
                <div className="space-y-2">
                  {Object.entries(bio.hard_skills.tecnologicas).map(([skill, level]: any) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm">{skill}</span>
                      <Badge variant="secondary">{level}/10</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {bio.soft_skills && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Soft Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(bio.soft_skills).map(([skill, level]: any) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{skill.replace('_', ' ')}</span>
                    <Badge variant="secondary">{level}/10</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {bio.educacao && (
        <Card>
          <CardHeader>
            <CardTitle>Educação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bio.educacao.formacao_superior && (
              <div>
                <Label>Formação Superior</Label>
                <ul className="list-disc list-inside text-sm mt-1">
                  {bio.educacao.formacao_superior.map((edu: string, i: number) => (
                    <li key={i}>{edu}</li>
                  ))}
                </ul>
              </div>
            )}
            {bio.educacao.pos_graduacao && (
              <div>
                <Label>Pós-Graduação</Label>
                <ul className="list-disc list-inside text-sm mt-1">
                  {bio.educacao.pos_graduacao.map((edu: string, i: number) => (
                    <li key={i}>{edu}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AtribuicoesSection({ atribuicoes, personaId, onExecuteScript, executing }: any) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);

  if (!atribuicoes || atribuicoes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Atribuições ainda não geradas</p>
          <Button onClick={onExecuteScript} disabled={executing}>
            {executing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Gerar Atribuições</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/personas/atribuicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          atribuicao: newText.trim(),
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar atribuição');
      
      toast.success('Atribuição adicionada!');
      setNewText('');
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ['persona-full', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/personas/atribuicoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atribuicao: editText.trim(),
        }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar atribuição');
      
      toast.success('Atribuição atualizada!');
      setEditingId(null);
      setEditText('');
      queryClient.invalidateQueries({ queryKey: ['persona-full', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar esta atribuição?')) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/personas/atribuicoes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar atribuição');
      
      toast.success('Atribuição deletada!');
      queryClient.invalidateQueries({ queryKey: ['persona-full', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Atribuições e Responsabilidades</h2>
        <div className="flex gap-2">
          <Button onClick={() => setAdding(true)} disabled={adding || saving} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button onClick={onExecuteScript} disabled={executing || saving} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ol className="space-y-3">
            {atribuicoes.map((attr: any, index: number) => (
              <li key={attr.id} className="flex gap-3 items-start group">
                <Badge variant="outline" className="h-6 shrink-0 mt-0.5">{index + 1}</Badge>
                
                {editingId === attr.id ? (
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px]"
                      disabled={saving}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => handleEdit(attr.id)} disabled={saving}>
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {setEditingId(null); setEditText('');}} disabled={saving}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm flex-1">{attr.atribuicao}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditingId(attr.id);
                          setEditText(attr.atribuicao);
                        }}
                        disabled={saving || adding}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(attr.id)}
                        disabled={saving || adding}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}

            {adding && (
              <li className="flex gap-3 items-start border-t pt-3">
                <Badge variant="outline" className="h-6 shrink-0 mt-0.5">{atribuicoes.length + 1}</Badge>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Digite a nova atribuição..."
                    className="min-h-[60px]"
                    disabled={saving}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={handleAdd} disabled={saving || !newText.trim()}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {setAdding(false); setNewText('');}} disabled={saving}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </li>
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function CompetenciasSection({ competencias, personaId, onExecuteScript, executing }: any) {
  if (!competencias) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Competências ainda não geradas</p>
          <Button onClick={onExecuteScript} disabled={executing}>
            {executing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Gerar Competências</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competências e Metas</h2>
        <Button onClick={onExecuteScript} disabled={executing} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {competencias.competencias_tecnicas && (
          <Card>
            <CardHeader>
              <CardTitle>Competências Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {competencias.competencias_tecnicas.map((comp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {comp}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {competencias.tarefas_diarias && (
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Diárias</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {competencias.tarefas_diarias.map((task: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {competencias.kpis && (
          <Card>
            <CardHeader>
              <CardTitle>KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {competencias.kpis.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <BarChart className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    {kpi}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {competencias.metas_curto_prazo && (
          <Card>
            <CardHeader>
              <CardTitle>Metas de Curto Prazo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {competencias.metas_curto_prazo.map((meta: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Target className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    {meta}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção de Metas Objetivas (SMART) */}
      <MetasSection personaId={personaId} />
    </div>
  );
}

function MetasSection({ personaId }: { personaId: string }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'performance',
    valor_alvo: '',
    valor_atual: '0',
    unidade_medida: '%',
    data_inicio: new Date().toISOString().split('T')[0],
    data_prazo: '',
    prioridade: 2,
  });

  // Buscar metas
  const { data: metas, isLoading } = useQuery({
    queryKey: ['personas-metas', personaId],
    queryFn: async () => {
      const response = await fetch(`/api/personas/${personaId}/metas`);
      if (!response.ok) throw new Error('Erro ao buscar metas');
      return response.json();
    },
  });

  const handleAdd = async () => {
    if (!formData.titulo.trim() || !formData.valor_alvo || !formData.data_prazo) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/personas/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          ...formData,
          valor_alvo: parseFloat(formData.valor_alvo),
          valor_atual: parseFloat(formData.valor_atual),
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar meta');
      
      toast.success('Meta criada!');
      setFormData({
        titulo: '',
        descricao: '',
        categoria: 'performance',
        valor_alvo: '',
        valor_atual: '0',
        unidade_medida: '%',
        data_inicio: new Date().toISOString().split('T')[0],
        data_prazo: '',
        prioridade: 2,
      });
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ['personas-metas', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (metaId: string, valorAtual: number) => {
    try {
      const response = await fetch(`/api/personas/metas/${metaId}/progresso`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_atual: valorAtual }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar progresso');
      
      toast.success('Progresso atualizado!');
      queryClient.invalidateQueries({ queryKey: ['personas-metas', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (metaId: string) => {
    if (!confirm('Deletar esta meta?')) return;
    try {
      const response = await fetch(`/api/personas/metas/${metaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar meta');
      
      toast.success('Meta deletada!');
      queryClient.invalidateQueries({ queryKey: ['personas-metas', personaId] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nao_iniciada: 'bg-gray-500',
      em_progresso: 'bg-blue-500',
      concluida: 'bg-green-500',
      pausada: 'bg-yellow-500',
      cancelada: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      nao_iniciada: 'Não Iniciada',
      em_progresso: 'Em Progresso',
      concluida: 'Concluída',
      pausada: 'Pausada',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getPrioridadeColor = (prioridade: number) => {
    if (prioridade === 1) return 'bg-red-100 text-red-800';
    if (prioridade === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPrioridadeLabel = (prioridade: number) => {
    if (prioridade === 1) return 'Alta';
    if (prioridade === 2) return 'Média';
    return 'Baixa';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Metas Objetivas (SMART)
          </CardTitle>
          <CardDescription>Metas específicas, mensuráveis, atingíveis, relevantes e temporais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Metas Objetivas (SMART)
            </CardTitle>
            <CardDescription>Metas específicas, mensuráveis, atingíveis, relevantes e temporais</CardDescription>
          </div>
          <Button onClick={() => setAdding(true)} disabled={adding || saving} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Aumentar taxa de conversão"
                    disabled={saving}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Descrição detalhada da meta..."
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    disabled={saving}
                  >
                    <option value="performance">Performance</option>
                    <option value="desenvolvimento">Desenvolvimento</option>
                    <option value="kpi">KPI</option>
                    <option value="projeto">Projeto</option>
                  </select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={formData.prioridade}
                    onChange={(e) => setFormData({...formData, prioridade: parseInt(e.target.value)})}
                    disabled={saving}
                  >
                    <option value={1}>Alta</option>
                    <option value={2}>Média</option>
                    <option value={3}>Baixa</option>
                  </select>
                </div>
                <div>
                  <Label>Valor Alvo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_alvo}
                    onChange={(e) => setFormData({...formData, valor_alvo: e.target.value})}
                    placeholder="100"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label>Unidade de Medida</Label>
                  <Input
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})}
                    placeholder="%, unidades, horas..."
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label>Data Prazo *</Label>
                  <Input
                    type="date"
                    value={formData.data_prazo}
                    onChange={(e) => setFormData({...formData, data_prazo: e.target.value})}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAdd} disabled={saving} size="sm">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Meta
                </Button>
                <Button variant="outline" onClick={() => setAdding(false)} disabled={saving} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!metas || metas.length === 0) && !adding && (
          <div className="text-center py-8 text-gray-500">
            <Flag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma meta definida ainda</p>
            <p className="text-sm">Clique em "Nova Meta" para começar</p>
          </div>
        )}

        {metas && metas.length > 0 && (
          <div className="space-y-3">
            {metas.map((meta: any) => (
              <Card key={meta.id} className="border-l-4" style={{borderLeftColor: getStatusColor(meta.status).replace('bg-', '#')}}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{meta.titulo}</h3>
                        <Badge className={getPrioridadeColor(meta.prioridade)}>
                          {getPrioridadeLabel(meta.prioridade)}
                        </Badge>
                        <Badge variant="outline">{meta.categoria}</Badge>
                      </div>
                      {meta.descricao && <p className="text-sm text-gray-600 mb-2">{meta.descricao}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(meta.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Alvo</p>
                      <p className="font-semibold">{meta.valor_alvo} {meta.unidade_medida}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Atual</p>
                      <p className="font-semibold">{meta.valor_atual} {meta.unidade_medida}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Prazo</p>
                      <p className="font-semibold">{new Date(meta.data_prazo).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className={getStatusColor(meta.status)}>
                        {getStatusLabel(meta.status)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span className="font-semibold">{meta.progresso_percentual}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${meta.progresso_percentual}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TasksSection({ tasks, personaId, onExecuteScript, executing, queryClient }: any) {
  const [showNewTaskForm, setShowNewTaskForm] = React.useState(false);
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimated_duration: 30,
    status: 'pending'
  });

  const handleAddTask = async () => {
    try {
      const response = await fetch('/api/personas/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          ...newTask
        })
      });

      if (response.ok) {
        toast.success('Tarefa adicionada com sucesso!');
        setShowNewTaskForm(false);
        setNewTask({ title: '', description: '', priority: 'MEDIUM', estimated_duration: 30, status: 'pending' });
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['persona-full', personaId] });
      } else {
        toast.error('Erro ao adicionar tarefa');
      }
    } catch (error) {
      toast.error('Erro ao salvar tarefa');
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Análise de tarefas ainda não realizada</p>
          <div className="flex gap-2">
            <Button onClick={onExecuteScript} disabled={executing}>
              {executing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Analisar Tarefas</>
              )}
            </Button>
            <Button onClick={() => setShowNewTaskForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tarefas e Automação</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewTaskForm(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
          <Button onClick={onExecuteScript} disabled={executing} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reanalisar
          </Button>
        </div>
      </div>

      {/* Formulário Nova Tarefa */}
      {showNewTaskForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nova Tarefa</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowNewTaskForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Ex: Revisar relatórios mensais"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Descreva a tarefa em detalhes..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prioridade</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask({ ...newTask, estimated_duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTaskForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTask} disabled={!newTask.title}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Tarefa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.map((task: any) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {task.title || task.descricao || 'Sem título'}
                  </CardTitle>
                  <CardDescription>
                    {task.description || task.tipo || ''} 
                    {task.task_type && ` • ${task.task_type}`}
                    {task.frequencia && ` • ${task.frequencia}`}
                  </CardDescription>
                </div>
                <Badge variant={
                  task.automacao_possivel || task.priority === 'HIGH' ? 'default' : 'secondary'
                }>
                  {task.status === 'completed' && '✓ Concluída'}
                  {task.status === 'in_progress' && '⏳ Em andamento'}
                  {task.status === 'pending' && '📋 Pendente'}
                  {!task.status && (task.automacao_possivel ? 'Automatizável' : 'Manual')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">
                    {task.complexity_score ? 'Complexidade' : 'Complexidade Técnica'}
                  </Label>
                  <p className="font-medium">
                    {task.complexity_score || task.complexidade_tecnica || 'N/A'}/10
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Duração</Label>
                  <p className="font-medium">
                    {task.estimated_duration || task.tempo_execucao_min || 'N/A'} min
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Prioridade</Label>
                  <p className="font-medium capitalize">
                    {task.priority?.toLowerCase() || task.prioridade_automacao || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorkflowsSection({ workflows, personaId, onExecuteScript, executing }: any) {
  if (!workflows || workflows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Workflow className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Workflows ainda não gerados</p>
          <Button onClick={onExecuteScript} disabled={executing}>
            {executing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Gerar Workflows</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflows N8N</h2>
        <Button onClick={onExecuteScript} disabled={executing} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerar
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow: any) => (
          <Card key={workflow.id}>
            <CardHeader>
              <CardTitle>{workflow.workflow_name || workflow.nome}</CardTitle>
              <CardDescription>{workflow.workflow_description || workflow.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant={workflow.status === 'draft' ? 'secondary' : 'default'}>
                  {workflow.category || workflow.categoria || 'N8N'}
                </Badge>
                <Badge variant="outline">{workflow.workflow_type || 'manual'}</Badge>
                <span className="text-sm text-gray-500">
                  {workflow.workflow_json || workflow.n8n_workflow_json ? (
                    <>
                      <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                      JSON disponível
                    </>
                  ) : 'Sem JSON'}
                </span>
                {workflow.priority && (
                  <Badge variant="outline">
                    Prioridade {workflow.priority}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MLRagSection({ mlModels, personaId, onExecuteScripts, executing }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Machine Learning & RAG</h2>

      <div className="grid gap-6">
        {/* ML Models */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>ML Models</CardTitle>
              <CardDescription>Modelos de Machine Learning para predições</CardDescription>
            </div>
            <Button onClick={onExecuteScripts.ml} disabled={executing === '08'} variant="outline">
              {executing === '08' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Gerar ML</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {mlModels && mlModels.length > 0 ? (
              <div className="space-y-2">
                {mlModels.map((model: any) => (
                  <div key={model.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{model.modelo_tipo}</span>
                    <Badge>{model.acuracia_esperada}% acurácia</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum modelo gerado ainda</p>
            )}
          </CardContent>
        </Card>

        {/* RAG Knowledge */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>RAG Recommendations</CardTitle>
              <CardDescription>Recomendações de conhecimento para capacitação</CardDescription>
            </div>
            <Button onClick={onExecuteScripts.rag} disabled={executing === '06.5'} variant="outline">
              {executing === '06.5' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Gerar RAG</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Configure recomendações de conhecimento baseadas em IA</p>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Base de conhecimento vetorial com embeddings</CardDescription>
            </div>
            <Button onClick={onExecuteScripts.knowledge} disabled={executing === '10'} variant="outline">
              {executing === '10' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Processar Docs</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Processe documentos para busca semântica</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScriptsSection({ scriptsStatus, onExecuteScript, executing, personaId, empresaId }: any) {
  const scripts = [
    { number: '01', name: 'Criar Placeholders', icon: User, description: 'Estrutura básica da persona' },
    { number: '02', name: 'Gerar Biografia', icon: FileText, description: 'História profissional completa' },
    { number: '03', name: 'Gerar Atribuições', icon: Target, description: 'Responsabilidades e atribuições' },
    { number: '04', name: 'Gerar Competências', icon: Brain, description: 'Skills e KPIs' },
    { number: '05', name: 'Gerar Avatares', icon: User, description: 'Avatar visual da persona' },
    { number: '06', name: 'Análise de Automação', icon: Zap, description: 'Identificar tarefas automatizáveis' },
    { number: '06.5', name: 'RAG Recommendations', icon: BookOpen, description: 'Recomendações de conhecimento' },
    { number: '07', name: 'Gerar Workflows', icon: Workflow, description: 'Workflows N8N' },
    { number: '08', name: 'ML Models', icon: Database, description: 'Modelos de Machine Learning' },
    { number: '09', name: 'Auditoria', icon: Shield, description: 'Auditoria de qualidade completa' },
    { number: '10', name: 'Knowledge Base', icon: Database, description: 'Processar documentos para RAG' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Executar Scripts</h2>
      <p className="text-sm text-gray-500">
        Execute scripts individuais para esta persona. Os scripts serão executados apenas para {personaId}.
      </p>

      <div className="grid gap-4">
        {scripts.map((script) => {
          const Icon = script.icon;
          const status = scriptsStatus?.[`script_${script.number.replace('.', '_')}`];
          const isExecuting = executing === script.number;

          return (
            <Card key={script.number}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Script {script.number}: {script.name}
                    </h3>
                    <p className="text-sm text-gray-500">{script.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {status && (
                    <div className="flex items-center gap-2">
                      {status.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : status.status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        {status.last_run && new Date(status.last_run).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => onExecuteScript(script.number, script.name)}
                    disabled={isExecuting}
                    size="sm"
                  >
                    {isExecuting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executando...</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" /> Executar</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
