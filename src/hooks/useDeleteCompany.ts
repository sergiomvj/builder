'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DeleteCompanyOptions {
  companyId: string;
  deleteType: 'soft' | 'hard';
}

export function useDeleteCompany() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteCompany = async ({ companyId, deleteType }: DeleteCompanyOptions) => {
    setIsDeleting(true);
    setError(null);

    try {
      console.log(`🗑️ Iniciando exclusão ${deleteType} da empresa ${companyId}`);
      
      const response = await fetch(`/api/empresas/${companyId}?type=${deleteType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao processar exclusão');
      }

      console.log('✅ Exclusão realizada com sucesso:', result.message);

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', companyId] });

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao processar exclusão';
      setError(errorMessage);
      console.error('❌ Erro na exclusão:', err);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const restoreCompany = async (companyId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      console.log(`🔄 Restaurando empresa ${companyId}`);
      
      const response = await fetch(`/api/empresas/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao restaurar empresa');
      }

      console.log('✅ Empresa restaurada com sucesso:', result.message);

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', companyId] });

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao restaurar empresa';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteCompany,
    restoreCompany,
    isDeleting,
    error,
    clearError: () => setError(null)
  };
}