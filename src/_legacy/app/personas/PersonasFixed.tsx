'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Building, Play, CheckCircle, Clock } from 'lucide-react';
import { PersonaDetailPage } from '@/components/PersonaDetailPage';
import { SupabaseSingleton } from '@/lib/supabase';

interface Persona {
  id: string;
  full_name: string;
  role: string;
  empresa_id: string;
  status: 'active' | 'inactive';
  department: string;
  specialty: string;
  biografia_completa?: string;
  personalidade?: any;
  idiomas?: string[];
  experiencia_anos?: number;
  email?: string;
  whatsapp?: string;
  temperatura_ia?: number;
  max_tokens?: number;
  system_prompt?: string;
  persona_code?: string;
  biografia?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  ia_config?: {
    tarefas_metas?: any;
    knowledge_base?: any;
    fluxos_sdr?: any;
  };
  empresas?: {
    nome: string;
  };
}

// Simulação simples de status dos scripts
const mockScriptStatus = {
  0: { status: 'idle', label: 'Avatares' },
  1: { status: 'success', label: 'Biografias' },
  2: { status: 'idle', label: 'Competências' },
  3: { status: 'idle', label: 'Tech Specs' },
  4: { status: 'idle', label: 'Fluxos' },
  5: { status: 'idle', label: 'N8N' }
};

export default function PersonasSimpleFixed() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [empresas, setEmpresas] = useState<Array<{id: string, nome: string}>>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [elementsStatus, setElementsStatus] = useState<Record<string, any>>({});

  // Verificar se há filtro de empresa na URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const empresaId = params.get('empresaId');
      if (empresaId) {
        setSelectedEmpresaId(empresaId);
      }
    }
  }, []);

  // Carregar personas do Supabase
  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar singleton do Supabase para evitar múltiplas instâncias
      const supabase = SupabaseSingleton.getInstance();

      // Carregar empresas ativas para o filtro
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('status', 'ativa')
        .not('nome', 'like', '[DELETED-%')
        .not('nome', 'like', '[EXCLUÍDA]%')
        .order('nome');
      
      if (empresasError) {
        console.error('Erro ao carregar empresas:', empresasError);
      }
      
      setEmpresas(empresasData || []);

      // Query simplificada de personas
      let query = supabase
        .from('personas')
        .select(`
          *,
          empresas!inner(id, nome, status)
        `)
        .eq('empresas.status', 'ativa')
        .not('empresas.nome', 'like', '[DELETED-%')
        .not('empresas.nome', 'like', '[EXCLUÍDA]%');

      // Aplicar filtro de empresa se selecionado
      if (selectedEmpresaId && selectedEmpresaId !== 'all') {
        query = query.eq('empresa_id', selectedEmpresaId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na query de personas:', error);
        console.error('   Código:', error.code);
        console.error('   Mensagem:', error.message);
        console.error('   Detalhes:', error.details);
        throw new Error(`Erro ao buscar personas: ${error.message}`);
      }

      console.log('✅ Personas carregadas:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📊 Exemplo de persona:', data[0]);
      }
      
      setPersonas(data || []);
      
      // Buscar status dos elementos de todas as personas
      await loadElementsStatus(selectedEmpresaId);
    } catch (err: any) {
      console.error('❌ Erro ao carregar personas:', err);
      setError(err.message || 'Falha ao carregar personas. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const loadElementsStatus = async (empresaId?: string) => {
    try {
      // Se não tiver empresaId ou for 'all', buscar todas as personas carregadas
      let url = '/api/personas/elements-status';
      
      if (empresaId && empresaId !== 'all') {
        url += `?empresaId=${empresaId}`;
      }
      
      console.log('🔍 Buscando status dos elementos:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('❌ Erro ao buscar status dos elementos, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Resposta de erro:', errorText);
        return;
      }
      
      const data = await response.json();
      setElementsStatus(data);
      console.log('✅ Status dos elementos carregado:', Object.keys(data).length, 'personas');
      console.log('📊 Exemplo de status:', data[Object.keys(data)[0]]);
    } catch (error) {
      console.error('❌ Erro ao buscar status dos elementos:', error);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, [selectedEmpresaId]);

  // Buscar status dos elementos quando já temos personas mas ainda não temos o status
  useEffect(() => {
    if (personas.length > 0 && Object.keys(elementsStatus).length === 0) {
      console.log('🔄 Buscando status dos elementos (fallback)...');
      loadElementsStatus(selectedEmpresaId);
    }
  }, [personas]);

  const filteredPersonas = personas.filter(persona =>
    persona.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Se uma persona está selecionada, mostrar detalhes
  if (selectedPersona) {
    return (
      <PersonaDetailPage 
        persona={selectedPersona} 
        onBack={() => setSelectedPersona(null)} 
      />
    );
  }

  const exportPersona = (persona: Persona) => {
    const data = {
      nome: persona.full_name,
      cargo: persona.role,
      empresa: persona.empresas?.nome || 'N/A',
      departamento: persona.department,
      especialidade: persona.specialty
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.full_name.replace(/\\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando personas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadPersonas} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Central de Personas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as personas e seus dados completos
          </p>
        </div>
        <Button onClick={loadPersonas}>
          Atualizar
        </Button>
      </div>

      {/* Search e Filtros */}
      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Buscar personas por nome ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <select
          value={selectedEmpresaId}
          onChange={(e) => setSelectedEmpresaId(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white min-w-[200px]"
        >
          <option value="all">Todas as Empresas</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Personas</p>
                <p className="text-2xl font-bold">{personas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Empresas Ativas</p>
                <p className="text-2xl font-bold">
                  {new Set(personas.map(p => p.empresas?.nome)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Com Avatares</p>
                <p className="text-2xl font-bold">
                  {personas.filter(p => p.avatar_url).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonas.map((persona) => {
          // 11 Elementos de Dados (buscar do estado ou fallback para persona)
          const statusFromAPI = elementsStatus[persona.id] || {};
          
          const elementosCompletos = {
            // Script 01 - Placeholders
            placeholders: statusFromAPI.placeholders !== undefined ? statusFromAPI.placeholders : Boolean(persona.id && persona.role),
            // Script 02 - Biografias
            biografias: statusFromAPI.biografias !== undefined ? statusFromAPI.biografias : Boolean(persona.biografia || persona.biografia_completa),
            // Script 03 - Atribuições
            atribuicoes: statusFromAPI.atribuicoes || false,
            // Script 04 - Competências
            competencias: statusFromAPI.competencias !== undefined ? statusFromAPI.competencias : Boolean(persona.ia_config?.tarefas_metas),
            // Script 05 - Avatares
            avatares: statusFromAPI.avatares !== undefined ? statusFromAPI.avatares : Boolean(persona.avatar_url),
            // Script 06 - Automation Analysis
            automation: statusFromAPI.automation || false,
            // Script 07 - Workflows N8N
            workflows: statusFromAPI.workflows || false,
            // Script 08 - Machine Learning
            ml_models: statusFromAPI.ml_models || false,
            // Script 09 - Auditoria
            auditoria: statusFromAPI.auditoria || false,
            // Elemento 10 - Email/Contato
            contato: statusFromAPI.contato !== undefined ? statusFromAPI.contato : Boolean(persona.email),
            // Elemento 11 - System Prompt
            system_prompt: statusFromAPI.system_prompt !== undefined ? statusFromAPI.system_prompt : Boolean(persona.system_prompt)
          };

          const totalElementos = Object.values(elementosCompletos).filter(Boolean).length;
          const percentualCompleto = Math.round((totalElementos / 11) * 100);

          return (
            <Card key={persona.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {persona.avatar_url ? (
                        <img 
                          src={persona.avatar_url} 
                          alt={persona.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm ${persona.avatar_url ? 'hidden' : ''}`}>
                        {persona.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <span className="text-sm">{persona.full_name}</span>
                  </div>
                  <Badge variant={persona.status === 'active' ? 'default' : 'secondary'}>
                    {persona.status}
                  </Badge>
                </CardTitle>
                <div>
                  <p className="text-gray-600 font-medium">{persona.role}</p>
                  <p className="text-sm text-gray-500">{persona.empresas?.nome}</p>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm"><strong>Departamento:</strong> {persona.department}</p>
                    <p className="text-sm"><strong>Especialidade:</strong> {persona.specialty}</p>
                  </div>
                  
                  {/* Progresso Geral (11 Elementos) */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">Dados Completos:</p>
                      <span className="text-sm font-bold text-blue-600">{totalElementos}/11</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentualCompleto === 100 ? 'bg-green-500' : 
                          percentualCompleto >= 70 ? 'bg-blue-500' :
                          percentualCompleto >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentualCompleto}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{percentualCompleto}% completo</p>
                    
                    {/* 11 Elementos em Grid */}
                    <div className="grid grid-cols-3 gap-1">
                      <Badge variant={elementosCompletos.placeholders ? "default" : "outline"} className="text-xs justify-center">
                        01 {elementosCompletos.placeholders ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.biografias ? "default" : "outline"} className="text-xs justify-center">
                        02 {elementosCompletos.biografias ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.atribuicoes ? "default" : "outline"} className="text-xs justify-center">
                        03 {elementosCompletos.atribuicoes ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.competencias ? "default" : "outline"} className="text-xs justify-center">
                        04 {elementosCompletos.competencias ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.avatares ? "default" : "outline"} className="text-xs justify-center bg-purple-50 border-purple-200">
                        05 {elementosCompletos.avatares ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.automation ? "default" : "outline"} className="text-xs justify-center">
                        06 {elementosCompletos.automation ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.workflows ? "default" : "outline"} className="text-xs justify-center bg-blue-50 border-blue-200">
                        07 {elementosCompletos.workflows ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.ml_models ? "default" : "outline"} className="text-xs justify-center bg-green-50 border-green-200">
                        08 {elementosCompletos.ml_models ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.auditoria ? "default" : "outline"} className="text-xs justify-center">
                        09 {elementosCompletos.auditoria ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.contato ? "default" : "outline"} className="text-xs justify-center">
                        Email {elementosCompletos.contato ? '✓' : '×'}
                      </Badge>
                      <Badge variant={elementosCompletos.system_prompt ? "default" : "outline"} className="text-xs justify-center col-span-1">
                        Prompt {elementosCompletos.system_prompt ? '✓' : '×'}
                      </Badge>
                    </div>
                    
                    {/* Legenda dos Scripts */}
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      <p className="font-semibold">Legenda:</p>
                      <div className="grid grid-cols-2 gap-x-3">
                        <p>01: Placeholders</p>
                        <p>06: Automação</p>
                        <p>02: Biografias</p>
                        <p>07: Workflows</p>
                        <p>03: Atribuições</p>
                        <p>08: ML Models</p>
                        <p>04: Competências</p>
                        <p>09: Auditoria</p>
                        <p>05: Avatares</p>
                        <p className="col-span-2">Email/Prompt: Metadados</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedPersona(persona)}
                    className="flex-1"
                  >
                    Ver Detalhes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => exportPersona(persona)}
                  >
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scripts Section */}
      <div className="border-t pt-6 mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Status dos Scripts</h2>
          <p className="text-sm text-gray-600">Geração e processamento automático</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(mockScriptStatus).map(([id, script]) => (
            <Card key={id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {script.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-medium">Script {id}</span>
                    <Badge variant="outline" className="text-xs">
                      {script.label}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-1" />
                    Executar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredPersonas.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Nenhuma persona encontrada</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Tente outro termo de busca.' : 'Nenhuma persona cadastrada.'}
          </p>
        </div>
      )}
    </div>
  );
}