'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Camera, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Settings, 
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Persona {
  id: string;
  full_name: string;
  cargo: string;
  departamento: string;
  empresa_id: string;
}

interface Empresa {
  id: string;
  nome: string;
  industria: string;
}

interface Avatar {
  id: string;
  persona_id: string;
  avatar_url: string;
  avatar_thumbnail_url: string;
  prompt_usado: string;
  estilo: string;
  background_tipo: string;
  servico_usado: string;
  created_at: string;
}

interface ImageGenerationRequest {
  tipo: 'individual' | 'grupo' | 'cenario';
  personas_ids: string[];
  situacao: string;
  background: string;
  estilo: string;
  descricao_personalizada?: string;
}

const AvatarAdvancedSystem = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [personasSelecionadas, setPersonasSelecionadas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  // Estados para configuração de geração
  const [tipoGeracao, setTipoGeracao] = useState<'individual' | 'grupo' | 'cenario'>('individual');
  const [situacao, setSituacao] = useState('');
  const [background, setBackground] = useState('office');
  const [estilo, setEstilo] = useState('professional');
  const [descricaoPersonalizada, setDescricaoPersonalizada] = useState('');

  // Opções pré-definidas
  const situacoes = [
    { value: 'meeting', label: 'Reunião de Trabalho' },
    { value: 'presentation', label: 'Apresentação' },
    { value: 'team_photo', label: 'Foto da Equipe' },
    { value: 'networking', label: 'Evento de Networking' },
    { value: 'training', label: 'Treinamento' },
    { value: 'casual_office', label: 'Ambiente Casual' },
    { value: 'executive_meeting', label: 'Reunião Executiva' },
    { value: 'brainstorming', label: 'Sessão de Brainstorming' },
    { value: 'video_call', label: 'Videochamada' },
    { value: 'company_event', label: 'Evento da Empresa' }
  ];

  const backgrounds = [
    { value: 'office', label: 'Escritório Moderno' },
    { value: 'meeting_room', label: 'Sala de Reunião' },
    { value: 'coworking', label: 'Espaço Coworking' },
    { value: 'conference_room', label: 'Sala de Conferência' },
    { value: 'outdoor_office', label: 'Escritório ao Ar Livre' },
    { value: 'tech_office', label: 'Escritório Tech' },
    { value: 'executive_office', label: 'Escritório Executivo' },
    { value: 'creative_space', label: 'Espaço Criativo' },
    { value: 'cafe_office', label: 'Café/Escritório Casual' },
    { value: 'neutral_studio', label: 'Estúdio Neutro' }
  ];

  const estilos = [
    { value: 'professional', label: 'Profissional Formal' },
    { value: 'business_casual', label: 'Business Casual' },
    { value: 'creative', label: 'Criativo' },
    { value: 'executive', label: 'Executivo' },
    { value: 'tech_casual', label: 'Tech Casual' },
    { value: 'startup_style', label: 'Estilo Startup' },
    { value: 'corporate', label: 'Corporativo' },
    { value: 'modern_business', label: 'Business Moderno' }
  ];

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      loadPersonas();
      loadAvatares();
    }
  }, [empresaSelecionada]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, industria')
        .eq('status', 'ativa')
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadPersonas = async () => {
    if (!empresaSelecionada) return;

    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id, full_name, cargo, departamento, empresa_id')
        .eq('empresa_id', empresaSelecionada)
        .order('full_name');

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Erro ao carregar personas:', error);
    }
  };

  const loadAvatares = async () => {
    if (!empresaSelecionada) return;

    try {
      const { data, error } = await supabase
        .from('personas_avatares')
        .select(`
          id, persona_id, avatar_url, avatar_thumbnail_url, 
          prompt_usado, estilo, background_tipo, servico_usado, created_at
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvatares(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
    }
  };

  const handlePersonaSelection = (personaId: string, checked: boolean) => {
    setPersonasSelecionadas(prev => {
      if (checked) {
        return [...prev, personaId];
      } else {
        return prev.filter(id => id !== personaId);
      }
    });
  };

  const generateAdvancedAvatar = async () => {
    if (!empresaSelecionada || personasSelecionadas.length === 0) {
      alert('Selecione ao menos uma persona');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Preparando geração de imagem...');

    try {
      const request: ImageGenerationRequest = {
        tipo: tipoGeracao,
        personas_ids: personasSelecionadas,
        situacao,
        background,
        estilo,
        descricao_personalizada: descricaoPersonalizada
      };

      setGenerationStatus('Enviando para Google Nano Banana...');

      // Chamar API personalizada para geração avançada
      const response = await fetch('/api/avatares/generate-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaSelecionada,
          ...request
        })
      });

      if (!response.ok) {
        throw new Error('Erro na geração da imagem');
      }

      const result = await response.json();
      
      setGenerationStatus('Imagem gerada com sucesso!');
      
      // Recarregar avatares
      await loadAvatares();
      
      // Limpar seleções
      setPersonasSelecionadas([]);
      setDescricaoPersonalizada('');

    } catch (error) {
      console.error('Erro ao gerar avatar avançado:', error);
      setGenerationStatus('Erro na geração da imagem');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationStatus(''), 3000);
    }
  };

  const generateBasicAvatars = async () => {
    if (!empresaSelecionada) {
      alert('Selecione uma empresa');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Gerando avatares básicos...');

    try {
      const response = await fetch('/api/scripts/avatares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresaId: empresaSelecionada
        })
      });

      if (!response.ok) {
        throw new Error('Erro na geração dos avatares');
      }

      const result = await response.json();
      setGenerationStatus('Avatares básicos gerados!');
      
      // Recarregar dados
      await loadAvatares();

    } catch (error) {
      console.error('Erro ao gerar avatares básicos:', error);
      setGenerationStatus('Erro na geração dos avatares');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationStatus(''), 3000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Camera className="h-8 w-8 text-purple-600" />
            Sistema Avançado de Avatares
          </h1>
          <p className="text-gray-600 mt-2">
            Gere imagens profissionais individuais, em grupo e em cenários específicos usando Google Nano Banana
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map(empresa => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {empresa.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status */}
      {generationStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : generationStatus.includes('sucesso') ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium">{generationStatus}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="advanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advanced">Geração Avançada</TabsTrigger>
          <TabsTrigger value="basic">Avatares Básicos</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
        </TabsList>

        {/* Geração Avançada */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Geração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de Geração */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Geração</label>
                  <Select value={tipoGeracao} onValueChange={(value: any) => setTipoGeracao(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="grupo">Grupo</SelectItem>
                      <SelectItem value="cenario">Cenário Específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Situação */}
                <div>
                  <label className="block text-sm font-medium mb-2">Situação</label>
                  <Select value={situacao} onValueChange={setSituacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar situação" />
                    </SelectTrigger>
                    <SelectContent>
                      {situacoes.map(sit => (
                        <SelectItem key={sit.value} value={sit.value}>
                          {sit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Background */}
                <div>
                  <label className="block text-sm font-medium mb-2">Background</label>
                  <Select value={background} onValueChange={setBackground}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backgrounds.map(bg => (
                        <SelectItem key={bg.value} value={bg.value}>
                          {bg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estilo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Estilo</label>
                  <Select value={estilo} onValueChange={setEstilo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estilos.map(est => (
                        <SelectItem key={est.value} value={est.value}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição Personalizada */}
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição Personalizada (Opcional)</label>
                  <Textarea 
                    value={descricaoPersonalizada}
                    onChange={(e) => setDescricaoPersonalizada(e.target.value)}
                    placeholder="Descreva detalhes específicos da imagem desejada..."
                    rows={3}
                  />
                </div>

                {/* Botão de Geração */}
                <Button 
                  onClick={generateAdvancedAvatar}
                  disabled={isGenerating || !empresaSelecionada || personasSelecionadas.length === 0}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Gerar Imagem Avançada
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Seleção de Personas */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Personas</CardTitle>
                <div className="text-sm text-gray-600">
                  {personasSelecionadas.length} de {personas.length} selecionadas
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {personas.map(persona => (
                    <div key={persona.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={personasSelecionadas.includes(persona.id)}
                        onChange={(e) => handlePersonaSelection(persona.id, e.target.checked)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{persona.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {persona.cargo} - {persona.departamento}
                        </div>
                      </div>
                      {avatares.some(avatar => avatar.persona_id === persona.id) && (
                        <Badge variant="secondary">Com Avatar</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Avatares Básicos */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geração de Avatares Básicos</CardTitle>
              <p className="text-gray-600">
                Gera avatares individuais para todas as personas da empresa usando Google Nano Banana
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="font-medium text-yellow-800">
                  🍌 Geração com Google Nano Banana
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  • Imagens profissionais com background de escritório padrão<br/>
                  • Baseado no perfil e cargo de cada persona<br/>
                  • Processo automático para toda a empresa
                </div>
              </div>

              <Button 
                onClick={generateBasicAvatars}
                disabled={isGenerating || !empresaSelecionada}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Gerando Avatares...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Gerar Avatares Básicos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Galeria */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Galeria de Avatares</CardTitle>
              <Button variant="outline" onClick={loadAvatares}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {avatares.map(avatar => {
                  const persona = personas.find(p => p.id === avatar.persona_id);
                  return (
                    <div key={avatar.id} className="text-center">
                      <div className="relative group">
                        <img
                          src={avatar.avatar_thumbnail_url || avatar.avatar_url}
                          alt={persona?.full_name || 'Avatar'}
                          className="w-full aspect-square object-cover rounded-lg border shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button variant="secondary" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium truncate">{persona?.full_name}</div>
                        <div className="text-gray-600 text-xs">{avatar.estilo}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {avatar.servico_usado}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {avatares.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-600">
                    Nenhum avatar encontrado. Gere alguns avatares primeiro.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvatarAdvancedSystem;
