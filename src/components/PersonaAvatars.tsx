'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@supabase/supabase-js';
import { Image as ImageIcon, Download, Eye, Sparkles, ExternalLink } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Avatar {
  id: string;
  avatar_type: string;
  file_url: string;
  file_thumbnail_url?: string;
  title: string;
  description?: string;
  style: string;
  use_cases: string[];
  tags: string[];
  generation_service: string;
  view_count: number;
  download_count: number;
  created_at: string;
}

interface PersonaAvatarsProps {
  personaId: string;
}

export function PersonaAvatars({ personaId }: PersonaAvatarsProps) {
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvatares();
  }, [personaId]);

  async function loadAvatares() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('avatares_multimedia')
        .select('*')
        .contains('personas_ids', [personaId])
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAvatares(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Avatares Multimedia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Sparkles className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (avatares.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Avatares Multimedia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum avatar gerado para esta persona</p>
            <p className="text-sm mt-2">Execute o script de geração de avatares</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Avatares Multimedia
            <Badge variant="secondary" className="ml-2">
              {avatares.length}
            </Badge>
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = '/avatares'}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatares.map((avatar) => (
            <div 
              key={avatar.id} 
              className="group relative rounded-lg overflow-hidden border hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Imagem */}
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={avatar.file_url}
                  alt={avatar.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => window.open(avatar.file_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = avatar.file_url;
                      link.download = `${avatar.title}.jpg`;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* Badge de estilo */}
                <Badge className="absolute top-2 left-2 bg-purple-500">
                  {avatar.style}
                </Badge>
              </div>

              {/* Info */}
              <div className="p-3 bg-white">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {avatar.title}
                </p>
                {avatar.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {avatar.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {avatar.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {avatar.download_count}
                  </span>
                  <span className="text-xs">
                    {avatar.generation_service}
                  </span>
                </div>

                {/* Tags */}
                {avatar.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {avatar.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {avatar.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{avatar.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
