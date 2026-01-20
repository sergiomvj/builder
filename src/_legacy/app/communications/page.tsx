'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommunicationInbox } from '@/components/CommunicationInbox';
import { Users, AlertCircle } from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

interface Persona {
  id: string;
  nome: string;
  cargo: string;
  avatar_url: string | null;
}

export default function CommunicationsPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = SupabaseSingleton.getInstance();
      
      const { data, error: fetchError } = await supabase
        .from('personas')
        .select('id, nome, cargo, avatar_url')
        .order('nome', { ascending: true });

      if (fetchError) throw fetchError;

      setPersonas(data || []);

      // Auto-selecionar primeira persona se houver
      if (data && data.length > 0 && !selectedPersonaId) {
        setSelectedPersonaId(data[0].id);
      }

    } catch (err: any) {
      console.error('Error loading personas:', err);
      setError(err.message || 'Erro ao carregar personas');
    } finally {
      setLoading(false);
    }
  };

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Comunicações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie comunicações entre personas da organização
          </p>
        </div>
        <Button onClick={loadPersonas} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Seletor de Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Selecione a Persona
          </CardTitle>
          <CardDescription>
            Escolha qual persona você deseja visualizar as comunicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando personas...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={loadPersonas}
                >
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : personas.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma persona encontrada. Crie personas primeiro antes de gerenciar comunicações.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha uma persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.map(persona => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        {(persona.avatar_local_path || persona.avatar_url) && (
                          <img 
                            src={(persona.avatar_local_path || persona.avatar_url)} 
                            alt={persona.nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{persona.nome}</span>
                        <span className="text-muted-foreground text-sm">({persona.cargo})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPersona && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  {selected(persona.avatar_local_path || persona.avatar_url) ? (
                    <img 
                      src={selected(persona.avatar_local_path || persona.avatar_url)} 
                      alt={selectedPersona.nome}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{selectedPersona.nome}</p>
                    <p className="text-sm text-muted-foreground">{selectedPersona.cargo}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inbox de Comunicações */}
      {selectedPersonaId && (
        <CommunicationInbox personaId={selectedPersonaId} />
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Sobre as Comunicações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Tipos de Comunicação:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Handoff:</strong> Transferência de tarefa ou responsabilidade</li>
            <li><strong>Notification:</strong> Notificação informativa (não requer ação)</li>
            <li><strong>Approval Request:</strong> Solicitação de aprovação (requer decisão)</li>
            <li><strong>Question:</strong> Pergunta que requer resposta</li>
          </ul>

          <p className="mt-4">
            <strong>Prioridades:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-gray-600">Low:</strong> Não urgente, pode esperar</li>
            <li><strong className="text-blue-600">Normal:</strong> Prioridade padrão</li>
            <li><strong className="text-orange-600">High:</strong> Requer atenção em breve</li>
            <li><strong className="text-red-600">Urgent:</strong> Requer ação imediata</li>
          </ul>

          <p className="mt-4">
            <strong>Ações Disponíveis:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Marcar como Lida:</strong> Indica que a mensagem foi vista</li>
            <li><strong>Marcar Ação Feita:</strong> Confirma que a ação solicitada foi completada</li>
            <li><strong>Arquivar:</strong> Remove da inbox (mantém histórico)</li>
            <li><strong>Responder:</strong> Envia resposta ao remetente</li>
          </ul>

          <p className="mt-4 text-xs">
            <strong>💡 Dica:</strong> Mensagens atrasadas (passaram do deadline) aparecem em vermelho.
            Priorize essas mensagens para evitar gargalos no fluxo de trabalho.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
