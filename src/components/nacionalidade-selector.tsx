'use client';

import { useState, useEffect } from 'react';

export interface NacionalidadePercentual {
  tipo: string;
  percentual: number;
}

interface NacionalidadeSelectorProps {
  nacionalidades: NacionalidadePercentual[];
  onChange: (nacionalidades: NacionalidadePercentual[]) => void;
}

const TIPOS_NACIONALIDADE = [
  { value: 'brasileiros', label: 'Brasileiros' },
  { value: 'latinos', label: 'Latinos' },
  { value: 'europeus', label: 'Europeus' },
  { value: 'asiaticos', label: 'Asiáticos' },
  { value: 'norte_americanos', label: 'Norte-americanos' },
  { value: 'africanos', label: 'Africanos' },
  { value: 'oriente_medio', label: 'Oriente Médio' },
  { value: 'nordicos', label: 'Nórdicos' },
  { value: 'oceanicos', label: 'Oceânicos' }
];

export function NacionalidadeSelector({ nacionalidades, onChange }: NacionalidadeSelectorProps) {
  const [totalPercentual, setTotalPercentual] = useState(0);

  // Calcular total sempre que nacionalidades mudarem
  useEffect(() => {
    const total = nacionalidades.reduce((sum, nac) => sum + nac.percentual, 0);
    setTotalPercentual(total);
  }, [nacionalidades]);

  const handleTipoChange = (index: number, novoTipo: string) => {
    const novasNacionalidades = [...nacionalidades];
    novasNacionalidades[index] = { ...novasNacionalidades[index], tipo: novoTipo };
    onChange(novasNacionalidades);
  };

  const handlePercentualChange = (index: number, novoPercentual: number) => {
    const novasNacionalidades = [...nacionalidades];
    novasNacionalidades[index] = { ...novasNacionalidades[index], percentual: Math.max(0, Math.min(100, novoPercentual)) };
    onChange(novasNacionalidades);
  };

  const adicionarNacionalidade = () => {
    // Encontrar primeira nacionalidade não selecionada
    const tiposUsados = nacionalidades.map(n => n.tipo);
    const proximoTipo = TIPOS_NACIONALIDADE.find(t => !tiposUsados.includes(t.value));
    
    if (proximoTipo) {
      const percentualRestante = Math.max(0, 100 - totalPercentual);
      onChange([...nacionalidades, { tipo: proximoTipo.value, percentual: Math.min(percentualRestante, 25) }]);
    }
  };

  const removerNacionalidade = (index: number) => {
    const novasNacionalidades = nacionalidades.filter((_, i) => i !== index);
    onChange(novasNacionalidades);
  };

  const distribuirIgualmente = () => {
    if (nacionalidades.length === 0) return;
    
    const percentualPorNacionalidade = Math.floor(100 / nacionalidades.length);
    const sobra = 100 - (percentualPorNacionalidade * nacionalidades.length);
    
    const novasNacionalidades = nacionalidades.map((nac, index) => ({
      ...nac,
      percentual: percentualPorNacionalidade + (index < sobra ? 1 : 0)
    }));
    
    onChange(novasNacionalidades);
  };

  const normalizarPercentuais = () => {
    if (totalPercentual === 0) return;
    
    const fator = 100 / totalPercentual;
    const novasNacionalidades = nacionalidades.map(nac => ({
      ...nac,
      percentual: Math.round(nac.percentual * fator)
    }));
    
    // Ajustar arredondamento para somar exatamente 100%
    const novoTotal = novasNacionalidades.reduce((sum, nac) => sum + nac.percentual, 0);
    if (novoTotal !== 100 && novasNacionalidades.length > 0) {
      novasNacionalidades[0].percentual += (100 - novoTotal);
    }
    
    onChange(novasNacionalidades);
  };

  const getTiposDisponiveis = (indexAtual: number) => {
    const tiposUsados = nacionalidades
      .map((n, i) => i !== indexAtual ? n.tipo : null)
      .filter(Boolean);
    
    return TIPOS_NACIONALIDADE.filter(t => !tiposUsados.includes(t.value));
  };

  const isPercentualValido = totalPercentual === 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Distribuição de Nacionalidades</label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isPercentualValido ? 'text-green-600' : 'text-orange-600'}`}>
            Total: {totalPercentual}%
          </span>
          {isPercentualValido && <span className="text-green-600">✓</span>}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="space-y-3">
          {nacionalidades.map((nacionalidade, index) => {
            const tiposDisponiveis = getTiposDisponiveis(index);
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded border">
                <div className="flex-1">
                  <select
                    value={nacionalidade.tipo}
                    onChange={(e) => handleTipoChange(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Manter opção atual sempre disponível */}
                    <option value={nacionalidade.tipo}>
                      {TIPOS_NACIONALIDADE.find(t => t.value === nacionalidade.tipo)?.label || nacionalidade.tipo}
                    </option>
                    {/* Mostrar outras opções disponíveis */}
                    {tiposDisponiveis.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={nacionalidade.percentual}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePercentualChange(index, parseInt(e.target.value) || 0)}
                    className="w-full text-center text-sm px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <span className="text-sm text-gray-500 w-4">%</span>
                
                {nacionalidades.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerNacionalidade(index)}
                    className="p-2 text-red-500 hover:bg-red-50 border border-red-300 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={adicionarNacionalidade}
            disabled={nacionalidades.length >= TIPOS_NACIONALIDADE.length}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            + Adicionar
          </button>

          {nacionalidades.length > 1 && (
            <>
              <button
                type="button"
                onClick={distribuirIgualmente}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Distribuir Igualmente
              </button>

              {totalPercentual !== 100 && totalPercentual > 0 && (
                <button
                  type="button"
                  onClick={normalizarPercentuais}
                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Normalizar 100%
                </button>
              )}
            </>
          )}
        </div>

        {!isPercentualValido && (
          <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-700">
            ⚠️ O total deve somar exatamente 100% para continuar
          </div>
        )}
      </div>
    </div>
  );
}