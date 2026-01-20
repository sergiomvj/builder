// Hook personalizado para geração de imagens e configurações avançadas
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface ImageGenerationSettings {
  style: 'professional' | 'casual' | 'artistic' | 'corporate' | 'social-media';
  mood: 'bright' | 'dramatic' | 'natural' | 'cinematic';
  quality: 'standard' | 'high' | 'ultra';
  batch_size: number;
  auto_save: boolean;
  custom_prompts?: string[];
  empresa_id?: string;
}

export interface GeneratedImageRecord {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  prompt: string;
  config: any;
  metadata: any;
  empresa_id: string;
  personas_used: string[];
  template_id: string;
  template_name: string;
  scene_description: string;
  created_at: string;
  updated_at?: string;
}

export const useImageGeneration = (empresaId?: string) => {
  const [settings, setSettings] = useState<ImageGenerationSettings>({
    style: 'professional',
    mood: 'natural',
    quality: 'high',
    batch_size: 1,
    auto_save: true,
    empresa_id: empresaId
  });
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Carregar configurações salvas
  useEffect(() => {
    if (empresaId) {
      loadSettings();
      loadGeneratedImages();
    }
  }, [empresaId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('image_generation_settings')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();

      if (data && !error) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.log('Configurações padrão sendo usadas');
    }
  };

  const saveSettings = async (newSettings: Partial<ImageGenerationSettings>) => {
    if (!empresaId) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings, empresa_id: empresaId };
      
      const { error } = await supabase
        .from('image_generation_settings')
        .upsert(updatedSettings);

      if (error) throw error;
      
      setSettings(updatedSettings);
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas.'
      });
    } catch (err) {
      setError('Erro ao salvar configurações');
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.'
      });
    }
  };

  const loadGeneratedImages = async () => {
    if (!empresaId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_images_history')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setGeneratedImages(data || []);
    } catch (err) {
      setError('Erro ao carregar imagens');
      console.error('Erro ao carregar imagens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGeneratedImage = async (imageData: Omit<GeneratedImageRecord, 'id' | 'created_at' | 'updated_at'>) => {
    if (!empresaId) return;
    
    try {
      const { data, error } = await supabase
        .from('generated_images_history')
        .insert({
          ...imageData,
          empresa_id: empresaId
        })
        .select()
        .single();

      if (error) throw error;
      
      setGeneratedImages(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Erro ao salvar imagem:', err);
      toast({
        title: 'Aviso',
        description: 'Imagem gerada mas não foi salva no histórico.'
      });
    }
  };

  const deleteGeneratedImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('generated_images_history')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
      
      toast({
        title: 'Imagem removida',
        description: 'A imagem foi excluída do histórico.'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a imagem.'
      });
    }
  };

  const getImagesByTemplate = (templateId: string) => {
    return generatedImages.filter(img => img.template_id === templateId);
  };

  const getImagesByPersona = (personaId: string) => {
    return generatedImages.filter(img => 
      img.personas_used.includes(personaId)
    );
  };

  const exportImageHistory = async () => {
    try {
      const exportData = {
        empresa_id: empresaId,
        exported_at: new Date().toISOString(),
        settings,
        images: generatedImages,
        total_images: generatedImages.length
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-history-${empresaId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast({
        title: 'Histórico exportado',
        description: 'Arquivo JSON baixado com sucesso.'
      });
    } catch (err) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o histórico.'
      });
    }
  };

  const getGenerationStats = () => {
    const today = new Date().toDateString();
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      total: generatedImages.length,
      today: generatedImages.filter(img => 
        new Date(img.created_at).toDateString() === today
      ).length,
      thisWeek: generatedImages.filter(img => 
        new Date(img.created_at) >= thisWeek
      ).length,
      templates: Array.from(new Set(generatedImages.map(img => img.template_id))).length,
      personas: Array.from(new Set(generatedImages.flatMap(img => img.personas_used))).length
    };
  };

  return {
    settings,
    generatedImages,
    isLoading,
    error,
    saveSettings,
    saveGeneratedImage,
    deleteGeneratedImage,
    loadGeneratedImages,
    getImagesByTemplate,
    getImagesByPersona,
    exportImageHistory,
    getGenerationStats,
    updateSettings: (newSettings: Partial<ImageGenerationSettings>) => 
      setSettings(prev => ({ ...prev, ...newSettings }))
  };
};