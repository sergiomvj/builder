'use client';

import { useState } from 'react';
import { useConfigurations, useDeleteConfiguration } from '@/lib/supabase-hooks';
import { SystemConfiguration } from '@/lib/supabase';
import { Plus, Edit, Trash2, Settings, Filter, Search } from 'lucide-react';
import { ConfigurationForm } from './configuration-form';

export function ConfiguracoesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: configurations, isLoading, error } = useConfigurations(selectedCategory || undefined);
  const deleteConfigMutation = useDeleteConfiguration();

  // Filter configurations by search term
  const filteredConfigurations = configurations?.filter(config => 
    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (config: SystemConfiguration) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (config: SystemConfiguration) => {
    if (window.confirm(`Tem certeza que deseja excluir a configuração "${config.key}"?`)) {
      try {
        await deleteConfigMutation.mutateAsync(config.id);
      } catch (error) {
        console.error('Erro ao excluir configuração:', error);
        alert('Erro ao excluir configuração. Tente novamente.');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConfig(null);
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      api: { label: 'API', className: 'bg-blue-100 text-blue-800' },
      system: { label: 'Sistema', className: 'bg-green-100 text-green-800' },
      ui: { label: 'Interface', className: 'bg-purple-100 text-purple-800' },
      sync: { label: 'Sincronização', className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || 
                  { label: category, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    );
  };

  const groupedConfigurations = filteredConfigurations?.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfiguration[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar configurações</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
          <p className="text-gray-600">Gerencie configurações de API, sistema e sincronização</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          Nova Configuração
        </button>
      </div>

      {/* Configuration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ConfigurationForm 
              configuration={editingConfig}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar configurações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              <option value="api">API</option>
              <option value="system">Sistema</option>
              <option value="ui">Interface</option>
              <option value="sync">Sincronização</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurations List */}
      {!groupedConfigurations || Object.keys(groupedConfigurations).length === 0 ? (
        <div className="text-center py-12">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração encontrada</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando sua primeira configuração'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <Plus size={20} />
              Criar Primeira Configuração
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedConfigurations).map(([category, configs]) => (
            <div key={category} className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="flex items-center gap-3">
                  {getCategoryBadge(category)}
                  <span className="font-medium text-gray-900">
                    {configs.length} configuração{configs.length !== 1 ? 'ões' : ''}
                  </span>
                </div>
              </div>
              
              <div className="divide-y">
                {configs.map((config) => (
                  <div key={config.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{config.key}</h3>
                          {getStatusBadge(config.is_active)}
                        </div>
                        {config.description && (
                          <p className="text-gray-600 text-sm mb-3">{config.description}</p>
                        )}
                        <div className="bg-gray-100 rounded-md p-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Valor:</div>
                          <div className="font-mono text-sm text-gray-900 break-all">
                            {config.value.length > 100 
                              ? `${config.value.substring(0, 100)}...` 
                              : config.value
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(config)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Criado: {new Date(config.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>Atualizado: {new Date(config.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}