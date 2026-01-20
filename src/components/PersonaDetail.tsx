'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PersonaAvatars } from '@/components/PersonaAvatars';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  User, Building, Star, Brain, Code, Languages, 
  FileText, ArrowLeft, Edit3, Download, Share2, Zap,
  CheckCircle2, Clock, AlertCircle, Play, Target, BarChart, Save, X, Loader2
} from 'lucide-react';

interface ScriptStatus {
  script: string;
  order: number;
  name: string;
  description: string;
  status: 'completed' | 'pending' | 'error';
  timestamp?: string;
  dataCount?: number;
}

interface PersonaDetailProps {
  persona: any;
  onBack: () => void;
}

export function PersonaDetail({ persona, onBack }: PersonaDetailProps) {
  const avatar = persona.personas_avatares?.[0];
  const queryClient = useQueryClient();
  
  // Estados de edição
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [tempEmail, setTempEmail] = useState(persona.email || '');
  const [tempWhatsapp, setTempWhatsapp] = useState(persona.whatsapp || '');
  const [tempPrompt, setTempPrompt] = useState(persona.system_prompt || '');
  const [tempTemperatura, setTempTemperatura] = useState(persona.temperatura_ia || 0.7);
  const [tempMaxTokens, setTempMaxTokens] = useState(persona.max_tokens || 2000);
  
  // Estados de loading
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [executingScript, setExecutingScript] = useState<string | null>(null);
  
  // Fetch scripts status
  const { data: scriptsData, isLoading: scriptsLoading, refetch: refetchScripts } = useQuery({
    queryKey: ['scripts-status', persona.id],
    queryFn: async () => {
      const response = await fetch(`/api/personas/${persona.id}/scripts-status`);
      if (!response.ok) throw new Error('Failed to fetch scripts status');
      return response.json();
    },
    refetchInterval: 10000, // Refetch a cada 10 segundos
  });

  // Função para executar script
  const executeScript = async (scriptNumber: string) => {
    const confirmed = confirm(`Tem certeza que deseja re-executar o Script ${scriptNumber}? Isso pode sobrescrever dados existentes.`);
    if (!confirmed) return;

    setExecutingScript(scriptNumber);
    const toastId = toast.loading(`Executando Script ${scriptNumber}...`);

    try {
      const response = await fetch('/api/automation/execute-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: persona.id,
          scriptNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Script ${scriptNumber} executado com sucesso!`, { id: toastId });
        // Refetch persona data
        queryClient.invalidateQueries({ queryKey: ['persona', persona.id] });
        queryClient.invalidateQueries({ queryKey: ['scripts-status', persona.id] });
        refetchScripts();
      } else {
        toast.error(`Erro ao executar Script ${scriptNumber}: ${result.message}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Erro ao executar Script ${scriptNumber}: ${error.message}`, { id: toastId });
    } finally {
      setExecutingScript(null);
    }
  };

  // Função para salvar dados de contato
  const saveContactData = async () => {
    setSavingEmail(true);
    const toastId = toast.loading('Salvando dados de contato...');

    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'personas',
          data: {
            email: tempEmail,
            whatsapp: tempWhatsapp,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Dados de contato salvos!', { id: toastId });
        setEditingEmail(false);
        queryClient.invalidateQueries({ queryKey: ['persona', persona.id] });
      } else {
        toast.error(`Erro: ${result.error}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setSavingEmail(false);
    }
  };

  // Função para salvar configuração de IA
  const savePromptData = async () => {
    setSavingPrompt(true);
    const toastId = toast.loading('Salvando configuração de IA...');

    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'personas',
          data: {
            system_prompt: tempPrompt,
            temperatura_ia: parseFloat(String(tempTemperatura)),
            max_tokens: parseInt(String(tempMaxTokens)),
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Configuração de IA salva!', { id: toastId });
        setEditingPrompt(false);
        queryClient.invalidateQueries({ queryKey: ['persona', persona.id] });
      } else {
        toast.error(`Erro: ${result.error}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setSavingPrompt(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completo</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Erro</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Pendente</Badge>;
    }
  };
  
  const exportPersona = () => {
    const data = {
      informacoes_basicas: {
        nome: persona.full_name,
        cargo: persona.role,
        empresa: persona.empresas?.nome,
        departamento: persona.department,
        especialidade: persona.specialty,
        email: persona.email,
        whatsapp: persona.whatsapp
      },
      dados_profissionais: {
        experiencia_anos: persona.experiencia_anos,
        personalidade: persona.personalidade,
        idiomas: persona.idiomas
      },
      configuracao_ia: {
        temperatura: persona.temperatura_ia,
        max_tokens: persona.max_tokens,
        system_prompt: persona.system_prompt
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.full_name.replace(/\\s+/g, '-')}-detalhado.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = () => {
    // Navegar para formulário de edição de persona
    const params = new URLSearchParams({
      id: persona.id,
      nome: persona.full_name,
      cargo: persona.role,
      departamento: persona.department || '',
      especialidade: persona.specialty || '',
      email: persona.email || '',
      whatsapp: persona.whatsapp || '',
      status: persona.status || 'active'
    });
    
    // Abrir em modal ou redirecionar para página de edição
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/personas/edit?${params.toString()}`;
    }
  };

  const handleShare = () => {
    alert('Funcionalidade de compartilhamento em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header com navegação e botões de ação */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                {(avatar?.avatar_local_path || avatar?.avatar_url) ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatar.avatar_local_path || avatar.avatar_url} alt={persona.full_name} />
                    <AvatarFallback className="text-lg bg-blue-500 text-white">
                      {persona.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
                    {persona.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{persona.full_name}</h1>
                  <p className="text-lg text-gray-600">{persona.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{persona.empresas?.nome || 'N/A'}</span>
                    <Badge variant={persona.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                      {persona.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" onClick={exportPersona}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Resumo Rápido - Botões para Acesso aos Dados */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-blue-600" />
                Resumo Rápido - Acesso aos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant={persona.biografia_completa ? "default" : "outline"} 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => document.getElementById('biografia')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">Biografia</span>
                  <Badge variant={persona.biografia_completa ? "default" : "secondary"} className="text-xs">
                    {persona.biografia_completa ? "Disponível" : "Vazio"}
                  </Badge>
                </Button>

                <Button 
                  variant={persona.personalidade ? "default" : "outline"} 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => document.getElementById('personalidade')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Brain className="h-5 w-5" />
                  <span className="text-sm font-medium">Personalidade</span>
                  <Badge variant={persona.personalidade ? "default" : "secondary"} className="text-xs">
                    {persona.personalidade ? "Disponível" : "Vazio"}
                  </Badge>
                </Button>

                <Button 
                  variant={persona.system_prompt ? "default" : "outline"} 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => document.getElementById('ia-config')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Code className="h-5 w-5" />
                  <span className="text-sm font-medium">Config IA</span>
                  <Badge variant={persona.system_prompt ? "default" : "secondary"} className="text-xs">
                    {persona.system_prompt ? "Disponível" : "Vazio"}
                  </Badge>
                </Button>

                <Button 
                  variant={persona.idiomas?.length > 0 ? "default" : "outline"} 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => document.getElementById('profissionais')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Languages className="h-5 w-5" />
                  <span className="text-sm font-medium">Idiomas</span>
                  <Badge variant={persona.idiomas?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.idiomas?.length > 0 ? `${persona.idiomas.length} idiomas` : "Vazio"}
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Profissional Gerado por IA */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-purple-600" />
                Avatar Profissional Gerado por IA
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">Imagem customizada baseada em descrição física detalhada</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Imagem do Avatar */}
                <div className="flex-shrink-0">
                  {(avatar?.avatar_local_path || avatar?.avatar_url) ? (
                    <div className="relative">
                      <img 
                        src={avatar.avatar_local_path || avatar.avatar_url} 
                        alt={`Avatar de ${persona.full_name}`}
                        className="w-64 h-64 rounded-lg object-cover shadow-lg border-4 border-purple-200"
                        onError={(e) => {
                          // Fallback para placeholder se imagem não carregar
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.full_name)}&size=256&background=8b5cf6&color=fff`;
                        }}
                      />
                      <Badge className="absolute top-2 right-2 bg-purple-600">
                        ✨ Gerado por IA
                      </Badge>
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center border-2 border-dashed border-purple-300">
                      <User className="h-16 w-16 text-purple-400 mb-3" />
                      <p className="text-sm text-purple-600 font-medium">Imagem não gerada</p>
                      <p className="text-xs text-purple-500 mt-1 px-4 text-center">
                        Execute o script 01.3 para gerar
                      </p>
                    </div>
                  )}
                </div>

                {/* Informações do Avatar */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Detalhes da Geração
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <span className="text-purple-600 font-medium">Serviço:</span>
                        <p className="text-gray-800 mt-1">
                          {avatar?.servico_usado === 'fal_ai_flux_schnell' ? '🎨 fal.ai (FLUX Schnell)' : 
                           avatar?.servico_usado === 'gemini_ai' ? '🤖 Google Gemini' : 
                           'Não gerado'}
                        </p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg">
                        <span className="text-pink-600 font-medium">Estilo:</span>
                        <p className="text-gray-800 mt-1 capitalize">
                          {avatar?.estilo || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-blue-600 font-medium">Background:</span>
                        <p className="text-gray-800 mt-1 capitalize">
                          {avatar?.background_tipo || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <span className="text-indigo-600 font-medium">Versão:</span>
                        <p className="text-gray-800 mt-1">
                          {avatar?.versao || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {avatar?.metadados && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Metadados Técnicos
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(
                            typeof avatar.metadados === 'string' 
                              ? JSON.parse(avatar.metadados) 
                              : avatar.metadados,
                            null,
                            2
                          ).substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatares Multimedia (outras variações) */}
          <PersonaAvatars personaId={persona.id} />

          {/* 11 Elementos Completos da Persona */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-indigo-600" />
                11 Elementos Completos da Persona
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">Status detalhado de todos os dados gerados pelos 9 scripts + metadados</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Elemento 1: Placeholders (Script 01) */}
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <span className="font-medium text-blue-800 text-sm">01 - Placeholders</span>
                      <p className="text-xs text-blue-600">Estrutura inicial</p>
                    </div>
                  </div>
                  <Badge variant={persona.id && persona.role ? "default" : "secondary"} className="text-xs">
                    {persona.id && persona.role ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 2: Biografias (Script 02) */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div>
                      <span className="font-medium text-emerald-800 text-sm">02 - Biografias</span>
                      <p className="text-xs text-emerald-600">Nome, email, experiência</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_biografias?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_biografias?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 3: Atribuições (Script 03) */}
                <div className="flex items-center justify-between p-4 bg-sky-50 border border-sky-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                    <div>
                      <span className="font-medium text-sky-800 text-sm">03 - Atribuições</span>
                      <p className="text-xs text-sky-600">Responsabilidades</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_atribuicoes?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_atribuicoes?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 4: Competências (Script 04) */}
                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <div>
                      <span className="font-medium text-purple-800 text-sm">04 - Competências</span>
                      <p className="text-xs text-purple-600">Habilidades e KPIs</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_competencias?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_competencias?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 5a: Prompts de Avatares (Script 05a) */}
                <div className="flex items-center justify-between p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>
                    <div>
                      <span className="font-medium text-fuchsia-800 text-sm">05a - Prompts Físicos</span>
                      <p className="text-xs text-fuchsia-600">Descrição via LLM</p>
                    </div>
                  </div>
                  <Badge variant={persona.system_prompt ? "default" : "secondary"} className="text-xs">
                    {persona.system_prompt ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 5b: Imagens Fal.ai (Script 05b) */}
                <div className="flex items-center justify-between p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-fuchsia-600"></div>
                    <div>
                      <span className="font-medium text-fuchsia-800 text-sm">05b - Imagens Fal.ai</span>
                      <p className="text-xs text-fuchsia-600">Geração via Flux-Pro</p>
                    </div>
                  </div>
                  <Badge variant={(persona.personas_avatares?.[0]?.avatar_local_path || persona.personas_avatares?.[0]?.avatar_url) ? "default" : "secondary"} className="text-xs">
                    {(persona.personas_avatares?.[0]?.avatar_local_path || persona.personas_avatares?.[0]?.avatar_url) ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 5c: Download Local (Script 05c) */}
                <div className="flex items-center justify-between p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-fuchsia-700"></div>
                    <div>
                      <span className="font-medium text-fuchsia-800 text-sm">05c - Download Local</span>
                      <p className="text-xs text-fuchsia-600">Armazenamento + thumbnails</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_avatares?.[0]?.avatar_local_path ? "default" : "secondary"} className="text-xs">
                    {persona.personas_avatares?.[0]?.avatar_local_path ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 6: Automação (Script 06) */}
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div>
                      <span className="font-medium text-orange-800 text-sm">06 - Automação</span>
                      <p className="text-xs text-orange-600">Análise de tarefas</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_automation_opportunities?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_automation_opportunities?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 7: Workflows (Script 07) */}
                <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <div>
                      <span className="font-medium text-teal-800 text-sm">07 - Workflows</span>
                      <p className="text-xs text-teal-600">N8N workflows</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_workflows?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_workflows?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 8: Machine Learning (Script 08) */}
                <div className="flex items-center justify-between p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <div>
                      <span className="font-medium text-pink-800 text-sm">08 - ML Models</span>
                      <p className="text-xs text-pink-600">Modelos preditivos</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_machine_learning?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_machine_learning?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 9: Auditoria (Script 09) */}
                <div className="flex items-center justify-between p-4 bg-violet-50 border border-violet-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                    <div>
                      <span className="font-medium text-violet-800 text-sm">09 - Auditoria</span>
                      <p className="text-xs text-violet-600">Validação de qualidade</p>
                    </div>
                  </div>
                  <Badge variant={persona.personas_auditorias?.length > 0 ? "default" : "secondary"} className="text-xs">
                    {persona.personas_auditorias?.length > 0 ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 10: Email/Contato (Metadados) */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div>
                      <span className="font-medium text-amber-800 text-sm">Email</span>
                      <p className="text-xs text-amber-600">Contato profissional</p>
                    </div>
                  </div>
                  <Badge variant={persona.email && !persona.email.includes('@example.com') ? "default" : "secondary"} className="text-xs">
                    {persona.email && !persona.email.includes('@example.com') ? "✓" : "×"}
                  </Badge>
                </div>

                {/* Elemento 11: System Prompt (Metadados) */}
                <div className="flex items-center justify-between p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <div>
                      <span className="font-medium text-cyan-800 text-sm">Prompt</span>
                      <p className="text-xs text-cyan-600">Configuração IA</p>
                    </div>
                  </div>
                  <Badge variant={persona.system_prompt ? "default" : "secondary"} className="text-xs">
                    {persona.system_prompt ? "✓" : "×"}
                  </Badge>
                </div>
              </div>

              {/* Barra de Progresso Total */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Progresso Geral</span>
                  <span className="text-sm font-bold text-blue-600">
                    {[
                      Boolean(persona.id && persona.role),
                      Boolean(persona.personas_biografias?.length > 0),
                      Boolean(persona.personas_atribuicoes?.length > 0),
                      Boolean(persona.personas_competencias?.length > 0),
                      Boolean(persona.personas_avatares?.length > 0),
                      Boolean(persona.automation_opportunities?.length > 0),
                      Boolean(persona.personas_workflows?.length > 0),
                      Boolean(persona.personas_machine_learning?.length > 0),
                      Boolean(persona.personas_auditorias?.length > 0),
                      Boolean(persona.email && !persona.email.includes('@example.com')),
                      Boolean(persona.system_prompt)
                    ].filter(Boolean).length}/11
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${([
                        Boolean(persona.id && persona.role),
                        Boolean(persona.personas_biografias?.length > 0),
                        Boolean(persona.personas_atribuicoes?.length > 0),
                        Boolean(persona.personas_competencias?.length > 0),
                        Boolean(persona.personas_avatares?.length > 0),
                        Boolean(persona.personas_automation_opportunities?.length > 0),
                        Boolean(persona.personas_workflows?.length > 0),
                        Boolean(persona.personas_machine_learning?.length > 0),
                        Boolean(persona.personas_auditorias?.length > 0),
                        Boolean(persona.email && !persona.email.includes('@example.com')),
                        Boolean(persona.system_prompt)
                      ].filter(Boolean).length / 11) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {Math.round(([
                    Boolean(persona.id && persona.role),
                    Boolean(persona.personas_biografias?.length > 0),
                    Boolean(persona.personas_atribuicoes?.length > 0),
                    Boolean(persona.personas_competencias?.length > 0),
                    Boolean(persona.personas_avatares?.length > 0),
                    Boolean(persona.personas_automation_opportunities?.length > 0),
                    Boolean(persona.personas_workflows?.length > 0),
                    Boolean(persona.personas_machine_learning?.length > 0),
                    Boolean(persona.personas_auditorias?.length > 0),
                    Boolean(persona.email && !persona.email.includes('@example.com')),
                    Boolean(persona.system_prompt)
                  ].filter(Boolean).length / 11) * 100)}% completo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 1. AVATARES - Primeiro elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-fuchsia-500">
            <CardHeader className="bg-fuchsia-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                  Avatares Profissionais
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_avatares?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_avatares?.length > 0 ? `✓ ${persona.personas_avatares.length} imagens` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('05')}
                    disabled={executingScript === '05'}
                  >
                    {executingScript === '05' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 05
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Imagens geradas via fal.ai com descrições detalhadas</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_avatares && persona.personas_avatares.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {persona.personas_avatares.map((avatar: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white">
                      {(avatar.avatar_local_path || avatar.avatar_url) && (
                        <img 
                          src={avatar.avatar_local_path || avatar.avatar_url} 
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-64 object-cover rounded mb-3"
                        />
                      )}
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Descrição Física</label>
                          <p className="text-sm text-gray-700">{avatar.descricao_fisica || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Serviço Usado</label>
                          <Badge variant="outline" className="text-xs">{avatar.servico_usado || 'N/A'}</Badge>
                        </div>
                        {avatar.metadata_geracao && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Metadados</label>
                            <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                              {JSON.stringify(avatar.metadata_geracao, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum avatar gerado ainda</p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Execute os 3 scripts de avatares:</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05a - Prompts
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05b - Imagens
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05c - Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 2. BIOGRAFIA - Segundo elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="bg-emerald-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                  Biografia Profissional
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_biografias?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_biografias?.length > 0 ? "✓ Completo" : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('02')}
                    disabled={executingScript === '02'}
                  >
                    {executingScript === '02' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 02
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Nome completo, email, experiência e biografia gerados por LLM</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_biografias && persona.personas_biografias.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_biografias.map((bio: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border">{persona.full_name || bio.full_name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Email Profissional</label>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border font-mono">{persona.email || 'N/A'}</p>
                          {persona.email?.includes('@example.com') && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Email placeholder - rodar script novamente</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Anos de Experiência</label>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border">{persona.experiencia_anos || 'NULL'}</p>
                          {!persona.experiencia_anos && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Dados faltando</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Nacionalidade</label>
                          <p className="text-sm text-gray-900 bg-white p-2 rounded border">{bio.nacionalidade || persona.nacionalidade || 'N/A'}</p>
                        </div>
                      </div>
                      {bio.biografia_estruturada && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Biografia Completa</label>
                          <div className="text-sm text-gray-700 bg-white p-4 rounded border whitespace-pre-wrap">
                            {typeof bio.biografia_estruturada === 'string' 
                              ? bio.biografia_estruturada 
                              : JSON.stringify(bio.biografia_estruturada, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma biografia gerada ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 02 - Biografias
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 3. ATRIBUIÇÕES - Terceiro elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-sky-500">
            <CardHeader className="bg-sky-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                  Atribuições Contextualizadas
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_atribuicoes?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_atribuicoes?.length > 0 ? `✓ ${persona.personas_atribuicoes.length} itens` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('03')}
                    disabled={executingScript === '03'}
                  >
                    {executingScript === '03' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 03
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Responsabilidades específicas definidas por LLM</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_atribuicoes && persona.personas_atribuicoes.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_atribuicoes.map((atrib: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Atribuição #{idx + 1}</span>
                        <Badge variant="outline">Ordem: {atrib.ordem || idx + 1}</Badge>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {atrib.atribuicao || JSON.stringify(atrib, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma atribuição definida ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 03 - Atribuições
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 4. HABILIDADES - Quarto elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="bg-purple-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">4</div>
                  Competências e Habilidades
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_competencias?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_competencias?.length > 0 ? "✓ Completo" : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('04')}
                    disabled={executingScript === '04'}
                  >
                    {executingScript === '04' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 04
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Habilidades técnicas, comportamentais, KPIs e metas</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_competencias && persona.personas_competencias.length > 0 ? (
                <div className="space-y-6">
                  {persona.personas_competencias.map((comp: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      {comp.competencias_tecnicas && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Competências Técnicas
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Array.isArray(comp.competencias_tecnicas) ? comp.competencias_tecnicas.map((item: any, i: number) => (
                              <div key={i} className="p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                                {typeof item === 'string' ? item : JSON.stringify(item)}
                              </div>
                            )) : <div className="text-sm text-gray-600">{JSON.stringify(comp.competencias_tecnicas)}</div>}
                          </div>
                        </div>
                      )}
                      {comp.kpis_principais && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <BarChart className="h-4 w-4" />
                            KPIs Principais
                          </h4>
                          <div className="space-y-2">
                            {Array.isArray(comp.kpis_principais) ? comp.kpis_principais.map((kpi: any, i: number) => (
                              <div key={i} className="p-3 bg-white border rounded">
                                <p className="text-sm font-medium text-gray-900">{typeof kpi === 'string' ? kpi : kpi.nome || JSON.stringify(kpi)}</p>
                              </div>
                            )) : <p className="text-sm text-gray-600">{JSON.stringify(comp.kpis_principais)}</p>}
                          </div>
                        </div>
                      )}
                      {comp.metas && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Metas e Objetivos
                          </h4>
                          <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {typeof comp.metas === 'string' ? comp.metas : JSON.stringify(comp.metas, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma competência definida ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 04 - Competências
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 5. METAS - Quinto elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="bg-orange-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">5</div>
                  Metas e Objetivos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_competencias?.some((c: any) => c.metas) ? "default" : "secondary"}>
                    {persona.personas_competencias?.some((c: any) => c.metas) ? "✓ Definidas" : "× Pendente"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Objetivos específicos e metas de performance</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_competencias?.some((c: any) => c.metas) ? (
                <div className="space-y-4">
                  {persona.personas_competencias.filter((comp: any) => comp.metas).map((comp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Metas Definidas
                      </h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-orange-50 p-3 rounded">
                        {typeof comp.metas === 'string' ? comp.metas : JSON.stringify(comp.metas, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma meta definida ainda</p>
                  <p className="text-xs text-gray-500">Execute o Script 04 para gerar metas</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 6. TAREFAS - Sexto elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-teal-500">
            <CardHeader className="bg-teal-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold">6</div>
                  Análise de Tarefas
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.automation_opportunities?.length > 0 ? "default" : "secondary"}>
                    {persona.automation_opportunities?.length > 0 ? `✓ ${persona.automation_opportunities.length} oportunidades` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('06')}
                    disabled={executingScript === '06'}
                  >
                    {executingScript === '06' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 06
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Tarefas que podem ser automatizadas identificadas por LLM</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.automation_opportunities && persona.automation_opportunities.length > 0 ? (
                <div className="space-y-4">
                  {persona.automation_opportunities.map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{opp.task_name || `Oportunidade ${idx + 1}`}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Automação Sugerida:</label>
                          <p className="text-gray-600">{opp.automation_suggestion || JSON.stringify(opp)}</p>
                        </div>
                        {opp.impact && (
                          <div>
                            <label className="font-medium text-gray-700">Impacto:</label>
                            <Badge variant="outline">{opp.impact}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma análise de automação ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 06 - Automação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 7. RAG - Sétimo elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-pink-500">
            <CardHeader className="bg-pink-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold">7</div>
                  Base de Conhecimento (RAG)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.rag_knowledge?.length > 0 ? "default" : "secondary"}>
                    {persona.rag_knowledge?.length > 0 ? `✓ ${persona.rag_knowledge.length} documentos` : "× Pendente"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Conhecimento estruturado para respostas contextuais</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.rag_knowledge && persona.rag_knowledge.length > 0 ? (
                <div className="space-y-4">
                  {persona.rag_knowledge.map((rag: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-200 bg-white rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {rag.conteudo || JSON.stringify(rag)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma base de conhecimento ainda</p>
                  <p className="text-xs text-gray-500">Será gerada pelos próximos scripts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 8. FLUXOS - Oitavo elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="bg-indigo-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">8</div>
                  Workflows N8N
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_workflows?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_workflows?.length > 0 ? `✓ ${persona.personas_workflows.length} workflows` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('07')}
                    disabled={executingScript === '07'}
                  >
                    {executingScript === '07' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 07
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Workflows de automação completos prontos para N8N</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_workflows && persona.personas_workflows.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_workflows.map((workflow: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{workflow.workflow_nome || `Workflow ${idx + 1}`}</h4>
                        <Badge variant="outline">{workflow.categoria || 'N/A'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{workflow.descricao || 'Sem descrição'}</p>
                      {workflow.workflow_json && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Ver JSON do Workflow</summary>
                          <pre className="mt-2 bg-gray-50 p-3 rounded border overflow-x-auto">
                            {JSON.stringify(workflow.workflow_json, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum workflow gerado ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 07 - Workflows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 9. MACHINE LEARNING - Nono elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-cyan-500">
            <CardHeader className="bg-cyan-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold">9</div>
                  Machine Learning Models
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_machine_learning?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_machine_learning?.length > 0 ? `✓ ${persona.personas_machine_learning.length} modelos` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('08')}
                    disabled={executingScript === '08'}
                  >
                    {executingScript === '08' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 08
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Modelos preditivos para otimização de performance</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_machine_learning && persona.personas_machine_learning.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_machine_learning.map((model: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{model.model_type || 'Modelo'}</h4>
                        <Badge variant="outline">{model.last_trained_at ? new Date(model.last_trained_at).toLocaleDateString() : 'Novo'}</Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        {model.performance_metrics && (
                          <div>
                            <label className="font-medium text-gray-700">Métricas de Performance:</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {Object.entries(model.performance_metrics).map(([key, value]) => (
                                <div key={key} className="p-2 bg-cyan-50 rounded border border-cyan-200">
                                  <span className="text-xs text-gray-600">{key}:</span>
                                  <span className="text-sm font-semibold ml-1">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {model.predictions && (
                          <div>
                            <label className="font-medium text-gray-700">Predições:</label>
                            <pre className="text-xs bg-gray-50 p-2 rounded border mt-1">
                              {JSON.stringify(model.predictions, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum modelo ML gerado ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 08 - Machine Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* 10. AUDITORIA - Décimo elemento */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-violet-500">
            <CardHeader className="bg-violet-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">10</div>
                  Auditoria de Qualidade
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_auditorias?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_auditorias?.length > 0 ? `✓ ${persona.personas_auditorias.length} auditorias` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('09')}
                    disabled={executingScript === '09'}
                  >
                    {executingScript === '09' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 09
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Validação completa de qualidade e consistência dos dados</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_auditorias && persona.personas_auditorias.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_auditorias.map((audit: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Auditoria {idx + 1}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-violet-600">{audit.quality_score}/100</span>
                          <Badge variant={audit.quality_score >= 80 ? "default" : audit.quality_score >= 60 ? "secondary" : "destructive"}>
                            {audit.quality_score >= 80 ? "Excelente" : audit.quality_score >= 60 ? "Bom" : "Precisa Melhorias"}
                          </Badge>
                        </div>
                      </div>
                      {audit.warnings && audit.warnings.length > 0 && (
                        <div className="mb-3">
                          <label className="font-medium text-orange-700 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Avisos:
                          </label>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {audit.warnings.map((warning: string, i: number) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {audit.recommendations && audit.recommendations.length > 0 && (
                        <div>
                          <label className="font-medium text-blue-700">Recomendações:</label>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {audit.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma auditoria executada ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 09 - Auditoria
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 5: AVATARES */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-fuchsia-500">
            <CardHeader className="bg-fuchsia-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">05</div>
                  Avatares Profissionais
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_avatares?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_avatares?.length > 0 ? `✓ ${persona.personas_avatares.length} imagens` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('05')}
                    disabled={executingScript === '05'}
                  >
                    {executingScript === '05' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 05
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Imagens geradas via fal.ai com descrições detalhadas</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_avatares && persona.personas_avatares.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {persona.personas_avatares.map((avatar: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white">
                      {(avatar.avatar_local_path || avatar.avatar_url) && (
                        <img 
                          src={avatar.avatar_local_path || avatar.avatar_url} 
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-64 object-cover rounded mb-3"
                        />
                      )}
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Descrição Física</label>
                          <p className="text-sm text-gray-700">{avatar.descricao_fisica || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Serviço Usado</label>
                          <Badge variant="outline" className="text-xs">{avatar.servico_usado || 'N/A'}</Badge>
                        </div>
                        {avatar.metadata_geracao && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Metadados</label>
                            <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                              {JSON.stringify(avatar.metadata_geracao, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum avatar gerado ainda</p>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Execute os 3 scripts de avatares:</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05a - Prompts
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05b - Imagens
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        05c - Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 6: AUTOMAÇÃO */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="bg-orange-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">06</div>
                  Análise de Automação
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_automation_opportunities?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_automation_opportunities?.length > 0 ? `✓ ${persona.personas_automation_opportunities.length} oportunidades` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('06')}
                    disabled={executingScript === '06'}
                  >
                    {executingScript === '06' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 06
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Tarefas que podem ser automatizadas identificadas por LLM</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.automation_opportunities && persona.automation_opportunities.length > 0 ? (
                <div className="space-y-4">
                  {persona.automation_opportunities.map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">{opp.task_name || `Oportunidade ${idx + 1}`}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Automação Sugerida:</label>
                          <p className="text-gray-600">{opp.automation_suggestion || JSON.stringify(opp)}</p>
                        </div>
                        {opp.impact && (
                          <div>
                            <label className="font-medium text-gray-700">Impacto:</label>
                            <Badge variant="outline">{opp.impact}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma análise de automação ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 06 - Automação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 7: WORKFLOWS N8N */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-teal-500">
            <CardHeader className="bg-teal-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold">07</div>
                  Workflows N8N
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_workflows?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_workflows?.length > 0 ? `✓ ${persona.personas_workflows.length} workflows` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('07')}
                    disabled={executingScript === '07'}
                  >
                    {executingScript === '07' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 07
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Workflows de automação completos prontos para N8N</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_workflows && persona.personas_workflows.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_workflows.map((workflow: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{workflow.workflow_nome || `Workflow ${idx + 1}`}</h4>
                        <Badge variant="outline">{workflow.categoria || 'N/A'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{workflow.descricao || 'Sem descrição'}</p>
                      {workflow.workflow_json && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Ver JSON do Workflow</summary>
                          <pre className="mt-2 bg-gray-50 p-3 rounded border overflow-x-auto">
                            {JSON.stringify(workflow.workflow_json, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum workflow gerado ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 07 - Workflows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 8: MACHINE LEARNING */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-pink-500">
            <CardHeader className="bg-pink-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold">08</div>
                  Machine Learning Models
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_ml_models?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_ml_models?.length > 0 ? `✓ ${persona.personas_ml_models.length} modelos` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('08')}
                    disabled={executingScript === '08'}
                  >
                    {executingScript === '08' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 08
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Modelos preditivos para otimização de performance</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_ml_models && persona.personas_ml_models.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_ml_models.map((model: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{model.model_type || 'Modelo'}</h4>
                        <Badge variant="outline">{model.last_trained_at ? new Date(model.last_trained_at).toLocaleDateString() : 'Novo'}</Badge>
                      </div>
                      <div className="space-y-3 text-sm">
                        {model.performance_metrics && (
                          <div>
                            <label className="font-medium text-gray-700">Métricas de Performance:</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {Object.entries(model.performance_metrics).map(([key, value]) => (
                                <div key={key} className="p-2 bg-pink-50 rounded border border-pink-200">
                                  <span className="text-xs text-gray-600">{key}:</span>
                                  <span className="text-sm font-semibold ml-1">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {model.predictions && (
                          <div>
                            <label className="font-medium text-gray-700">Predições:</label>
                            <pre className="text-xs bg-gray-50 p-2 rounded border mt-1">
                              {JSON.stringify(model.predictions, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhum modelo ML gerado ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 08 - Machine Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 9: AUDITORIA */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-violet-500">
            <CardHeader className="bg-violet-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">09</div>
                  Auditoria de Qualidade
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.personas_audit_logs?.length > 0 ? "default" : "secondary"}>
                    {persona.personas_audit_logs?.length > 0 ? `✓ ${persona.personas_audit_logs.length} auditorias` : "× Pendente"}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeScript('09')}
                    disabled={executingScript === '09'}
                  >
                    {executingScript === '09' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Re-executar Script 09
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Validação completa de qualidade e consistência dos dados</p>
            </CardHeader>
            <CardContent className="p-6">
              {persona.personas_audit_logs && persona.personas_audit_logs.length > 0 ? (
                <div className="space-y-4">
                  {persona.personas_audit_logs.map((audit: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Auditoria {idx + 1}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-violet-600">{audit.quality_score}/100</span>
                          <Badge variant={audit.quality_score >= 80 ? "default" : audit.quality_score >= 60 ? "secondary" : "destructive"}>
                            {audit.quality_score >= 80 ? "Excelente" : audit.quality_score >= 60 ? "Bom" : "Precisa Melhorias"}
                          </Badge>
                        </div>
                      </div>
                      {audit.warnings && audit.warnings.length > 0 && (
                        <div className="mb-3">
                          <label className="font-medium text-orange-700 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Avisos:
                          </label>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {audit.warnings.map((warning: string, i: number) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {audit.recommendations && audit.recommendations.length > 0 && (
                        <div>
                          <label className="font-medium text-blue-700">Recomendações:</label>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {audit.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded border-2 border-dashed">
                  <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">Nenhuma auditoria executada ainda</p>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Script 09 - Auditoria
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 10: EMAIL/CONTATO */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="bg-amber-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">10</div>
                  Dados de Contato
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.email && !persona.email.includes('@example.com') ? "default" : "secondary"}>
                    {persona.email && !persona.email.includes('@example.com') ? "✓ Válido" : "× Inválido"}
                  </Badge>
                  {!editingEmail ? (
                    <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)}>
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={saveContactData}
                        disabled={savingEmail}
                      >
                        {savingEmail ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingEmail(false);
                          setTempEmail(persona.email || '');
                          setTempWhatsapp(persona.whatsapp || '');
                        }}
                        disabled={savingEmail}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Email profissional e outros contatos (Metadados)</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email Profissional</label>
                  {editingEmail ? (
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full text-sm text-gray-900 bg-white p-3 rounded border font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="email@empresa.com"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border font-mono">{persona.email || 'N/A'}</p>
                  )}
                  {persona.email?.includes('@example.com') && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Email placeholder - executar Script 02 novamente</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">WhatsApp</label>
                  {editingEmail ? (
                    <input
                      type="text"
                      value={tempWhatsapp}
                      onChange={(e) => setTempWhatsapp(e.target.value)}
                      className="w-full text-sm text-gray-900 bg-white p-3 rounded border focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="+55 (11) 99999-9999"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border">{persona.whatsapp || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* ELEMENTO 11: SYSTEM PROMPT */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-l-4 border-l-cyan-500">
            <CardHeader className="bg-cyan-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold">11</div>
                  Configuração de IA
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={persona.system_prompt ? "default" : "secondary"}>
                    {persona.system_prompt ? "✓ Configurado" : "× Pendente"}
                  </Badge>
                  {!editingPrompt ? (
                    <Button size="sm" variant="outline" onClick={() => setEditingPrompt(true)}>
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={savePromptData}
                        disabled={savingPrompt}
                      >
                        {savingPrompt ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditingPrompt(false);
                          setTempPrompt(persona.system_prompt || '');
                          setTempTemperatura(persona.temperatura_ia || 0.7);
                          setTempMaxTokens(persona.max_tokens || 2000);
                        }}
                        disabled={savingPrompt}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">System prompt e configurações da IA (Metadados)</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">System Prompt</label>
                  {editingPrompt ? (
                    <textarea
                      value={tempPrompt}
                      onChange={(e) => setTempPrompt(e.target.value)}
                      rows={8}
                      className="w-full text-sm text-gray-700 bg-white p-4 rounded border font-mono focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Você é um assistente especializado em..."
                    />
                  ) : persona.system_prompt ? (
                    <pre className="text-sm text-gray-700 bg-white p-4 rounded border whitespace-pre-wrap font-mono">
                      {persona.system_prompt}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded border">Nenhum system prompt configurado</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Temperatura IA</label>
                    {editingPrompt ? (
                      <input
                        type="number"
                        value={tempTemperatura}
                        onChange={(e) => setTempTemperatura(parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        max="2"
                        className="w-full text-sm text-gray-900 bg-white p-2 rounded border focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border">{persona.temperatura_ia || 0.7}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Max Tokens</label>
                    {editingPrompt ? (
                      <input
                        type="number"
                        value={tempMaxTokens}
                        onChange={(e) => setTempMaxTokens(parseInt(e.target.value))}
                        step="100"
                        min="100"
                        max="8000"
                        className="w-full text-sm text-gray-900 bg-white p-2 rounded border focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white p-2 rounded border">{persona.max_tokens || 2000}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {persona.personas_atribuicoes && persona.personas_atribuicoes.length > 0 && (
            <Card className="shadow-sm" id="atribuicoes">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-sky-600" />
                  Atribuições e Responsabilidades
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {persona.personas_atribuicoes.map((atrib: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    {atrib.atribuicoes && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Atribuições:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {Array.isArray(atrib.atribuicoes) ? atrib.atribuicoes.map((item: string, i: number) => (
                            <li key={i} className="text-gray-700">{item}</li>
                          )) : <li className="text-gray-700">{JSON.stringify(atrib.atribuicoes)}</li>}
                        </ul>
                      </div>
                    )}
                    {atrib.responsabilidades && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Responsabilidades:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {Array.isArray(atrib.responsabilidades) ? atrib.responsabilidades.map((item: string, i: number) => (
                            <li key={i} className="text-gray-700">{item}</li>
                          )) : <li className="text-gray-700">{JSON.stringify(atrib.responsabilidades)}</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Seção: Competências Técnicas */}
          {persona.competencias && persona.competencias.length > 0 && (
            <Card className="shadow-sm" id="competencias">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-blue-600" />
                  Competências Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.competencias.map((comp: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-200 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-1">{comp.nome}</h4>
                      <Badge variant="outline" className="text-xs">
                        Nível: {comp.nivel || 'N/A'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: RAG Knowledge Base */}
          {persona.rag_knowledge && persona.rag_knowledge.length > 0 && (
            <Card className="shadow-sm" id="rag">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-pink-600" />
                  Base de Conhecimento (RAG)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {persona.rag_knowledge.map((rag: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-200 bg-white rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {rag.conteudo || JSON.stringify(rag)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Workflows N8N */}
          {persona.workflows && persona.workflows.length > 0 && (
            <Card className="shadow-sm" id="workflows">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-violet-600" />
                  Workflows N8N
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {persona.workflows.map((wf: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 bg-white rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-800">{wf.nome}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {wf.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Avatar Detalhado */}
          {persona.personas_avatares && persona.personas_avatares.length > 0 && (
            <Card className="shadow-sm" id="avatar-detail">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-purple-600" />
                  Perfil Visual Detalhado (Avatar)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {persona.personas_avatares.map((avatar: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    {avatar.prompt_usado && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Prompt Usado:</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                          {avatar.prompt_usado}
                        </p>
                      </div>
                    )}
                    {avatar.biometrics && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Características Biométricas:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {typeof avatar.biometrics === 'string' 
                            ? Object.entries(JSON.parse(avatar.biometrics)).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-600">{key.replace(/_/g, ' ')}:</span>
                                  <span className="ml-2 text-gray-800">{String(value)}</span>
                                </div>
                              ))
                            : Object.entries(avatar.biometrics).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-600">{key.replace(/_/g, ' ')}:</span>
                                  <span className="ml-2 text-gray-800">{String(value)}</span>
                                </div>
                              ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Seção: Informações Profissionais */}
          <Card className="shadow-sm" id="profissionais">
            <CardHeader className="bg-gray-50/80">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Departamento</span>
                    <p className="text-gray-900">{persona.department}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Especialidade</span>
                    <p className="text-gray-900">{persona.specialty}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Experiência</span>
                    <p className="text-gray-900">{persona.experiencia_anos || 'N/A'} anos</p>
                  </div>
                  {persona.email && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <p className="text-gray-900 break-all">{persona.email}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {persona.whatsapp && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">WhatsApp</span>
                      <p className="text-gray-900">{persona.whatsapp}</p>
                    </div>
                  )}
                  {persona.idiomas && persona.idiomas.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Idiomas</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {persona.idiomas.map((idioma: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {idioma}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Biografia */}
          {persona.biografia_completa && (
            <Card className="shadow-sm" id="biografia">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  Biografia Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {persona.biografia_completa}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Status dos Scripts de Automação */}
          <Card className="shadow-sm" id="scripts-status">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Status dos Scripts de Automação
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchScripts()}
                  disabled={scriptsLoading}
                >
                  {scriptsLoading ? 'Carregando...' : 'Atualizar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {scriptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Carregando status...</span>
                </div>
              ) : scriptsData ? (
                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {scriptsData.summary.completed}
                      </div>
                      <div className="text-xs text-gray-600">Completos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-400">
                        {scriptsData.summary.pending}
                      </div>
                      <div className="text-xs text-gray-600">Pendentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {scriptsData.summary.error}
                      </div>
                      <div className="text-xs text-gray-600">Erros</div>
                    </div>
                  </div>

                  {/* Lista de Scripts */}
                  <div className="space-y-2">
                    {scriptsData.scripts.map((script: ScriptStatus) => (
                      <div
                        key={script.script}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-semibold text-sm">
                            {script.order}
                          </div>
                          {getStatusIcon(script.status)}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              Script {script.script}: {script.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {script.description}
                              {script.dataCount !== undefined && script.script !== '09' && (
                                <span className="ml-2 text-blue-600">
                                  ({script.dataCount} itens)
                                </span>
                              )}
                              {script.dataCount !== undefined && script.script === '09' && (
                                <span className="ml-2 text-blue-600">
                                  (Score: {script.dataCount}/100)
                                </span>
                              )}
                            </div>
                            {script.timestamp && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(script.timestamp).toLocaleString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(script.status)}
                          {script.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              title="Executar script manualmente"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notas */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 text-sm mb-2">
                      📝 Informações:
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Scripts executam em sequência: 01 → 02 → 03 → ... → 09</li>
                      <li>• Cada script depende dos dados gerados pelos anteriores</li>
                      <li>• Status atualiza automaticamente a cada 10 segundos</li>
                      <li>• Use o botão "Atualizar" para forçar verificação imediata</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Erro ao carregar status dos scripts
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Personalidade */}
          {persona.personalidade && (
            <Card className="shadow-sm" id="personalidade">
              <CardHeader className="bg-gray-50/80">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Perfil de Personalidade
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(persona.personalidade).map(([key, value]) => (
                    <div key={key} className="p-4 border border-gray-200 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {key.replace('_', ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h4>
                      <p className="text-gray-600">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção: Configuração de IA */}
          <Card className="shadow-sm" id="ia-config">
            <CardHeader className="bg-gray-50/80">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5 text-orange-600" />
                Configuração de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Temperatura</span>
                    <p className="text-gray-900">{persona.temperatura_ia || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Max Tokens</span>
                    <p className="text-gray-900">{persona.max_tokens || 'N/A'}</p>
                  </div>
                </div>
                {persona.system_prompt && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-gray-500">System Prompt</span>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {persona.system_prompt}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadados */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/80">
              <CardTitle className="text-lg">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-xs">{persona.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-mono text-xs">{persona.persona_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Criado:</span>
                <span className="text-xs">{new Date(persona.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Atualizado:</span>
                <span className="text-xs">{new Date(persona.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
