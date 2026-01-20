'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DatabaseService } from '@/lib/database';
import { CompanyForm } from '@/components/company-form';
import {
  Building,
  Plus,
  Search,
  MoreVertical,
  Users,
  Calendar,
  Globe,
  MapPin,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';
import { DeleteCompanyModal } from '@/components/delete-company-modal';

interface Empresa {
  id: string;
  nome: string;
  codigo: string;
  industria: string;
  pais: string;
  idiomas: string[];
  status: 'ativa' | 'inativa' | 'processando';
  total_personas: number;
  created_at: string;
  updated_at: string;
  dominio?: string;
  descricao: string;
  scripts_status: {
    create_personas: boolean;
    avatares: boolean;
    biografias: boolean;
    atribuicoes: boolean;
    competencias: boolean;
    tasks_automation: boolean;
    workflows_n8n: boolean;
  };
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIndustria, setSelectedIndustria] = useState('todas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<Empresa | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      loadEmpresas();
      
      // Verificar se deve abrir modal de criação
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('create') === 'true') {
        setShowCreateModal(true);
        // Limpar o parâmetro da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [isClient]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getEmpresas();
      setEmpresas(data || []);
    } catch (error) {
      console.error('Error loading empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmpresas = empresas.filter(empresa => {
    // Filtrar empresas que foram "excluídas" (têm nome começando com [DELETED-)
    if (empresa.nome.startsWith('[DELETED-') || empresa.nome.includes('(DELETED)')) {
      return false; // Não mostrar empresas excluídas
    }
    
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustria = selectedIndustria === 'todas' || empresa.industria === selectedIndustria;
    return matchesSearch && matchesIndustria;
  });

  // Empresas válidas (não excluídas) para estatísticas
  const validEmpresas = empresas.filter(empresa => {
    return !empresa.nome.startsWith('[DELETED-') && !empresa.nome.includes('(DELETED)');
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'configurando':
        return <Badge className="bg-yellow-100 text-yellow-800">Configurando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const industriasDisponiveis = ['todas', 'Tecnologia', 'Marketing', 'Saúde', 'Educação', 'Finanças'];

  // Event handlers para ações
  const handleViewEmpresa = (empresa: Empresa) => {
    console.log('Visualizar empresa:', empresa.nome);
    // TODO: Implementar navegação para detalhes da empresa
    window.location.href = `/empresas/${empresa.id}`;
  };

  const handleEditEmpresa = (empresa: Empresa) => {
    console.log('Editar empresa:', empresa.nome);
    setEmpresaEditando(empresa);
    setShowEditModal(true);
  };

  const handleDeleteEmpresa = (empresa: Empresa) => {
    console.log('🔥 BOTÃO DE EXCLUSÃO CLICADO! Empresa:', empresa.nome);
    console.log('🔥 Abrindo modal de exclusão...');
    setEmpresaParaExcluir(empresa);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setEmpresaParaExcluir(null);
    loadEmpresas(); // Recarregar lista
  };

  const handleConfirmDelete = async (companyId: string, deleteType: 'soft' | 'hard') => {
    try {
      const response = await fetch(`/api/empresas/${companyId}?type=${deleteType}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao processar exclusão');
      }
      
      console.log('✅ Exclusão realizada com sucesso:', result.message);
      handleDeleteSuccess();
    } catch (error: any) {
      console.error('❌ Erro na exclusão:', error);
      throw error;
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEmpresaParaExcluir(null);
  };

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
              <p className="text-gray-600">Gerencie suas empresas virtuais</p>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedIndustria}
            onChange={(e) => setSelectedIndustria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {industriasDisponiveis.map(industria => (
              <option key={industria} value={industria}>
                {industria === 'todas' ? 'Todas as Indústrias' : industria}
              </option>
            ))}
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{validEmpresas.length}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {validEmpresas.filter(e => e.status === 'ativa').length}
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Configurando</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {validEmpresas.filter(e => e.status === 'processando').length}
                  </p>
                </div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Personas</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {validEmpresas.reduce((sum, e) => sum + e.total_personas, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmpresas.map((empresa) => (
          <Card key={empresa.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{empresa.nome}</CardTitle>
                    <p className="text-sm text-gray-500">{empresa.codigo}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => alert(`Menu para empresa: ${empresa.nome}`)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(empresa.status)}
                </div>

                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{empresa.industria}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{empresa.pais}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{empresa.total_personas} personas</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Criada em {new Date(empresa.created_at).toLocaleDateString()}
                  </span>
                </div>

                {empresa.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {empresa.descricao}
                  </p>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewEmpresa(empresa)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditEmpresa(empresa)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="px-3"
                    onClick={() => handleDeleteEmpresa(empresa)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmpresas.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira empresa virtual.'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      )}

      {/* Modal de Criação usando CompanyForm */}
      {showCreateModal && (
        <CompanyForm 
          onClose={(createdCompany) => {
            setShowCreateModal(false);
            if (createdCompany) {
              loadEmpresas(); // Recarregar lista
            }
          }}
        />
      )}

      {/* Modal de Edição usando CompanyForm */}
      {showEditModal && empresaEditando && (
        <CompanyForm 
          company={empresaEditando}
          onClose={(updatedCompany) => {
            setShowEditModal(false);
            setEmpresaEditando(null);
            if (updatedCompany) {
              loadEmpresas(); // Recarregar lista
            }
          }}
        />
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && empresaParaExcluir && (
        <DeleteCompanyModal
          company={empresaParaExcluir}
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}