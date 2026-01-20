'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Image as ImageIcon, 
  Video, 
  Users, 
  User, 
  Download,
  Eye,
  Filter,
  Sparkles,
  Building
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Avatar {
  id: string;
  avatar_type: 'photo' | 'video' | 'animated_gif' | '3d_render' | 'illustration';
  avatar_category: string;
  personas_ids: string[];
  personas_metadata: Array<{
    persona_id: string;
    name: string;
    role: string;
    position: string;
  }>;
  file_url: string;
  file_thumbnail_url?: string;
  title: string;
  description?: string;
  style: string;
  use_cases: string[];
  tags: string[];
  is_approved: boolean;
  status: string;
  generation_service: string;
  view_count: number;
  download_count: number;
  created_at: string;
}

export default function AvatarsPage() {
  const router = useRouter();
  
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'team'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Carregar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, codigo')
        .eq('status', 'ativa')
        .order('nome');

      if (empresasError) {
        console.error('Erro ao carregar empresas:', empresasError);
      }
      setEmpresas(empresasData || []);

      // Buscar avatares (TODOS os avatares, sem nenhum filtro)
      const { data: avatarsData, error: avatarsError } = await supabase
        .from('personas_avatares')
        .select('*')
        .order('created_at', { ascending: false });

      if (avatarsError) {
        console.error('Erro ao carregar avatares:', avatarsError);
        throw avatarsError;
      }

      console.log(`📊 Total de avatares encontrados: ${avatarsData?.length || 0}`);

      // Se temos avatares, buscar informações das personas
      if (avatarsData && avatarsData.length > 0) {
        const personaIds = [...new Set(avatarsData.map(a => a.persona_id).filter(Boolean))];
        
        console.log(`🔍 Buscando ${personaIds.length} personas...`);
        
        const { data: personasData, error: personasError } = await supabase
          .from('personas')
          .select('id, full_name, role, specialty, department, empresa_id, status')
          .in('id', personaIds);

        if (personasError) {
          console.error('❌ Erro ao carregar personas:', personasError);
        } else {
          console.log(`✅ ${personasData?.length || 0} personas carregadas`);
          if (personasData && personasData.length > 0) {
            console.log('Primeira persona exemplo:', personasData[0]);
          }
        }

        // Se temos personas, buscar empresas
        if (personasData && personasData.length > 0) {
          const empresaIds = [...new Set(personasData.map(p => p.empresa_id).filter(Boolean))];
          
          const { data: empresasInfoData, error: empresasInfoError } = await supabase
            .from('empresas')
            .select('id, nome, codigo')
            .in('id', empresaIds);

          if (empresasInfoError) {
            console.error('Erro ao carregar info de empresas:', empresasInfoError);
          }

          // Criar map de personas e empresas
          const personasMap = new Map(personasData.map(p => [p.id, p]));
          const empresasMap = new Map((empresasInfoData || []).map(e => [e.id, e]));

          console.log(`📊 PersonasMap tem ${personasMap.size} entradas`);
          console.log(`🏢 EmpresasMap tem ${empresasMap.size} entradas`);

          // Transformar dados para incluir empresa_id
          const avatarsWithCompany = avatarsData.map(avatar => {
            const persona = personasMap.get(avatar.persona_id);
            const empresa = persona ? empresasMap.get(persona.empresa_id) : null;
            
            // Log de debug para o primeiro avatar
            if (avatarsData.indexOf(avatar) === 0) {
              console.log('🔍 Debug primeiro avatar:');
              console.log('  - Avatar persona_id:', avatar.persona_id);
              console.log('  - Persona encontrada:', persona);
              console.log('  - Empresa encontrada:', empresa);
            }
            
            return {
              ...avatar,
              personas: persona || null,
              empresa_id: persona?.empresa_id || null,
              empresa_nome: empresa?.nome || null,
              empresa_codigo: empresa?.codigo || null,
            };
          });

          console.log(`✅ ${avatarsWithCompany.length} avatares processados com sucesso`);
          const firstAvatar = avatarsWithCompany[0];
          console.log('Primeiro avatar completo:', {
            id: firstAvatar.id,
            persona_id: firstAvatar.persona_id,
            persona_nome: firstAvatar.personas?.full_name,
            persona_role: firstAvatar.personas?.role
          });
          setAvatares(avatarsWithCompany);
        } else {
          console.log('⚠️ Nenhuma persona encontrada para os avatares');
          setAvatares(avatarsData.map(a => ({ ...a, personas: null })));
        }
      } else {
        console.log('⚠️ Nenhum avatar encontrado na tabela personas_avatares');
        setAvatares([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAvatares([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAvatares = avatares.filter(avatar => {
    // Filtro por empresa
    const matchesEmpresa = 
      empresaFilter === 'all' ? true : avatar.empresa_id === empresaFilter;

    // Filtro por tipo
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'photo' ? true : // Todos são fotos por enquanto
      filter === 'video' ? false :
      filter === 'team' ? false : true;

    // Filtro por busca (usa campos reais da tabela)
    const matchesSearch = !searchTerm || 
      avatar.prompt_usado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.estilo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.personas?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.personas?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.personas?.specialty?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpresa && matchesFilter && matchesSearch;
  });

  const stats = {
    total: avatares.filter(a => empresaFilter === 'all' || a.empresa_id === empresaFilter).length,
    photos: avatares.filter(a => (empresaFilter === 'all' || a.empresa_id === empresaFilter) && (a.avatar_local_path || a.avatar_url) && a.ativo).length,
    videos: 0, // Vídeos não disponíveis por enquanto
    team: 0, // Team não disponível por enquanto
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-500">Carregando avatares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-purple-500" />
                Avatares Multimedia
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Imagens e vídeos gerados por IA das personas
              </p>
            </div>
            <Button onClick={() => router.push('/personas')}>
              Ver Personas
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilter('all')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilter('photo')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fotos</p>
                    <p className="text-2xl font-bold">{stats.photos}</p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilter('video')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vídeos</p>
                    <p className="text-2xl font-bold">{stats.videos}</p>
                  </div>
                  <Video className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilter('team')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Equipe</p>
                    <p className="text-2xl font-bold">{stats.team}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="mt-6 flex gap-4 items-center">
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="w-[250px]">
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.codigo ? `${empresa.codigo} - ${empresa.nome}` : empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Badge variant={filter === 'all' ? 'default' : 'outline'}>
              {filter === 'all' ? 'Todos' : 
               filter === 'photo' ? 'Fotos' :
               filter === 'video' ? 'Vídeos' : 'Equipe'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid de Avatares */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAvatares.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum avatar encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvatares.map((avatar) => (
              <Card key={avatar.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-gray-100">
                  {avatar.avatar_local_path || avatar.avatar_url ? (
                    <img
                      src={avatar.avatar_local_path || avatar.avatar_url}
                      alt={avatar.personas?.full_name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Se falhar ao carregar, usar avatar com iniciais
                        const name = avatar.personas?.full_name || 'Avatar';
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=random`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      {avatar.personas?.full_name ? (
                        <div className="text-center">
                          <div className="text-6xl font-bold text-blue-600 mb-2">
                            {avatar.personas.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <p className="text-sm text-gray-600">Sem imagem</p>
                        </div>
                      ) : (
                        <User className="h-20 w-20 text-gray-400" />
                      )}
                    </div>
                  )}
                  {avatar.empresa_codigo && (
                    <Badge className="absolute top-2 left-2 bg-blue-500">
                      <Building className="h-3 w-3 mr-1" />
                      {avatar.empresa_codigo}
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {avatar.personas?.full_name || 'Avatar sem nome'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {avatar.personas?.role || avatar.personas?.specialty || avatar.personas?.department || 'Sem cargo definido'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Descrição do prompt */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Prompt:</p>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {avatar.prompt_usado || 'Avatar gerado automaticamente'}
                      </p>
                    </div>

                    {/* Estilo e serviço */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {avatar.estilo || 'Profissional'}
                      </Badge>
                      {avatar.background_tipo && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {avatar.background_tipo}
                        </Badge>
                      )}
                      {avatar.avatar_url && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          ✓ Com imagem
                        </Badge>
                      )}
                    </div>

                    {/* Empresa */}
                    {avatar.empresa_nome && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {avatar.empresa_nome}
                      </div>
                    )}

                    {/* Biometrics */}
                    {avatar.biometrics && (
                      <div className="text-xs text-gray-500">
                        {avatar.biometrics.genero && (
                          <span className="capitalize">{avatar.biometrics.genero}</span>
                        )}
                        {avatar.biometrics.etnia && (
                          <span className="capitalize"> • {avatar.biometrics.etnia}</span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {avatar.servico_usado?.replace('fal_ai_', '') || 'fal.ai'}
                      </span>
                      <span className="ml-auto text-xs">
                        {new Date(avatar.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          const imageUrl = avatar.avatar_local_path || avatar.avatar_url;
                          if (imageUrl) {
                            window.open(imageUrl, '_blank');
                          }
                        }}
                        disabled={!avatar.avatar_local_path && !avatar.avatar_url}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const imageUrl = avatar.avatar_local_path || avatar.avatar_url;
                          if (imageUrl) {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `${avatar.personas?.full_name || 'avatar'}.jpg`;
                            link.click();
                          }
                        }}
                        disabled={!avatar.avatar_local_path && !avatar.avatar_url}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
