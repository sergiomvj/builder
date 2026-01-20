import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useUpdatePersona = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ personaId, updates }: { personaId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('personas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar persona: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalida as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['personas-empresa'] });
      
      toast({
        title: 'Persona atualizada!',
        description: 'As alterações foram salvas com sucesso.'
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar persona:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    }
  });
};