'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NodeJSScriptsPanel } from './nodejs-scripts-panel';
import { NodeJSOutputsPanel } from './nodejs-outputs-panel';
import { NodeJSMonitor } from './nodejs-monitor';
import { QuickCascadePanel } from './quick-cascade-panel';
import { NodeJSStats } from './nodejs-stats';
import { PlayCircle, Zap, Settings, Info, Monitor } from 'lucide-react';

export function ScriptsNodeJSPage() {
  const [activeSection, setActiveSection] = useState<'scripts' | 'outputs' | 'monitor'>('scripts');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Scripts Node.js</h1>
        <p className="text-green-100 text-lg">
          Sistema de automação completo para geração de personas e empresas virtuais
        </p>
      </div>

      {/* Status Cards */}
      <NodeJSStats />

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        <Button
          variant={activeSection === 'scripts' ? 'default' : 'outline'}
          onClick={() => setActiveSection('scripts')}
          className="flex items-center space-x-2"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Executar Scripts</span>
        </Button>
        
        <Button
          variant={activeSection === 'monitor' ? 'default' : 'outline'}
          onClick={() => setActiveSection('monitor')}
          className="flex items-center space-x-2"
        >
          <Monitor className="h-4 w-4" />
          <span>Monitor</span>
        </Button>
        
        <Button
          variant={activeSection === 'outputs' ? 'default' : 'outline'}
          onClick={() => setActiveSection('outputs')}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Ver Outputs</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Quick Cascade - Always Visible */}
        <QuickCascadePanel />
        
        {activeSection === 'scripts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5" />
                <span>Painel de Execução Individual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NodeJSScriptsPanel />
            </CardContent>
          </Card>
        )}

        {activeSection === 'monitor' && (
          <NodeJSMonitor />
        )}

        {activeSection === 'outputs' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Resultados e Arquivos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NodeJSOutputsPanel />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Scripts Node.js Disponíveis</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Cascata Principal (Scripts 1-5):</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>01_generate_competencias.js - Análise de competências</li>
                  <li>02_generate_tech_specs.js - Especificações técnicas</li>
                  <li>03_generate_rag.js - Base de conhecimento RAG</li>
                  <li>04_generate_fluxos_analise.js - Análise de fluxos</li>
                  <li>05_generate_workflows_n8n.js - Workflows N8N</li>
                </ul>
                <p><strong>Utilitários:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>05_auto_biografia_generator.js - Gerador de biografias</li>
                  <li>api_bridge.js - Ponte de API para integrações</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}