'use client';

import { useState } from 'react';
import { useGenerateBiografias } from '@/lib/hooks';
import { BiografiaRequest, NacionalidadePercentual } from '@/lib/api';
import { NacionalidadeSelector } from './nacionalidade-selector';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';

export function BiografiaForm() {
  const [formData, setFormData] = useState<BiografiaRequest>({
    empresa_codigo: 'ARVATEST',
    empresa_nome: 'TechVision Solutions',
    empresa_industry: 'tecnologia',
    empresa_pais: 'Brasil',
    empresa_descricao: 'Empresa de soluções tecnológicas inovadoras focada em transformação digital',
    empresa_tamanho: 'media',
    empresa_cultura: 'hibrida',
    nacionalidades: [{ tipo: 'latinos', percentual: 100 }], // Iniciar com 100% latinos
    ceo_genero: 'feminino',
    executivos_homens: 2,
    executivos_mulheres: 2,
    assistentes_homens: 2,
    assistentes_mulheres: 3,
    especialistas_homens: 3,
    especialistas_mulheres: 3,
    idiomas_extras: ['alemão', 'japonês']
  });

  const [showOutput, setShowOutput] = useState(false);
  const generateMutation = useGenerateBiografias();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se nacionalidades somam 100%
    const totalPercentual = formData.nacionalidades.reduce((sum, nac) => sum + nac.percentual, 0);
    if (totalPercentual !== 100) {
      alert('As nacionalidades devem somar exatamente 100%');
      return;
    }
    
    generateMutation.mutate(formData);
    setShowOutput(true);
  };

  const handleInputChange = (field: keyof BiografiaRequest, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNacionalidadesChange = (nacionalidades: NacionalidadePercentual[]) => {
    setFormData(prev => ({ ...prev, nacionalidades }));
  };

  return (
    <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Geração de Empresa Virtual</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
            <input
              type="text"
              value={formData.empresa_nome}
              onChange={(e) => handleInputChange('empresa_nome', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: TechVision Solutions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">País de Origem</label>
            <select
              value={formData.empresa_pais}
              onChange={(e) => handleInputChange('empresa_pais', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Brasil">Brasil</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="Canadá">Canadá</option>
              <option value="Reino Unido">Reino Unido</option>
              <option value="Alemanha">Alemanha</option>
              <option value="França">França</option>
              <option value="Espanha">Espanha</option>
              <option value="Austrália">Austrália</option>
              <option value="Japão">Japão</option>
              <option value="Singapura">Singapura</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição da Empresa</label>
          <textarea
            value={formData.empresa_descricao}
            onChange={(e) => handleInputChange('empresa_descricao', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Descreva o propósito, missão e principais atividades da empresa..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Indústria</label>
            <select
              value={formData.empresa_industry}
              onChange={(e) => handleInputChange('empresa_industry', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tecnologia">Tecnologia</option>
              <option value="saude">Saúde</option>
              <option value="educacao">Educação</option>
              <option value="financeiro">Financeiro</option>
              <option value="marketing">Marketing</option>
              <option value="consultoria">Consultoria</option>
              <option value="e-commerce">E-commerce</option>
              <option value="varejo">Varejo</option>
              <option value="manufatura">Manufatura</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tamanho da Empresa</label>
            <select
              value={formData.empresa_tamanho}
              onChange={(e) => handleInputChange('empresa_tamanho', e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="startup">Startup (2-10 funcionários)</option>
              <option value="pequena">Pequena (11-50 funcionários)</option>
              <option value="media">Média (51-250 funcionários)</option>
              <option value="grande">Grande (250+ funcionários)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cultura Organizacional</label>
            <select
              value={formData.empresa_cultura}
              onChange={(e) => handleInputChange('empresa_cultura', e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </div>
        </div>

        {/* Seletor de Nacionalidades - em linha separada para mais espaço */}
        <NacionalidadeSelector
          nacionalidades={formData.nacionalidades}
          onChange={handleNacionalidadesChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gênero do CEO</label>
            <select
              value={formData.ceo_genero}
              onChange={(e) => handleInputChange('ceo_genero', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Distribuição da Equipe</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Executivos (H)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.executivos_homens}
                onChange={(e) => handleInputChange('executivos_homens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Executivos (M)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.executivos_mulheres}
                onChange={(e) => handleInputChange('executivos_mulheres', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Assistentes (H)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.assistentes_homens}
                onChange={(e) => handleInputChange('assistentes_homens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Assistentes (M)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.assistentes_mulheres}
                onChange={(e) => handleInputChange('assistentes_mulheres', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Especialistas (H)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.especialistas_homens}
                onChange={(e) => handleInputChange('especialistas_homens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Especialistas (M)</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.especialistas_mulheres}
                onChange={(e) => handleInputChange('especialistas_mulheres', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={generateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Play size={20} />
          )}
          {generateMutation.isPending ? 'Gerando Biografias...' : 'Gerar Biografias'}
        </button>
      </form>

      {showOutput && generateMutation.data && (
        <div className="mt-6 p-4 border rounded-md">
          <div className="flex items-center gap-2 mb-2">
            {generateMutation.data.success ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
            <span className={`font-medium ${generateMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
              {generateMutation.data.message}
            </span>
          </div>
          
          {generateMutation.data.output && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-600">Ver log de execução</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {generateMutation.data.output}
              </pre>
            </details>
          )}

          {generateMutation.data.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {generateMutation.data.error}
            </div>
          )}

          {generateMutation.data.execution_time && (
            <div className="mt-2 text-sm text-gray-600">
              Tempo de execução: {generateMutation.data.execution_time.toFixed(2)}s
            </div>
          )}
        </div>
      )}
    </div>
  );
}