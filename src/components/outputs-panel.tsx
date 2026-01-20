'use client';

import { Loader2 } from 'lucide-react';

export function OutputsPanel() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Outputs Gerados</h3>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Arquivos Principais</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>personas_config.json</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>competencias_analysis.json</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>tech_specifications.json</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-bold text-blue-600">9</div>
              <div className="text-gray-600">Personas</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-bold text-green-600">69</div>
              <div className="text-gray-600">Competências</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center border-t pt-2">
        Sistema ARVATEST ativo
      </div>
    </div>
  );
}