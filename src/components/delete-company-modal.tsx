'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface DeleteCompanyModalProps {
  company: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (companyId: string, deleteType: 'soft' | 'hard') => Promise<void>;
}

export function DeleteCompanyModal({ 
  company, 
  isOpen, 
  onClose, 
  onConfirmDelete 
}: DeleteCompanyModalProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [confirmationChecks, setConfirmationChecks] = useState({
    understand: false,
    backup: false,
    irreversible: false
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const canProceed = deleteType === 'soft' ? 
    confirmationChecks.understand : 
    Object.values(confirmationChecks).every(Boolean);

  const handleDelete = async () => {
    if (!canProceed) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirmDelete(company.id, deleteType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir empresa');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetState = () => {
    setDeleteType('soft');
    setConfirmationChecks({ understand: false, backup: false, irreversible: false });
    setError(null);
    setIsDeleting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen || !company) {
    console.log('🔍 Modal não renderizado - isOpen:', isOpen, 'company:', company);
    return null;
  }

  console.log('🎭 MODAL SENDO RENDERIZADO! Company:', company.nome);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-[1000] w-full max-w-[700px] max-h-[90vh] mx-4 bg-white rounded-lg shadow-2xl border flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-semibold">Excluir Empresa: {company?.nome}</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informações da Empresa */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-blue-800">📊 Dados da Empresa que serão afetados:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">🏢 Empresa:</span>
                <span className="ml-2 font-semibold">{company?.nome}</span>
              </div>
              <div>
                <span className="text-gray-600">👤 Personas:</span>
                <Badge variant="secondary" className="ml-2">{company?.total_personas || 0}</Badge>
              </div>
              <div>
                <span className="text-gray-600">📈 Status:</span>
                <Badge 
                  variant={company?.status === 'ativa' ? 'default' : 'secondary'} 
                  className="ml-2"
                >
                  {company?.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">🔧 Código:</span>
                <span className="ml-2 font-mono text-blue-700">{company?.codigo}</span>
              </div>
              <div>
                <span className="text-gray-600">🏭 Setor:</span>
                <span className="ml-2">{company?.industria || company?.industry}</span>
              </div>
              <div>
                <span className="text-gray-600">📅 Criada em:</span>
                <span className="ml-2">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>
            
            {company?.total_personas > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ Esta empresa possui <strong>{company.total_personas} personas</strong> que também serão afetadas pela exclusão.
              </div>
            )}
          </div>

          {/* Opções de Exclusão */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">🎯 Escolha o tipo de exclusão:</h3>
            
            {/* Exclusão Soft */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                deleteType === 'soft' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setDeleteType('soft')}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  checked={deleteType === 'soft'} 
                  onChange={() => setDeleteType('soft')}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="font-medium text-green-800">Desativar Empresa (Recomendado)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Marca a empresa como "inativa" sem excluir dados. 
                    Permite restauração posterior e mantém histórico completo para auditoria.
                  </p>
                  <div className="mt-2 text-xs text-green-700">
                    ✅ Reversível • ✅ Mantém dados • ✅ Seguro • ✅ Auditoria
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusão com Limpeza Manual */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                deleteType === 'hard' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setDeleteType('hard')}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  checked={deleteType === 'hard'} 
                  onChange={() => setDeleteType('hard')}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 size={18} className="text-red-600" />
                    <span className="font-medium text-red-800">Exclusão com Limpeza Completa</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Remove completamente a empresa seguindo sequência segura:
                    biografias → competências → dados relacionados → personas → empresa.
                  </p>
                  <div className="mt-2 text-xs text-red-700">
                    ❌ Irreversível • ❌ Remove tudo • ⚠️ Use apenas quando necessário
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmações Necessárias */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-3">✅ Confirmações Necessárias:</h3>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="understand"
                checked={confirmationChecks.understand}
                onCheckedChange={(checked) => 
                  setConfirmationChecks(prev => ({ ...prev, understand: !!checked }))
                }
              />
              <label htmlFor="understand" className="text-sm text-gray-700 cursor-pointer leading-tight">
                🎯 Entendo as consequências desta ação e confirmo que quero proceder com a 
                <strong className={deleteType === 'soft' ? 'text-green-700' : 'text-red-700'}>
                  {deleteType === 'soft' ? ' desativação' : ' exclusão permanente'}
                </strong> da empresa <strong>{company?.nome}</strong>
              </label>
            </div>

            {deleteType === 'hard' && (
              <>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="backup"
                    checked={confirmationChecks.backup}
                    onCheckedChange={(checked) => 
                      setConfirmationChecks(prev => ({ ...prev, backup: !!checked }))
                    }
                  />
                  <label htmlFor="backup" className="text-sm text-gray-700 cursor-pointer leading-tight">
                    💾 Confirmo que fiz backup dos dados importantes ou que não preciso preservá-los
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="irreversible"
                    checked={confirmationChecks.irreversible}
                    onCheckedChange={(checked) => 
                      setConfirmationChecks(prev => ({ ...prev, irreversible: !!checked }))
                    }
                  />
                  <label htmlFor="irreversible" className="text-sm text-gray-700 cursor-pointer leading-tight">
                    ⚠️ Entendo que esta ação é <strong className="text-red-600">IRREVERSÍVEL</strong> e que 
                    <strong> {company?.total_personas || 0} personas</strong> e todos os dados relacionados 
                    serão <strong className="text-red-600">perdidos permanentemente</strong>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warning para exclusão hard */}
          {deleteType === 'hard' && (
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong className="text-lg">🚨 EXCLUSÃO PERMANENTE - SEQUÊNCIA DE REMOÇÃO:</strong>
                
                <div className="mt-3 space-y-2">
                  <p className="font-medium">Esta operação executará os seguintes passos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                    <li>🖼️ Exclusão de todos os avatares multimedia da empresa</li>
                    <li>📊 Remoção de fluxos SDR e dados relacionados</li>
                    <li>🧹 Limpeza de dados de auditoria e logs relacionados</li>
                    <li>📋 Exclusão de {company?.total_personas || 0} biografias das personas</li>
                    <li>🎯 Remoção de competências e especificações técnicas</li>
                    <li>🤖 Exclusão de dados RAG e workflows das personas</li>
                    <li>👤 Remoção das {company?.total_personas || 0} personas</li>
                    <li>🏢 Exclusão definitiva da empresa "{company?.nome}"</li>
                  </ol>
                  
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <p className="font-bold text-red-900">⚠️ AÇÃO IRREVERSÍVEL!</p>
                    <p className="text-sm text-red-800 mt-1">
                      Após a confirmação, não será possível recuperar nenhum dado. 
                      Use apenas quando tiver certeza absoluta.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Info para exclusão soft */}
          {deleteType === 'soft' && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✅ DESATIVAÇÃO SEGURA (RECOMENDADO)</strong>
                
                <div className="mt-2 space-y-1 text-sm">
                  <p>• A empresa será marcada como "inativa"</p>
                  <p>• Todos os dados serão preservados</p>
                  <p>• Personas ficam disponíveis para auditoria</p>
                  <p>• Pode ser restaurada a qualquer momento</p>
                  <p>• Histórico completo mantido para compliance</p>
                </div>
                
                <p className="mt-2 font-medium text-green-700">
                  🔄 Esta ação pode ser revertida posteriormente.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions - Fixo na parte inferior */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 pt-4 border-t bg-gray-50">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            ❌ Cancelar
          </Button>
          
          <div className="flex items-center gap-2">
            {!canProceed && (
              <span className="text-sm text-gray-500 mr-2">
                {deleteType === 'soft' 
                  ? 'Complete a confirmação para continuar' 
                  : 'Complete todas as confirmações para continuar'
                }
              </span>
            )}
            
            <Button 
              variant={deleteType === 'soft' ? 'default' : 'destructive'}
              onClick={handleDelete}
              disabled={!canProceed || isDeleting}
              className={`min-w-[180px] font-semibold ${
                deleteType === 'soft' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {deleteType === 'soft' ? 'Desativando...' : 'Excluindo permanentemente...'}
                </>
              ) : (
                <>
                  {deleteType === 'soft' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      🟢 Desativar Empresa
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      🔥 Excluir Permanentemente
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>, 
    document.body
  );
}