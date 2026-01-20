'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateConfiguration, useUpdateConfiguration } from '@/lib/supabase-hooks';
import { SystemConfiguration } from '@/lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';

const configurationSchema = z.object({
  key: z.string().min(1, 'Chave é obrigatória'),
  value: z.string().min(1, 'Valor é obrigatório'),
  category: z.enum(['api', 'system', 'ui', 'sync']),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

interface ConfigurationFormProps {
  configuration?: SystemConfiguration | null;
  onClose: () => void;
}

export function ConfigurationForm({ configuration, onClose }: ConfigurationFormProps) {
  const createConfigMutation = useCreateConfiguration();
  const updateConfigMutation = useUpdateConfiguration();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      key: configuration?.key || '',
      value: configuration?.value || '',
      category: configuration?.category || 'system',
      description: configuration?.description || '',
      is_active: configuration?.is_active ?? true,
    }
  });

  const isEditing = !!configuration;
  const isLoading = createConfigMutation.isPending || updateConfigMutation.isPending;

  const onSubmit = async (data: ConfigurationFormData) => {
    try {
      if (isEditing && configuration) {
        await updateConfigMutation.mutateAsync({
          id: configuration.id,
          ...data,
        });
      } else {
        await createConfigMutation.mutateAsync(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const categoryOptions = [
    { value: 'api', label: 'API', description: 'Configurações de APIs e serviços externos' },
    { value: 'system', label: 'Sistema', description: 'Configurações do sistema VCM' },
    { value: 'ui', label: 'Interface', description: 'Configurações da interface do usuário' },
    { value: 'sync', label: 'Sincronização', description: 'Configurações de sincronização de dados' }
  ];

  const selectedCategory = watch('category');
  const selectedCategoryInfo = categoryOptions.find(opt => opt.value === selectedCategory);

  // Common configuration examples based on category
  const getExamples = (category: string) => {
    const examples = {
      api: [
        'OPENAI_API_KEY',
        'SUPABASE_URL',
        'WEBHOOK_URL',
        'API_TIMEOUT',
        'MAX_RETRIES'
      ],
      system: [
        'DEBUG_MODE',
        'LOG_LEVEL',
        'MAX_CONCURRENT_JOBS',
        'DATA_RETENTION_DAYS',
        'BACKUP_INTERVAL'
      ],
      ui: [
        'THEME_COLOR',
        'DEFAULT_LANGUAGE',
        'ITEMS_PER_PAGE',
        'AUTO_SAVE_INTERVAL',
        'SIDEBAR_COLLAPSED'
      ],
      sync: [
        'SYNC_INTERVAL',
        'BATCH_SIZE',
        'RETRY_ATTEMPTS',
        'TIMEOUT_SECONDS',
        'AUTO_SYNC_ENABLED'
      ]
    };
    
    return examples[category as keyof typeof examples] || [];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Editar Configuração' : 'Nova Configuração'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoria *</label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedCategoryInfo && (
            <p className="text-sm text-gray-600 mt-1">{selectedCategoryInfo.description}</p>
          )}
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Key Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Chave *</label>
          <input
            {...register('key')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: OPENAI_API_KEY, DEBUG_MODE, SYNC_INTERVAL"
            disabled={isEditing} // Don't allow editing key in edit mode
          />
          {errors.key && (
            <p className="text-red-500 text-sm mt-1">{errors.key.message}</p>
          )}
          
          {/* Show examples for selected category */}
          {!isEditing && selectedCategory && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Exemplos para {selectedCategoryInfo?.label}:</p>
              <div className="flex flex-wrap gap-1">
                {getExamples(selectedCategory).map(example => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setValue('key', example)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Value Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Valor *</label>
          <textarea
            {...register('value')}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Valor da configuração..."
          />
          {errors.value && (
            <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição opcional da configuração..."
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('is_active')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium">Configuração ativa</label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}