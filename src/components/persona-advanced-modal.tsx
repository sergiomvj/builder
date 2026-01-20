'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Brain, 
  Settings, 
  Database, 
  GitBranch, 
  Shield, 
  X,
  Wand2,
  Eye
} from 'lucide-react';
import { AvatarGenerator } from './avatar-generator';
import { CompetenciasEditor } from './competencias-editor';
import { BiografiaRichEditor } from './biografia-rich-editor';
import { DescricaoFisicaEditor } from './descricao-fisica-editor';
import { useUpdatePersona } from '@/lib/supabase-hooks';

interface PersonaAdvancedModalProps {
  persona: any;
  isOpen: boolean;
  onClose: () => void;
  onPersonaUpdate?: (updatedPersona: any) => void;
  defaultTab?: string;
}

export function PersonaAdvancedModal({
  persona,
  isOpen,
  onClose,
  onPersonaUpdate,
  defaultTab = 'biografia'
}: PersonaAdvancedModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [personaData, setPersonaData] = useState(persona);
  const updatePersonaMutation = useUpdatePersona();

  useEffect(() => {
    setPersonaData(persona);
  }, [persona]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handlePersonaUpdate = async (updates: any) => {
    const updatedPersona = { ...personaData, ...updates };
    setPersonaData(updatedPersona);
    
    if (onPersonaUpdate) {
      onPersonaUpdate(updatedPersona);
    }

    // Salva automaticamente no banco de dados
    try {
      await updatePersonaMutation.mutateAsync({
        personaId: persona.id,
        updates
      });
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const },
      inactive: { label: 'Inativa', variant: 'secondary' as const },
      archived: { label: 'Arquivada', variant: 'destructive' as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  };

  const tabs = [
    {
      id: 'biografia',
      label: 'Biografia',
      icon: User,
      description: 'Informações pessoais e biografia completa'
    },
    {
      id: 'descricao-fisica',
      label: 'Descrição Física',
      icon: Eye,
      description: 'Características físicas detalhadas'
    },
    {
      id: 'avatar',
      label: 'Avatar',
      icon: Wand2,
      description: 'Geração e gestão de avatares'
    },
    {
      id: 'competencias',
      label: 'Competências',
      icon: Brain,
      description: 'Habilidades técnicas e comportamentais'
    },
    {
      id: 'tech-specs',
      label: 'Tech Specs',
      icon: Settings,
      description: 'Especificações técnicas e configurações IA'
    },
    {
      id: 'rag-knowledge',
      label: 'RAG Knowledge',
      icon: Database,
      description: 'Base de conhecimento e documentos'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: GitBranch,
      description: 'Fluxos de trabalho e automações'
    },
    {
      id: 'auditoria',
      label: 'Auditoria',
      icon: Shield,
      description: 'Logs, histórico e auditoria'
    }
  ];

  if (!persona) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={personaData.avatar_url} 
                alt={personaData.full_name || personaData.nome}
              />
              <AvatarFallback className="text-lg">
                {(personaData.full_name || personaData.nome || 'P')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {personaData.full_name || personaData.nome}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{personaData.role || personaData.cargo}</span>
                {personaData.department && (
                  <span className="text-gray-400">• {personaData.department}</span>
                )}
                {personaData.status && (
                  <Badge variant={getStatusBadge(personaData.status).variant}>
                    {getStatusBadge(personaData.status).label}
                  </Badge>
                )}
              </DialogDescription>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        {/* Navegação por Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-8 mb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex flex-col gap-1 h-auto py-2"
                  >
                    <Icon size={16} />
                    <span className="text-xs">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              
              {/* BIOGRAFIA TAB */}
              <TabsContent value="biografia" className="m-0 h-full">
                <BiografiaTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

              {/* DESCRIÇÃO FÍSICA TAB */}
              <TabsContent value="descricao-fisica" className="m-0 h-full">
                <DescricaoFisicaEditor 
                  persona={personaData}
                  onUpdate={(descricao) => handlePersonaUpdate({ descricao_fisica: descricao })}
                  showAIGenerate={true}
                />
              </TabsContent>

              {/* AVATAR TAB */}
              <TabsContent value="avatar" className="m-0 h-full">
                <AvatarGenerator 
                  persona={personaData}
                  onAvatarGenerated={(avatarUrl) => {
                    handlePersonaUpdate({ avatar_url: avatarUrl });
                  }}
                />
              </TabsContent>

              {/* COMPETÊNCIAS TAB */}
              <TabsContent value="competencias" className="m-0 h-full">
                <CompetenciasTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

              {/* TECH SPECS TAB */}
              <TabsContent value="tech-specs" className="m-0 h-full">
                <TechSpecsTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

              {/* RAG KNOWLEDGE TAB */}
              <TabsContent value="rag-knowledge" className="m-0 h-full">
                <RAGKnowledgeTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

              {/* WORKFLOWS TAB */}
              <TabsContent value="workflows" className="m-0 h-full">
                <WorkflowsTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

              {/* AUDITORIA TAB */}
              <TabsContent value="auditoria" className="m-0 h-full">
                <AuditoriaTab 
                  persona={personaData} 
                  onUpdate={handlePersonaUpdate}
                />
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================
// COMPONENTES ESPECÍFICOS POR TAB
// ============================

function BiografiaTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <BiografiaRichEditor 
        persona={persona}
        onUpdate={(biografia) => onUpdate({ biografia_completa: biografia })}
        showAIGenerate={true}
      />
    </div>
  );
}

function CompetenciasTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <CompetenciasEditor
        persona={persona}
        onUpdate={(competencias) => onUpdate({
          competencias_tecnicas: competencias.tecnicas,
          competencias_comportamentais: competencias.comportamentais
        })}
      />
    </div>
  );
}

function TechSpecsTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <h3 className="text-lg font-semibold">Configurações de IA</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Temperatura IA</label>
            <p className="text-sm text-gray-900 mt-1">{persona.temperatura_ia || 0.7}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Max Tokens</label>
            <p className="text-sm text-gray-900 mt-1">{persona.max_tokens || 1000}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">System Prompt</label>
            <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono max-h-40 overflow-auto">
              {persona.system_prompt || 'Não configurado'}
            </div>
          </div>
        </div>
      </div>

      {persona.ia_config && Object.keys(persona.ia_config).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Configuração IA Detalhada</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(persona.ia_config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function RAGKnowledgeTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <div className="text-center py-12">
        <Database size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Base de Conhecimento RAG</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Interface para visualizar e gerenciar a base de conhecimento RAG da persona.
        </p>
      </div>
    </div>
  );
}

function WorkflowsTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <div className="text-center py-12">
        <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Workflows N8N</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Visualização e controle dos workflows automatizados da persona.
        </p>
      </div>
    </div>
  );
}

function AuditoriaTab({ persona, onUpdate }: { persona: any; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações de Sistema</h3>
          <div className="space-y-2 text-sm">
            <div><strong>ID:</strong> {persona.id}</div>
            <div><strong>Código:</strong> {persona.persona_code}</div>
            <div><strong>Status:</strong> {persona.status}</div>
            <div><strong>Criado em:</strong> {new Date(persona.created_at).toLocaleString()}</div>
            <div><strong>Atualizado em:</strong> {new Date(persona.updated_at).toLocaleString()}</div>
            <div><strong>Último Sync:</strong> {persona.last_sync ? new Date(persona.last_sync).toLocaleString() : 'Nunca'}</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Logs de Atividade</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            Sistema de logs será implementado aqui
          </div>
        </div>
      </div>
    </div>
  );
}