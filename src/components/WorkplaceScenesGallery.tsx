'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Image as ImageIcon, 
  Play, 
  Download, 
  Share2, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';

interface WorkplaceScene {
  id: string;
  scenario_id: string;
  scenario_name: string;
  scenario_description: string;
  image_url: string;
  image_grid_url?: string;
  image_thumbnail_url?: string;
  personas_used: Array<{
    persona_id: string;
    role: string;
    name: string;
  }>;
  full_prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'archived';
  is_approved: boolean;
  generation_service: string;
  usage_count: number;
  tags: string[];
  created_at: string;
}

interface WorkplaceScenesGalleryProps {
  empresaId: string;
  showGenerateButton?: boolean;
}

export function WorkplaceScenesGallery({ empresaId, showGenerateButton = true }: WorkplaceScenesGalleryProps) {
  const [scenes, setScenes] = useState<WorkplaceScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScene, setSelectedScene] = useState<WorkplaceScene | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadScenes();
  }, [empresaId, filterStatus]);

  const loadScenes = async () => {
    try {
      setLoading(true);
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('workplace_scenes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScenes(data || []);
    } catch (error) {
      console.error('Erro ao carregar cenas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    // Navegar para página de geração ou abrir modal
    window.location.href = `/tools?tab=workplace-scenes&empresaId=${empresaId}`;
  };

  const handleDownload = async (scene: WorkplaceScene) => {
    try {
      const response = await fetch(scene.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scene.scenario_id}_${scene.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  const handleShare = async (scene: WorkplaceScene) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scene.scenario_name,
          text: scene.scenario_description,
          url: scene.image_url
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar URL
      await navigator.clipboard.writeText(scene.image_url);
      alert('Link copiado para área de transferência!');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Concluído' },
      generating: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Gerando...' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      failed: { icon: AlertCircle, color: 'bg-red-100 text-red-800', label: 'Falhou' },
      archived: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Arquivado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando cenas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cenas de Trabalho</h2>
          <p className="text-gray-600 mt-1">
            Imagens realistas de situações profissionais
          </p>
        </div>
        {showGenerateButton && (
          <Button onClick={handleGenerate}>
            <Play className="w-4 h-4 mr-2" />
            Gerar Nova Cena
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          Todas ({scenes.length})
        </Button>
        <Button 
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
        >
          Concluídas
        </Button>
        <Button 
          variant={filterStatus === 'generating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('generating')}
        >
          Em Geração
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ImageIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total de Cenas</p>
                <p className="text-2xl font-bold">{scenes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">
                  {scenes.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Personas Usadas</p>
                <p className="text-2xl font-bold">
                  {new Set(scenes.flatMap(s => s.personas_used.map(p => p.persona_id))).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Visualizações</p>
                <p className="text-2xl font-bold">
                  {scenes.reduce((sum, s) => sum + (s.usage_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <Card key={scene.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-gray-200">
              {scene.image_url && scene.status === 'completed' ? (
                <img 
                  src={scene.image_thumbnail_url || scene.image_url} 
                  alt={scene.scenario_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedScene(scene)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {scene.status === 'generating' ? (
                    <Clock className="h-12 w-12 text-gray-400 animate-spin" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(scene.status)}
              </div>
              {scene.is_approved && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aprovado
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{scene.scenario_name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {scene.scenario_description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Personas */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Personas na cena:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {scene.personas_used.map((persona, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {persona.role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {scene.tags && scene.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {scene.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedScene(scene)}
                        disabled={scene.status !== 'completed'}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(scene)}
                    disabled={scene.status !== 'completed'}
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleShare(scene)}
                    disabled={scene.status !== 'completed'}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Data */}
                <div className="text-xs text-gray-500 flex items-center pt-2 border-t">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(scene.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {scenes.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma cena gerada ainda
          </h3>
          <p className="text-gray-600 mb-4">
            Gere a primeira cena de trabalho com suas personas
          </p>
          {showGenerateButton && (
            <Button onClick={handleGenerate}>
              <Play className="w-4 h-4 mr-2" />
              Gerar Primeira Cena
            </Button>
          )}
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedScene && (
        <Dialog open={!!selectedScene} onOpenChange={() => setSelectedScene(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedScene.scenario_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img 
                src={selectedScene.image_url} 
                alt={selectedScene.scenario_name}
                className="w-full rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personas:</h4>
                  <div className="space-y-2">
                    {selectedScene.personas_used.map((persona, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {persona.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{persona.name}</p>
                          <p className="text-xs text-gray-600">{persona.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informações:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Serviço:</strong> {selectedScene.generation_service}</p>
                    <p><strong>Criado:</strong> {new Date(selectedScene.created_at).toLocaleString('pt-BR')}</p>
                    <p><strong>Visualizações:</strong> {selectedScene.usage_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
