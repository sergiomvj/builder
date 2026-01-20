'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, RefreshCw, Download, Check } from 'lucide-react';
import { avatarService, AvatarConfig } from '@/lib/avatar-service';
import { useToast } from '@/components/ui/use-toast';

interface AvatarGeneratorProps {
  persona: any;
  onAvatarGenerated?: (avatarUrl: string) => void;
  showAdvancedControls?: boolean;
}

export function AvatarGenerator({ 
  persona, 
  onAvatarGenerated, 
  showAdvancedControls = true 
}: AvatarGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<any[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AvatarConfig>(() => 
    avatarService.generateConfigFromPersona(persona)
  );
  const { toast } = useToast();

  const handleGenerateAvatar = async () => {
    setIsGenerating(true);
    try {
      // Gera múltiplos avatares para escolha
      const avatarPromises = Array.from({ length: 3 }, () => 
        avatarService.generateAvatar(config)
      );
      
      const results = await Promise.all(avatarPromises);
      setGeneratedAvatars(results);
      setSelectedAvatar(results[0]?.url || null);
      
      toast({
        title: 'Avatares gerados com sucesso!',
        description: 'Escolha o avatar que mais combina com a persona.'
      });
    } catch (error) {
      console.error('Erro ao gerar avatares:', error);
      toast({
        title: 'Erro ao gerar avatares',
        description: 'Tente novamente em alguns instantes.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || !persona.id) return;
    
    setIsSaving(true);
    try {
      const savedUrl = await avatarService.generateAndSaveAvatar(persona.id, config);
      
      if (onAvatarGenerated) {
        onAvatarGenerated(savedUrl);
      }
      
      toast({
        title: 'Avatar salvo com sucesso!',
        description: 'O avatar foi aplicado à persona.'
      });
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast({
        title: 'Erro ao salvar avatar',
        description: 'Não foi possível salvar o avatar.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (key: keyof AvatarConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Preview do Avatar Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 size={20} />
            Avatar da Persona
          </CardTitle>
          <CardDescription>
            {persona.full_name || persona.nome} - {persona.role || persona.cargo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={persona.avatar_url || selectedAvatar} 
                alt={persona.full_name || persona.nome}
              />
              <AvatarFallback className="text-lg">
                {(persona.full_name || persona.nome || 'P')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{persona.full_name || persona.nome}</h3>
                {persona.avatar_url && (
                  <Badge variant="secondary">Avatar Salvo</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{persona.role || persona.cargo}</p>
              <p className="text-xs text-gray-500 mt-1">
                {config.gender} • {config.age} anos • {config.style}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Geração */}
      {showAdvancedControls && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Avatar</CardTitle>
            <CardDescription>
              Personalize como o avatar será gerado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select
                  value={config.gender}
                  onValueChange={(value: 'masculino' | 'feminino') => 
                    handleConfigChange('gender', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estilo</Label>
                <Select
                  value={config.style}
                  onValueChange={(value: any) => handleConfigChange('style', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="corporate">Corporativo</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="creative">Criativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Idade: {config.age} anos</Label>
              <Slider
                value={[config.age]}
                onValueChange={([value]) => handleConfigChange('age', value)}
                min={22}
                max={65}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Fundo</Label>
              <Select
                value={config.background}
                onValueChange={(value: any) => handleConfigChange('background', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Escritório</SelectItem>
                  <SelectItem value="studio">Estúdio</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="transparent">Transparente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateAvatar}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Avatares...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Avatares
                </>
              )}
            </Button>

            {generatedAvatars.length > 0 && (
              <Button
                onClick={() => {
                  setGeneratedAvatars([]);
                  setSelectedAvatar(null);
                }}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avatares Gerados */}
      {generatedAvatars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avatares Gerados</CardTitle>
            <CardDescription>
              Clique para selecionar o avatar preferido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {generatedAvatars.map((avatar, index) => (
                <div key={avatar.id} className="text-center space-y-2">
                  <div 
                    className={`
                      relative cursor-pointer rounded-lg border-2 p-2 transition-all
                      ${selectedAvatar === avatar.url 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedAvatar(avatar.url)}
                  >
                    <Avatar className="h-20 w-20 mx-auto">
                      <AvatarImage src={avatar.url} alt={`Avatar ${index + 1}`} />
                      <AvatarFallback>A{index + 1}</AvatarFallback>
                    </Avatar>
                    
                    {selectedAvatar === avatar.url && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Opção {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {selectedAvatar && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Salvar Avatar Selecionado
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      {generatedAvatars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detalhes Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Prompt:</strong> {generatedAvatars[0]?.prompt}</p>
              <p><strong>Configuração:</strong> {JSON.stringify(config, null, 2)}</p>
              <p><strong>Gerado em:</strong> {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}