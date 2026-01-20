import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  PersonaCompleta, 
  PersonaBiografia, 
  PersonaTechSpecs, 
  AvatarPersona,
  UpdateBiografiaDto,
  UpdateTechSpecsDto,
  CreateAvatarDto 
} from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus, Save, RefreshCw, Image, User, Brain, Database, Workflow, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PersonaExpandedEditProps {
  personaId: string;
  onClose: () => void;
}

export function PersonaExpandedEdit({ personaId, onClose }: PersonaExpandedEditProps) {
  const [activeTab, setActiveTab] = useState('biografia');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar dados completos da persona
  const { data: persona, isLoading } = useQuery({
    queryKey: ['persona-completa', personaId],
    queryFn: async (): Promise<PersonaCompleta> => {
      const { data: personaData, error: personaError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (personaError) throw personaError;

      // Buscar biografia
      const { data: biografiaData } = await supabase
        .from('personas_biografias')
        .select('*')
        .eq('persona_id', personaId)
        .single();

      // Buscar tech specs
      const { data: techSpecsData } = await supabase
        .from('personas_tech_specs')
        .select('*')
        .eq('persona_id', personaId)
        .single();

      // Buscar avatares
      const { data: avataresData } = await supabase
        .from('avatares_personas')
        .select('*')
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false });

      return {
        ...personaData,
        biografia: biografiaData || undefined,
        tech_specs: techSpecsData || undefined,
        avatares: avataresData || []
      };
    }
  });

  // Mutations
  const updateBiografiaMutation = useMutation({
    mutationFn: async (data: UpdateBiografiaDto) => {
      const { error } = await supabase
        .from('personas_biografias')
        .upsert({
          persona_id: personaId,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona-completa', personaId] });
      toast({ title: 'Biografia atualizada com sucesso!' });
    }
  });

  const updateTechSpecsMutation = useMutation({
    mutationFn: async (data: UpdateTechSpecsDto) => {
      const { error } = await supabase
        .from('personas_tech_specs')
        .upsert({
          persona_id: personaId,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona-completa', personaId] });
      toast({ title: 'Especificações técnicas atualizadas!' });
    }
  });

  const createAvatarMutation = useMutation({
    mutationFn: async (data: CreateAvatarDto) => {
      // Aqui vai a integração com Nano Banana
      // Por enquanto vamos simular
      const fakeAvatarUrl = `https://api.dicebear.com/7.x/professional/svg?seed=${persona?.nome}&backgroundColor=b6e3f4`;
      
      const { error } = await supabase
        .from('avatares_personas')
        .insert({
          ...data,
          avatar_url: fakeAvatarUrl,
          versao: (persona?.avatares?.length || 0) + 1,
          metadados: {
            resolucao: '512x512',
            formato: 'svg',
            seed_usado: persona?.nome
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona-completa', personaId] });
      toast({ title: 'Avatar criado com sucesso!' });
      setIsGeneratingAvatar(false);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
        Persona não encontrada
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={persona.avatares?.[0]?.avatar_url} />
            <AvatarFallback>{persona.nome.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{persona.nome}</h1>
            <p className="text-muted-foreground">{persona.cargo} - {persona.departamento}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={persona.is_ceo ? 'default' : 'secondary'}>
                {persona.is_ceo ? 'CEO' : persona.tipo}
              </Badge>
              <Badge variant="outline">{persona.nivel_hierarquico}</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="biografia" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Biografia
          </TabsTrigger>
          <TabsTrigger value="tech-specs" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Tech Specs
          </TabsTrigger>
          <TabsTrigger value="avatares" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Avatares
          </TabsTrigger>
          <TabsTrigger value="rag" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            RAG/Dados
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Biografia Tab */}
        <TabsContent value="biografia" className="space-y-6">
          <BiografiaTab 
            persona={persona} 
            onUpdate={(data) => updateBiografiaMutation.mutate(data)}
            isLoading={updateBiografiaMutation.isPending}
          />
        </TabsContent>

        {/* Tech Specs Tab */}
        <TabsContent value="tech-specs" className="space-y-6">
          <TechSpecsTab 
            persona={persona} 
            onUpdate={(data) => updateTechSpecsMutation.mutate(data)}
            isLoading={updateTechSpecsMutation.isPending}
          />
        </TabsContent>

        {/* Avatares Tab */}
        <TabsContent value="avatares" className="space-y-6">
          <AvataresTab 
            persona={persona}
            onCreateAvatar={(data) => {
              setIsGeneratingAvatar(true);
              createAvatarMutation.mutate(data);
            }}
            isGenerating={isGeneratingAvatar}
          />
        </TabsContent>

        {/* RAG Tab */}
        <TabsContent value="rag" className="space-y-6">
          <RAGTab persona={persona} />
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <WorkflowsTab persona={persona} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab persona={persona} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// SUB-COMPONENTES DAS ABAS
// =====================================================

interface TabProps {
  persona: PersonaCompleta;
}

function BiografiaTab({ persona, onUpdate, isLoading }: TabProps & { 
  onUpdate: (data: UpdateBiografiaDto) => void; 
  isLoading: boolean; 
}) {
  const [biografia, setBiografia] = useState(persona.biografia?.biografia_completa || '');
  const [historia, setHistoria] = useState(persona.biografia?.historia_profissional || '');
  const [objetivos, setObjetivos] = useState(
    persona.biografia?.objetivos_pessoais?.join('\n') || ''
  );

  const handleSave = () => {
    onUpdate({
      biografia_completa: biografia,
      historia_profissional: historia,
      objetivos_pessoais: objetivos.split('\n').filter(Boolean)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Biografia Completa</CardTitle>
          <CardDescription>
            Biografia detalhada da persona incluindo personalidade, background e características
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="biografia">Biografia</Label>
            <Textarea
              id="biografia"
              placeholder="Descreva a biografia completa da persona..."
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              rows={6}
            />
          </div>
          
          <div>
            <Label htmlFor="historia">História Profissional</Label>
            <Textarea
              id="historia"
              placeholder="Trajetória profissional, experiências anteriores..."
              value={historia}
              onChange={(e) => setHistoria(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="objetivos">Objetivos Pessoais (um por linha)</Label>
            <Textarea
              id="objetivos"
              placeholder="Objetivo 1&#10;Objetivo 2&#10;Objetivo 3"
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Biografia
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TechSpecsTab({ persona, onUpdate, isLoading }: TabProps & { 
  onUpdate: (data: UpdateTechSpecsDto) => void; 
  isLoading: boolean; 
}) {
  const specs = persona.tech_specs;
  const [aiModel, setAiModel] = useState(specs?.ai_model || 'gpt-4-turbo-preview');
  const [maxTokens, setMaxTokens] = useState(specs?.max_tokens || 2000);
  const [temperature, setTemperature] = useState(specs?.temperature || 0.7);
  const [responseFormat, setResponseFormat] = useState(specs?.response_format || 'structured');
  const [priorityLevel, setPriorityLevel] = useState(specs?.priority_level || 'medium');

  const handleSave = () => {
    onUpdate({
      ai_model: aiModel,
      max_tokens: maxTokens,
      temperature: temperature,
      response_format: responseFormat as any,
      priority_level: priorityLevel as any,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de IA</CardTitle>
          <CardDescription>
            Especificações técnicas para o comportamento da IA desta persona
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ai-model">Modelo de IA</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max-tokens">Max Tokens: {maxTokens}</Label>
              <Slider
                value={[maxTokens]}
                onValueChange={(value) => setMaxTokens(value[0])}
                max={8000}
                min={100}
                step={100}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="temperature">Criatividade (Temperature): {temperature}</Label>
              <Slider
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
                max={2}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="response-format">Formato de Resposta</Label>
              <Select value={responseFormat} onValueChange={(value) => setResponseFormat(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structured">Estruturado</SelectItem>
                  <SelectItem value="creative">Criativo</SelectItem>
                  <SelectItem value="analytical">Analítico</SelectItem>
                  <SelectItem value="conversational">Conversacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Especificações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AvataresTab({ persona, onCreateAvatar, isGenerating }: TabProps & { 
  onCreateAvatar: (data: CreateAvatarDto) => void; 
  isGenerating: boolean; 
}) {
  const [prompt, setPrompt] = useState('');
  const [estilo, setEstilo] = useState<CreateAvatarDto['estilo']>('corporate');
  const [background, setBackground] = useState<CreateAvatarDto['background_tipo']>('office');

  const handleCreateAvatar = () => {
    const finalPrompt = prompt || `Professional portrait of ${persona.nome}, ${persona.cargo}, ${persona.genero}, ${persona.idade} years old, ${persona.nacionalidade}`;
    
    onCreateAvatar({
      persona_id: persona.id,
      prompt_usado: finalPrompt,
      estilo,
      background_tipo: background,
      servico_usado: 'nano_banana'
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatares Existentes */}
      {persona.avatares && persona.avatares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avatares Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {persona.avatares.map((avatar) => (
                <div key={avatar.id} className="space-y-2">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={avatar.avatar_url} />
                    <AvatarFallback>{persona.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Badge variant={avatar.ativo ? 'default' : 'secondary'}>
                      v{avatar.versao} {avatar.ativo && '(Ativo)'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {avatar.estilo} | {avatar.background_tipo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criar Novo Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Criar/Recriar Avatar</CardTitle>
          <CardDescription>
            Gere um novo avatar usando IA (Nano Banana)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt">Prompt Personalizado (opcional)</Label>
            <Textarea
              id="prompt"
              placeholder="Descrição específica para o avatar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Estilo</Label>
              <Select value={estilo} onValueChange={(value: any) => setEstilo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate">Corporativo</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="creative">Criativo</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Background</Label>
              <Select value={background} onValueChange={(value: any) => setBackground(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Escritório</SelectItem>
                  <SelectItem value="home_office">Home Office</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCreateAvatar} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Gerando Avatar...' : 'Criar Novo Avatar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RAGTab({ persona }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Conhecimento (RAG)</CardTitle>
        <CardDescription>
          Dados e conhecimentos específicos desta persona
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento - integração com base RAG
        </p>
      </CardContent>
    </Card>
  );
}

function WorkflowsTab({ persona }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflows N8N</CardTitle>
        <CardDescription>
          Workflows e automações desta persona
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento - integração com N8N
        </p>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab({ persona }: TabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics & Performance</CardTitle>
        <CardDescription>
          Métricas e performance desta persona
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento - analytics e métricas
        </p>
      </CardContent>
    </Card>
  );
}