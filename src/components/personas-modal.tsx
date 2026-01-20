'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, MapPin, Briefcase, Calendar, Users } from 'lucide-react';

interface PersonasModalProps {
  company: any;
  onClose: () => void;
}

export function PersonasModal({ company, onClose }: PersonasModalProps) {
  const isOpen = !!company;
  const [personas, setPersonas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Buscar personas reais quando o modal abrir
  useEffect(() => {
    if (!company || !isOpen) return;
    
    async function fetchPersonas() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Usar nova API que busca do banco Supabase
        const response = await fetch(`/api/personas-db/${company.id || company.codigo || 'ARVATEST'}`);
        const data = await response.json();
        
        if (data.success) {
          setPersonas(data.data?.personas || []);
        } else {
          setError(data.message || 'Erro ao carregar personas');
        }
      } catch (err) {
        setError('Erro de conexão');
        console.error('Erro ao buscar personas:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPersonas();
  }, [company, isOpen]);

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Personas - {company.nome}
              </h2>
              <p className="text-sm text-gray-600">
                {personas?.length || 0} personas cadastradas
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando personas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">Erro ao carregar personas</div>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : !personas || personas.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-gray-600 mb-2">Nenhuma persona encontrada</div>
              <p className="text-sm text-gray-500">
                Execute o gerador de biografias para criar personas para esta empresa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <div key={persona.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow min-h-[280px] max-h-[320px] overflow-y-auto">
                  {/* Avatar e Nome */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(persona.nome || 'NN').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{persona.nome}</h3>
                      <p className="text-sm text-gray-600">{persona.cargo}</p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {persona.categoria}
                      </div>
                    </div>
                  </div>

                  {/* Informações Básicas */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      <span>{persona.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} />
                      <span>{persona.telefone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase size={14} />
                      <span>{persona.departamento}</span>
                    </div>
                    
                    {persona.is_ceo && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        CEO
                      </div>
                    )}
                  </div>
                  
                  {/* Bio ou informações adicionais */}
                  {persona.biografia_completa && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Biografia</h4>
                      <div className="max-h-[80px] overflow-y-auto">
                        <p className="text-sm text-gray-600">
                          {persona.biografia_completa.length > 200 
                            ? persona.biografia_completa.substring(0, 200) + '...' 
                            : persona.biografia_completa}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}