'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseService } from '@/lib/database';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  UserX,
  Brain,
  Image,
  FileText,
  Settings,
  Sparkles,
  Eye
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

interface Persona {
  id: string;
  full_name: string;     // Campo real do banco
  role: string;         // Campo real do banco
  empresa_id: string;
  empresas?: {
    id: string;
    nome: string;
    codigo: string;
  };
  status: 'active' | 'inactive' | 'generating';
  avatar_url?: string;
  department: string;   // Campo real do banco
  specialty: string;    // Campo real do banco
  created_at: string;
  biografia_completa?: string;
  email?: string;
  whatsapp?: string;
  categoria?: string;
  competencias?: any[];
  personas_biografias?: any[];
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [activeTab, setActiveTab] = useState('gerenciar');
  const [empresaFiltro, setEmpresaFiltro] = useState<string | null>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState<string>('');
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const loadPersonas = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getPersonas();
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      // Verificar parâmetros da URL
      const empresaId = searchParams?.get('empresa');
      const empresaNome = searchParams?.get('nome');
      
      if (empresaId) {
        setEmpresaFiltro(empresaId);
        setNomeEmpresa(empresaNome || '');
      }
      
      loadPersonas();
    }
  }, [isClient, searchParams]);





  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = (persona.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (persona.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (persona.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedCategoria === 'todas' || (persona.department || '').toLowerCase() === selectedCategoria.toLowerCase();
    const matchesEmpresa = !empresaFiltro || persona.empresa_id === empresaFiltro;
    return matchesSearch && matchesDepartment && matchesEmpresa;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'gerando':
        return <Badge className="bg-blue-100 text-blue-800">Gerando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'executivo':
        return <UserCheck className="h-5 w-5 text-purple-600" />;
      case 'especialista':
        return <Brain className="h-5 w-5 text-blue-600" />;
      case 'assistente':
        return <Users className="h-5 w-5 text-green-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Central de Personas</h1>
            <p className="text-gray-600">
              {empresaFiltro && nomeEmpresa 
                ? `Personas da empresa: ${nomeEmpresa}` 
                : 'Gerencie todas as personas de suas empresas virtuais'
              }
            </p>
          </div>
        </div>

        {/* Alerta de Estado Real */}
        {empresaFiltro && filteredPersonas.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800">Personas ainda não geradas</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  A empresa <strong>{nomeEmpresa}</strong> foi criada mas as personas ainda não foram geradas.
                  <br />
                  Para criar as personas, execute os scripts de "Biografias" na página de detalhes da empresa.
                </p>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/empresas/${empresaFiltro}`)}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    Ir para Detalhes da Empresa
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado geral quando não há filtro */}
        {!empresaFiltro && personas.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Nenhuma persona encontrada</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Para ter personas, você precisa:
                  <br />
                  1. Criar uma empresa em <strong>/empresas</strong>
                  <br />
                  2. Executar o script "Biografias" nos detalhes da empresa
                </p>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/empresas')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Ir para Empresas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{personas.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {personas.filter(p => p.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Ativas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {personas.filter(p => p.department === 'executivo').length}
                </p>
                <p className="text-sm text-gray-600">Executivos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {personas.reduce((sum, p) => sum + (p.competencias?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Competências</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
          <TabsTrigger value="gerar">Gerar Novas</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
          <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
        </TabsList>

        {/* Tab: Gerenciar Personas */}
        <TabsContent value="gerenciar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personas Existentes</CardTitle>
                  <CardDescription>Visualize e edite suas personas criadas</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Buscar personas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todas">Todas as Categorias</option>
                  <option value="executivo">Executivos</option>
                  <option value="especialista">Especialistas</option>
                  <option value="assistente">Assistentes</option>
                </select>
              </div>

              {/* Lista de Personas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersonas.map((persona) => (
                  <Card key={persona.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {getCategoriaIcon(persona.department)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{persona.full_name}</CardTitle>
                            <p className="text-sm text-gray-500">{persona.role}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          {getStatusBadge(persona.status)}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Empresa</span>
                          <span className="text-sm font-medium">{persona.empresas?.nome || persona.empresa_id}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Competências</span>
                          <span className="text-sm font-medium">{persona.competencias?.length || 0}</span>
                        </div>

                        {persona.personas_biografias?.[0] && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {persona.personas_biografias?.[0]?.biografia || 'Biografia em desenvolvimento...'}
                          </p>
                        )}

                        <div className="flex space-x-2 pt-4 border-t">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gerar Novas */}
        <TabsContent value="gerar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <span>Geração Individual</span>
                </CardTitle>
                <CardDescription>
                  Gere uma persona específica com configurações detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Persona Individual
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  <span>Equipe Diversa</span>
                </CardTitle>
                <CardDescription>
                  Gere uma equipe completa com diversidade automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gerar Equipe
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Avatars */}
        <TabsContent value="avatars">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Image className="h-6 w-6 text-green-500" />
                <span>Sistema de Avatars</span>
              </CardTitle>
              <CardDescription>
                Gerencie avatars e imagens das suas personas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Image className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Gerar Avatars</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Crie avatars realistas usando IA
                    </p>
                    <Button size="sm">Gerar</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Upload Manual</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Faça upload de imagens próprias
                    </p>
                    <Button size="sm" variant="outline">Upload</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Configurações</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Ajustar estilos e preferências
                    </p>
                    <Button size="sm" variant="outline">Configurar</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ferramentas */}
        <TabsContent value="ferramentas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <span>Importar/Exportar</span>
                </CardTitle>
                <CardDescription>
                  Ferramentas para transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-500" />
                  <span>IA e Automação</span>
                </CardTitle>
                <CardDescription>
                  Ferramentas inteligentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Análise de Diversidade
                </Button>
                <Button className="w-full" variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Sugestões IA
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}