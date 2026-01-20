'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImageGeneration, type ImageGenerationSettings } from '@/hooks/useImageGeneration';
import { useToast } from '@/components/ui/use-toast';
import { 
  Settings, 
  Palette, 
  Zap, 
  Download, 
  Eye, 
  BarChart3,
  FileText,
  Camera,
  Sparkles,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Edit
} from 'lucide-react';

interface ImageConfigurationProps {
  empresaId: string;
  onSettingsChange?: (settings: any) => void;
}

export function ImageConfiguration({ empresaId, onSettingsChange }: ImageConfigurationProps) {
  const {
    settings,
    generatedImages,
    isLoading,
    saveSettings,
    getGenerationStats,
    exportImageHistory,
    updateSettings
  } = useImageGeneration(empresaId);

  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  const { toast } = useToast();
  const stats = getGenerationStats();

  useEffect(() => {
    setCustomPrompts(settings.custom_prompts || []);
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleSaveSettings = async () => {
    await saveSettings({ ...settings, custom_prompts: customPrompts });
  };

  const addCustomPrompt = () => {
    if (newPrompt.trim()) {
      const updated = [...customPrompts, newPrompt.trim()];
      setCustomPrompts(updated);
      setNewPrompt('');
    }
  };

  const removeCustomPrompt = (index: number) => {
    const updated = customPrompts.filter((_, i) => i !== index);
    setCustomPrompts(updated);
  };

  const resetToDefaults = () => {
    updateSettings({
      style: 'professional',
      mood: 'natural',
      quality: 'high',
      batch_size: 1,
      auto_save: true
    });
    toast({
      title: 'Configurações resetadas',
      description: 'Valores padrão foram restaurados.'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações de Imagem</h2>
          <p className="text-gray-600 mt-1">Personalize o comportamento do gerador de avatares</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Resetar
          </Button>
          <Button onClick={handleSaveSettings} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings size={16} />
            Geral
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette size={16} />
            Estilo
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <FileText size={16} />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap size={16} />
            Avançado
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 size={16} />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas para geração de imagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Qualidade da Imagem</Label>
                  <Select 
                    value={settings.quality} 
                    onValueChange={(value) => handleSettingChange('quality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2">
                          <Camera size={16} />
                          Padrão (Rápido)
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Eye size={16} />
                          Alta (Balanceado)
                        </div>
                      </SelectItem>
                      <SelectItem value="ultra">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} />
                          Ultra (Melhor qualidade)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tamanho do Lote</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.batch_size]}
                      onValueChange={([value]) => handleSettingChange('batch_size', value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 imagem</span>
                      <span>{settings.batch_size} imagem(s)</span>
                      <span>10 imagens</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Salvamento Automático</Label>
                  <p className="text-xs text-gray-500">
                    Salvar automaticamente imagens geradas no histórico
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.auto_save}
                  onCheckedChange={(checked) => handleSettingChange('auto_save', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} />
                Estilo e Atmosfera
              </CardTitle>
              <CardDescription>
                Defina o estilo visual padrão das suas imagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estilo Visual</Label>
                  <Select 
                    value={settings.style} 
                    onValueChange={(value) => handleSettingChange('style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="artistic">Artístico</SelectItem>
                      <SelectItem value="corporate">Corporativo</SelectItem>
                      <SelectItem value="social-media">Mídia Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Atmosfera</Label>
                  <Select 
                    value={settings.mood} 
                    onValueChange={(value) => handleSettingChange('mood', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bright">Luminosa</SelectItem>
                      <SelectItem value="dramatic">Dramática</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="cinematic">Cinematográfica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { style: 'professional', label: 'Profissional', description: 'Corporativo e formal' },
                  { style: 'casual', label: 'Casual', description: 'Descontraído e amigável' },
                  { style: 'artistic', label: 'Artístico', description: 'Criativo e expressivo' },
                  { style: 'corporate', label: 'Corporativo', description: 'Empresarial e sério' }
                ].map((styleOption) => (
                  <Card 
                    key={styleOption.style} 
                    className={`cursor-pointer transition-all border-2 ${
                      settings.style === styleOption.style 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSettingChange('style', styleOption.style)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="font-medium">{styleOption.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{styleOption.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Prompts Personalizados
              </CardTitle>
              <CardDescription>
                Adicione prompts personalizados para suas gerações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um novo prompt..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomPrompt()}
                />
                <Button onClick={addCustomPrompt} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {customPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1 text-sm">{prompt}</div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCustomPrompt(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {customPrompts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum prompt personalizado adicionado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Opções para usuários experientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Geração Paralela</Label>
                    <p className="text-xs text-gray-500">
                      Gerar múltiplas imagens simultaneamente (usa mais recursos)
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache de Prompts</Label>
                    <p className="text-xs text-gray-500">
                      Armazenar prompts gerados para reutilização
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Histórico Estendido</Label>
                    <p className="text-xs text-gray-500">
                      Manter histórico de todas as variações geradas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={exportImageHistory} 
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Histórico Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total de Imagens</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.today}</div>
                <div className="text-sm text-gray-600">Geradas Hoje</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
                <div className="text-sm text-gray-600">Esta Semana</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.templates}</div>
                <div className="text-sm text-gray-600">Templates Usados</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedImages.slice(0, 5).map((image, index) => (
                  <div key={image.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <Badge variant="secondary">{image.template_name || image.template_id}</Badge>
                    <span className="text-sm flex-1">{image.scene_description}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(image.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                
                {generatedImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma imagem gerada ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}