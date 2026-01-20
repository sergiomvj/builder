'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Eye, 
  Database,
  Workflow,
  Brain,
  Cog,
  GitBranch,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ScriptOutput {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'success' | 'error' | 'pending';
  files: {
    name: string;
    path: string;
    size?: string;
    type: 'json' | 'md' | 'sql' | 'txt';
    description: string;
  }[];
  summary?: {
    processed_items: number;
    execution_time: number;
    success_rate: number;
  };
}

export function NodeJSOutputsPanel() {
  const [empresaCodigo, setEmpresaCodigo] = useState('LIFEWAY');
  const [outputs, setOutputs] = useState<ScriptOutput[]>([
    {
      id: 'competencias',
      name: 'Script 1 - Competências',
      icon: <Brain className="h-4 w-4" />,
      status: 'success',
      files: [
        {
          name: 'competencias_analysis.json',
          path: '/output/EMPRESA_LIFEWAY/competencias_analysis.json',
          size: '45.2 KB',
          type: 'json',
          description: 'Análise consolidada de competências de todas as personas'
        },
        {
          name: 'competencias_core.json (por persona)',
          path: '/output/EMPRESA_LIFEWAY/04_PERSONAS_SCRIPTS_1_2_3/.../script1_competencias/',
          size: '~2-5 KB cada',
          type: 'json',
          description: 'Competências específicas de cada persona individual'
        }
      ],
      summary: {
        processed_items: 20,
        execution_time: 12.5,
        success_rate: 100
      }
    },
    {
      id: 'tech-specs',
      name: 'Script 2 - Tech Specs',
      icon: <Cog className="h-4 w-4" />,
      status: 'success',
      files: [
        {
          name: 'tech_specifications.json',
          path: '/output/EMPRESA_LIFEWAY/tech_specifications.json',
          size: '67.8 KB',
          type: 'json',
          description: 'Especificações técnicas consolidadas do sistema'
        },
        {
          name: 'tech_specs_core.json (por persona)',
          path: '/output/EMPRESA_LIFEWAY/04_PERSONAS_SCRIPTS_1_2_3/.../script2_techspecs/',
          size: '~3-7 KB cada',
          type: 'json',
          description: 'Especificações técnicas específicas por persona'
        }
      ],
      summary: {
        processed_items: 6,
        execution_time: 8.3,
        success_rate: 100
      }
    },
    {
      id: 'rag-database',
      name: 'Script 3 - RAG Database',
      icon: <Database className="h-4 w-4" />,
      status: 'success',
      files: [
        {
          name: 'rag_knowledge_base.json',
          path: '/output/EMPRESA_LIFEWAY/rag_knowledge_base.json',
          size: '156.4 KB',
          type: 'json',
          description: 'Base de conhecimento completa para busca semântica'
        },
        {
          name: 'rag_knowledge.json (por persona)',
          path: '/output/EMPRESA_LIFEWAY/04_PERSONAS_SCRIPTS_1_2_3/.../script3_rag/',
          size: '~8-15 KB cada',
          type: 'json',
          description: 'Contextos RAG específicos de cada persona'
        }
      ],
      summary: {
        processed_items: 1,
        execution_time: 15.7,
        success_rate: 100
      }
    },
    {
      id: 'fluxos-analise',
      name: 'Script 4 - Análise Fluxos',
      icon: <GitBranch className="h-4 w-4" />,
      status: 'success',
      files: [
        {
          name: 'fluxos_analise_completa.json',
          path: '/output/EMPRESA_LIFEWAY/fluxos_analise_completa.json',
          size: '89.3 KB',
          type: 'json',
          description: 'Análise completa de processos e colaborações'
        },
        {
          name: 'fluxos_analise.json (por persona)',
          path: '/output/EMPRESA_LIFEWAY/04_PERSONAS_SCRIPTS_1_2_3/.../script4_fluxos/',
          size: '~5-12 KB cada',
          type: 'json',
          description: 'Análise de fluxos específica por persona'
        }
      ],
      summary: {
        processed_items: 18,
        execution_time: 22.1,
        success_rate: 100
      }
    },
    {
      id: 'workflows-n8n',
      name: 'Script 5 - Workflows N8N',
      icon: <Workflow className="h-4 w-4" />,
      status: 'success',
      files: [
        {
          name: 'n8n_workflows_completo.json',
          path: '/output/EMPRESA_LIFEWAY/n8n_workflows_completo.json',
          size: '234.7 KB',
          type: 'json',
          description: 'Resultado consolidado de todos os workflows'
        },
        {
          name: 'Workflows N8N (individuais)',
          path: '/output/EMPRESA_LIFEWAY/06_N8N_WORKFLOWS/',
          size: '~15-30 KB cada',
          type: 'json',
          description: 'Workflows N8N executáveis por especialidade'
        },
        {
          name: 'IMPLEMENTACAO.md',
          path: '/output/EMPRESA_LIFEWAY/06_N8N_WORKFLOWS/IMPLEMENTACAO.md',
          size: '12.4 KB',
          type: 'md',
          description: 'Documentação completa de implementação'
        }
      ],
      summary: {
        processed_items: 12,
        execution_time: 18.9,
        success_rate: 100
      }
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'json':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'md':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownloadFile = (file: any) => {
    console.log('Download:', file.path);
    // Em produção, implementar download real
    alert(`Download simulado: ${file.name}`);
  };

  const handleViewFile = (file: any) => {
    console.log('Visualizar:', file.path);
    // Em produção, implementar visualização real
    alert(`Visualização simulada: ${file.name}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Outputs dos Scripts Node.js
          </div>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardTitle>
        <CardDescription>
          Resultados e arquivos gerados pelos scripts de processamento
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="files">Arquivos Gerados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Scripts Executados</p>
                      <p className="text-2xl font-bold text-green-600">5/5</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tempo Total</p>
                      <p className="text-2xl font-bold text-blue-600">77.5s</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Arquivos Gerados</p>
                      <p className="text-2xl font-bold text-purple-600">25+</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status dos Scripts */}
            <div className="space-y-3">
              {outputs.map((output) => (
                <div key={output.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {output.icon}
                      <div>
                        <h4 className="font-medium">{output.name}</h4>
                        {output.summary && (
                          <p className="text-sm text-gray-600">
                            {output.summary.processed_items} itens processados em {output.summary.execution_time}s
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(output.status)}
                      {getStatusBadge(output.status)}
                    </div>
                  </div>
                  
                  {output.summary && (
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Itens:</span> {output.summary.processed_items}
                      </div>
                      <div>
                        <span className="text-gray-600">Tempo:</span> {output.summary.execution_time}s
                      </div>
                      <div>
                        <span className="text-gray-600">Taxa Sucesso:</span> {output.summary.success_rate}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="space-y-6">
              {outputs.map((output) => (
                <div key={output.id}>
                  <div className="flex items-center gap-2 mb-3">
                    {output.icon}
                    <h3 className="font-semibold">{output.name}</h3>
                    {getStatusBadge(output.status)}
                  </div>
                  
                  <div className="grid gap-2">
                    {output.files.map((file, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-gray-600">{file.description}</p>
                              <p className="text-xs text-gray-500">{file.size} • {file.path}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewFile(file)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Informações Adicionais */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Localização dos arquivos:</strong> Os outputs são salvos em{' '}
              <code className="bg-blue-100 px-1 rounded">
                output/EMPRESA_{empresaCodigo.toUpperCase()}/
              </code>{' '}
              com estrutura organizada por script e persona.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}