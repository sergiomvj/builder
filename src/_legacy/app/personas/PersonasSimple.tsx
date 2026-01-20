'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DatabaseService } from '@/lib/database';
import { StatusPanel } from '@/components/status-panel';
import { ScriptControls } from '@/components/script-controls';

interface Persona {
  id: string;
  full_name: string;
  role: string;
  empresa_id: string;
  status: 'active' | 'inactive' | 'generating';
  department: string;
  specialty: string;
  empresas?: {
    nome: string;
  };
  // Tabelas relacionadas
  personas_biografias?: any[];
  competencias?: any[];
  personas_tech_specs?: any[];
  rag_knowledge?: any[];
  workflows?: any[];
  personas_atribuicoes?: any[];
  avatares_personas?: any[];
}

export default function PersonasSimple() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getPersonas();
      setPersonas(data || []);
    } catch (error) {
      console.error('Erro ao carregar personas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar personas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonas = personas.filter(persona =>
    persona.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (persona: Persona) => {
    const data = {
      nome: persona.full_name,
      cargo: persona.role,
      empresa: persona.empresas?.nome || persona.empresa_id,
      status: persona.status,
      departamento: persona.department
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.full_name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Sucesso',
      description: 'Persona exportada!'
    });
  };

  const handleViewDetails = (persona: Persona) => {
    toast({
      title: 'Em desenvolvimento',
      description: `Visualização detalhada da persona ${persona.full_name} será implementada em breve.`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Central de Personas</h1>
          <p className="text-gray-600 mt-1">Gerencie as personas e seus dados completos</p>
        </div>
        <Button onClick={loadPersonas}>Atualizar</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar personas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonas.map((persona) => {
          // Pegar avatar ativo
          const avatarAtivo = persona.avatares_personas?.find(avatar => avatar.ativo) || persona.avatares_personas?.[0];
          
          return (
            <Card key={persona.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar da Persona */}
                  {avatarAtivo ? (
                    <div className="relative">
                      <img 
                        src={avatarAtivo.avatar_thumbnail_url || avatarAtivo.avatar_url} 
                        alt={`Avatar de ${persona.full_name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          // Fallback para iniciais se imagem não carregar
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="w-12 h-12 rounded-full bg-blue-500 text-white hidden items-center justify-center font-semibold text-sm">
                        {persona.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {avatarAtivo.ativo && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-600">
                      {persona.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span>{persona.full_name}</span>
                </div>
                <Badge variant={persona.status === 'active' ? 'default' : 'secondary'}>
                  {persona.status}
                </Badge>
              </CardTitle>
              <p className="text-gray-600">{persona.role}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <strong>Empresa:</strong> {persona.empresas?.nome || persona.empresa_id}
                </div>
                <div>
                  <strong>Departamento:</strong> {persona.department}
                </div>
                <div>
                  <strong>Especialidade:</strong> {persona.specialty}
                </div>
                
                {/* Seção de Dados Relacionados */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Dados Disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.avatares_personas && persona.avatares_personas.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">
                        {persona.avatares_personas.length} Avatar{persona.avatares_personas.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {persona.personas_biografias && persona.personas_biografias.length > 0 && (
                      <Badge variant="outline" className="text-xs">Bio</Badge>
                    )}
                    {persona.competencias && persona.competencias.length > 0 && (
                      <Badge variant="outline" className="text-xs">Competências</Badge>
                    )}
                    {persona.personas_tech_specs && persona.personas_tech_specs.length > 0 && (
                      <Badge variant="outline" className="text-xs">Tech Specs</Badge>
                    )}
                    {persona.rag_knowledge && persona.rag_knowledge.length > 0 && (
                      <Badge variant="outline" className="text-xs">RAG</Badge>
                    )}
                    {persona.workflows && persona.workflows.length > 0 && (
                      <Badge variant="outline" className="text-xs">Workflows</Badge>
                    )}
                    {persona.personas_atribuicoes && persona.personas_atribuicoes.length > 0 && (
                      <Badge variant="outline" className="text-xs">Atribuições</Badge>
                    )}
                  </div>
                  
                  {/* Informações do Avatar Ativo */}
                  {avatarAtivo && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>Avatar:</span>
                        <Badge variant="outline" className="text-xs bg-purple-50">
                          {avatarAtivo.estilo}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{avatarAtivo.versao}
                        </Badge>
                        <span className="text-gray-400">
                          • {avatarAtivo.servico_usado}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  onClick={() => handleViewDetails(persona)}
                  className="flex-1"
                >
                  Ver Detalhes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport(persona)}
                >
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Seção de Scripts movida para baixo e compacta */}
      <div className="border-t pt-6 mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Status dos Scripts & Automação</h2>
          <p className="text-sm text-gray-600">Geração e processamento das personas</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusPanel />
          <div className="space-y-6">
            <ScriptControls />
          </div>
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