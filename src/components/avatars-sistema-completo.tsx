'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Camera, 
  Users, 
  Wand2, 
  Download, 
  Play,
  Image as ImageIcon,
  Video,
  Share2,
  Settings,
  Loader2,
  Check,
  X,
  RefreshCw,
  Palette,
  Smartphone,
  Monitor,
  Tv,
  Save,
  Trash2,
  Star,
  Upload,
  Eye,
  Grid3X3
} from 'lucide-react';
import { 
  useEmpresas, 
  useAllPersonas, 
  useAvatarPersonas, 
  usePersonaAvatars, 
  useCreateAvatar, 
  useUpdateAvatar, 
  useDeleteAvatar, 
  useSetActiveAvatar 
} from '@/lib/supabase-hooks';
import { useToast } from '@/components/ui/use-toast';
import { imageGenerationService, type ImageConfig, type GeneratedImage } from '@/lib/image-generation-service';

interface ImageTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  dimensions: string;
  purpose: string;
  icon: any;
}

interface PersonaSelection {
  id: string;
  selected: boolean;
  position: 'center' | 'left' | 'right' | 'background';
}

export function AvatarsSistemaCompleto() {
  // Hooks do Supabase
  const { data: empresas = [] } = useEmpresas();
  const { data: allPersonas = [] } = useAllPersonas();
  const { data: avatarPersonas = [] } = useAvatarPersonas();
  const createAvatarMutation = useCreateAvatar();
  const updateAvatarMutation = useUpdateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const setActiveAvatarMutation = useSetActiveAvatar();

  // Estados principais
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'upload'>('generate');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaSelection[]>([]);
  const [sceneDescription, setSceneDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [imageStyle, setImageStyle] = useState('professional');
  const [imageMood, setImageMood] = useState('natural');
  const [imageQuality, setImageQuality] = useState('high');
  
  // Estados para gestão de avatares
  const [selectedPersonaForGallery, setSelectedPersonaForGallery] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  
  const { toast } = useToast();

  // Templates de imagem
  const imageTemplates: ImageTemplate[] = [
    {
      id: 'avatar-profile',
      name: 'Avatar Perfil',
      description: 'Foto de perfil profissional',
      aspectRatio: '1:1',
      dimensions: '512x512',
      purpose: 'Avatar pessoal',
      icon: Camera
    },
    {
      id: 'linkedin-avatar',
      name: 'LinkedIn',
      description: 'Avatar para LinkedIn',
      aspectRatio: '1:1',
      dimensions: '400x400',
      purpose: 'Perfil profissional',
      icon: Users
    },
    {
      id: 'team-photo',
      name: 'Foto de Equipe',
      description: 'Múltiplas pessoas',
      aspectRatio: '16:9',
      dimensions: '1280x720',
      purpose: 'Apresentações',
      icon: Monitor
    },
    {
      id: 'instagram-post',
      name: 'Instagram Post',
      description: 'Post quadrado',
      aspectRatio: '1:1',
      dimensions: '1080x1080',
      purpose: 'Redes sociais',
      icon: Smartphone
    }
  ];

  // Dados derivados
  const personasEmpresa = selectedEmpresa 
    ? allPersonas.filter(persona => persona.empresa_id === selectedEmpresa)
    : [];

  // Efeitos
  useEffect(() => {
    if (empresas.length > 0 && !selectedEmpresa) {
      setSelectedEmpresa(empresas[0].id);
    }
  }, [empresas, selectedEmpresa]);

  useEffect(() => {
    setSelectedPersonas(personasEmpresa.map(persona => ({
      id: persona.id,
      selected: false,
      position: 'center'
    })));
  }, [personasEmpresa]);

  // Funções de geração de avatar
  const handleGenerateAvatar = async () => {
    const selectedPersonasData = selectedPersonas.filter(p => p.selected);
    
    if (selectedPersonasData.length === 0) {
      toast({
        title: 'Selecione pelo menos uma persona',
        description: 'Escolha uma ou mais personas para gerar o avatar.'
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um formato para a imagem.'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Buscar dados das personas selecionadas
      const personasWithDetails = selectedPersonasData.map((sp) => {
        const persona = personasEmpresa.find(p => p.id === sp.id);
        return {
          id: sp.id,
          descricao_fisica: persona?.descricao_fisica || `${persona?.full_name}, ${persona?.role}`,
          position: sp.position
        };
      });

      const imageConfig: ImageConfig = {
        template: selectedTemplate,
        personas: personasWithDetails,
        scene: sceneDescription,
        style: imageStyle as any,
        mood: imageMood as any,
        quality: imageQuality as any
      };

      // Gerar imagem
      const generatedImage = await imageGenerationService.generateSceneImage(imageConfig);
      
      const newImage = {
        id: generatedImage.id,
        url: generatedImage.url,
        template: selectedTemplate,
        personas: selectedPersonasData,
        scene: sceneDescription,
        created_at: generatedImage.created_at
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      
      // Salvar na database se habilitado e for avatar individual
      if (saveToDatabase && selectedPersonasData.length === 1) {
        try {
          const personaId = selectedPersonasData[0].id;
          const personaCompleta = allPersonas.find(p => p.id === personaId);
          
          await createAvatarMutation.mutateAsync({
            persona_id: personaId,
            avatar_url: generatedImage.url,
            prompt_usado: `${sceneDescription} - ${personaCompleta?.full_name} (${personaCompleta?.role})`,
            estilo: imageStyle,
            background_tipo: selectedTemplate?.name || 'custom',
            servico_usado: 'nano_banana',
            metadados: {
              template: selectedTemplate,
              mood: imageMood,
              quality: imageQuality,
              aspectRatio: selectedTemplate?.aspectRatio,
              personas: selectedPersonasData.length
            }
          });
          
          toast({
            title: 'Avatar salvo!',
            description: `Avatar de ${personaCompleta?.full_name} foi salvo com sucesso.`
          });
        } catch (error) {
          console.error('Erro ao salvar avatar:', error);
          toast({
            title: 'Avatar gerado',
            description: 'Avatar criado, mas houve erro ao salvar na database.'
          });
        }
      }
      
      toast({
        title: 'Avatar gerado com sucesso!',
        description: `Avatar no formato ${selectedTemplate.name} foi criado.`
      });
      
    } catch (error) {
      console.error('Erro ao gerar avatar:', error);
      toast({
        title: 'Erro ao gerar avatar',
        description: 'Não foi possível gerar o avatar. Tente novamente.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Funções para upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!uploadFile || !selectedPersonaForGallery) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione um arquivo e uma persona.'
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const uploadUrl = URL.createObjectURL(uploadFile);
      const persona = allPersonas.find(p => p.id === selectedPersonaForGallery);
      
      await createAvatarMutation.mutateAsync({
        persona_id: selectedPersonaForGallery,
        avatar_url: uploadUrl,
        prompt_usado: `Upload manual - ${persona?.full_name}`,
        estilo: 'upload',
        background_tipo: 'custom',
        servico_usado: 'upload',
        metadados: {
          originalFileName: uploadFile.name,
          fileSize: uploadFile.size,
          fileType: uploadFile.type
        }
      });

      toast({
        title: 'Avatar enviado com sucesso!',
        description: `Avatar de ${persona?.full_name} foi salvo.`
      });
      
      setUploadFile(null);
      setSelectedPersonaForGallery('');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível salvar o avatar.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Funções de gestão da galeria
  const handleDeleteAvatar = async (avatarId: string) => {
    if (!confirm('Tem certeza que deseja excluir este avatar?')) return;
    
    try {
      await deleteAvatarMutation.mutateAsync(avatarId);
      toast({
        title: 'Avatar excluído',
        description: 'Avatar foi removido com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o avatar.'
      });
    }
  };

  const handleSetActiveAvatar = async (personaId: string, avatarId: string) => {
    try {
      await setActiveAvatarMutation.mutateAsync({ personaId, avatarId });
      toast({
        title: 'Avatar ativo alterado',
        description: 'Este avatar agora é o principal da persona.'
      });
    } catch (error) {
      console.error('Erro ao ativar avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o avatar.'
      });
    }
  };

  const handlePersonaToggle = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.map(p => 
        p.id === personaId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const handlePersonaPosition = (personaId: string, position: string) => {
    setSelectedPersonas(prev => 
      prev.map(p => 
        p.id === personaId ? { ...p, position: position as any } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Avatares Completo
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Gerencie avatares das personas com IA, faça upload de imagens personalizadas e visualize a galeria completa.
        </p>
      </div>

      {/* Navegação por Abas */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={activeTab === 'generate' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('generate')}
          className="flex-1"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Gerador IA
        </Button>
        <Button
          variant={activeTab === 'gallery' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('gallery')}
          className="flex-1"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Galeria
        </Button>
        <Button
          variant={activeTab === 'upload' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('upload')}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Aba Gerador IA */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Controles de Configuração */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={saveToDatabase}
                  onChange={(e) => setSaveToDatabase(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Salvar avatar na database</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seleção de Empresa e Personas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Selecionar Personas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seletor de Empresa */}
                <div>
                  <Label>Empresa</Label>
                  <select
                    value={selectedEmpresa}
                    onChange={(e) => setSelectedEmpresa(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Escolha uma empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lista de Personas */}
                {personasEmpresa.length > 0 && (
                  <div className="space-y-3">
                    <Label>Personas ({selectedPersonas.filter(p => p.selected).length} selecionadas)</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {personasEmpresa.map(persona => {
                        const personaSelection = selectedPersonas.find(p => p.id === persona.id);
                        return (
                          <div key={persona.id} className="flex items-center space-x-2 p-2 border rounded">
                            <input
                              type="checkbox"
                              checked={personaSelection?.selected || false}
                              onChange={() => handlePersonaToggle(persona.id)}
                              className="h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{persona.full_name}</p>
                              <p className="text-xs text-gray-500">{persona.role}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {imageTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className="h-5 w-5" />
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500">{template.dimensions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Descrição da cena</Label>
                  <Textarea
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    placeholder="Descreva o ambiente, pose, expressão..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Estilo</Label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="professional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="creative">Criativo</option>
                    <option value="corporate">Corporativo</option>
                  </select>
                </div>

                <div>
                  <Label>Humor</Label>
                  <select
                    value={imageMood}
                    onChange={(e) => setImageMood(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="natural">Natural</option>
                    <option value="serious">Sério</option>
                    <option value="friendly">Amigável</option>
                    <option value="confident">Confiante</option>
                  </select>
                </div>

                <Button
                  onClick={handleGenerateAvatar}
                  disabled={isGenerating || selectedPersonas.filter(p => p.selected).length === 0 || !selectedTemplate}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Gerar Avatar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultado */}
          {generatedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avatares Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image.url} 
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Aba Galeria */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galeria de Avatares
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os avatares salvos das personas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Filtro por Persona */}
                <div className="flex items-center gap-4">
                  <Label>Filtrar por Persona:</Label>
                  <select
                    value={selectedPersonaForGallery}
                    onChange={(e) => setSelectedPersonaForGallery(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="">Todas as personas</option>
                    {allPersonas.map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.full_name} ({persona.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid de Avatares */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {avatarPersonas
                    .filter(avatar => !selectedPersonaForGallery || avatar.persona_id === selectedPersonaForGallery)
                    .map((avatar) => (
                      <Card key={avatar.id} className="overflow-hidden">
                        <div className="relative">
                          <img 
                            src={avatar.avatar_url} 
                            alt={`Avatar ${avatar.id}`}
                            className="w-full h-48 object-cover"
                          />
                          {avatar.ativo && (
                            <Badge className="absolute top-2 left-2 bg-green-600">
                              <Star className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSetActiveAvatar(avatar.persona_id, avatar.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAvatar(avatar.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-600 truncate">
                            {avatar.prompt_usado}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <Badge variant="outline">{avatar.estilo}</Badge>
                            <span className="text-xs text-gray-500">v{avatar.versao}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
                
                {avatarPersonas.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum avatar encontrado</p>
                    <p className="text-sm">Gere alguns avatares na aba "Gerador IA"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aba Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Avatar
              </CardTitle>
              <CardDescription>
                Faça upload de uma imagem personalizada para usar como avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção de Persona */}
                <div className="space-y-2">
                  <Label>Selecionar Persona</Label>
                  <select
                    value={selectedPersonaForGallery}
                    onChange={(e) => setSelectedPersonaForGallery(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Escolha uma persona</option>
                    {allPersonas.map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.full_name} ({persona.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-2">
                  <Label>Arquivo de Imagem</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Preview */}
              {uploadFile && (
                <div className="space-y-4">
                  <Label>Preview</Label>
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={URL.createObjectURL(uploadFile)}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {/* Botão de Upload */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleUploadAvatar}
                  disabled={!uploadFile || !selectedPersonaForGallery || isGenerating}
                  className="w-full md:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Salvar Avatar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}