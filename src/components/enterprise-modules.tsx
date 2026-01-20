"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Package,
  Activity,
  BarChart3,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Info,
  Building,
  Search
} from 'lucide-react';
import AuditoriaDashboard from '@/components/auditoria-dashboard';
import ProvisionamentoDashboard from '@/components/provisionamento-dashboard';
import { EmpresaService, type Empresa } from '@/lib/empresa-service';

interface EnterpriseModulesProps {
  empresaId?: string;
  empresaNome?: string;
}

export default function EnterpriseModules({ 
  empresaId: initialEmpresaId,
  empresaNome: initialEmpresaNome
}: EnterpriseModulesProps) {
  const [activeModule, setActiveModule] = useState<'auditoria' | 'provisionamento'>('auditoria');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Use empresa selecionada ou valores iniciais
  const empresaId = selectedEmpresa?.id || initialEmpresaId || 'demo-empresa';
  const empresaNome = selectedEmpresa?.nome || initialEmpresaNome || 'Empresa Demo';

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        setIsLoadingEmpresas(true);
        const empresasList = await EmpresaService.getEmpresas();
        setEmpresas(empresasList);
        
        // Se temos um empresaId inicial, buscar a empresa correspondente
        if (initialEmpresaId && !selectedEmpresa) {
          const empresa = empresasList.find(e => e.id === initialEmpresaId);
          if (empresa) {
            setSelectedEmpresa(empresa);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      } finally {
        setIsLoadingEmpresas(false);
      }
    };
    
    loadEmpresas();
  }, [initialEmpresaId, selectedEmpresa]);

  const handleEmpresaChange = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    if (empresa) {
      setSelectedEmpresa(empresa);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com Seletor de Empresa */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Módulos Enterprise</h1>
          <p className="text-gray-500 mt-1">Auditoria e Provisionamento</p>
          
          {/* Seletor de Empresa */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-600" />
              <label htmlFor="empresa-select" className="text-sm font-medium text-gray-700">
                Empresa:
              </label>
            </div>
            <Select
              value={empresaId}
              onValueChange={handleEmpresaChange}
              disabled={isLoadingEmpresas}
            >
              <SelectTrigger className="w-64">
                <SelectValue 
                  placeholder={isLoadingEmpresas ? "Carregando..." : "Selecione uma empresa"}
                />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{empresa.nome}</span>
                      <Badge variant="outline" className="text-xs">
                        {empresa.codigo}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              <Info className="h-4 w-4 mr-2" />
              Como Funciona
            </Button>
          </div>
          
          {/* Informações da Empresa Selecionada */}
          {selectedEmpresa && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Empresa:</span>
                  <p className="font-medium">{selectedEmpresa.nome}</p>
                </div>
                <div>
                  <span className="text-gray-500">Código:</span>
                  <p className="font-medium">{selectedEmpresa.codigo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Indústria:</span>
                  <p className="font-medium">{selectedEmpresa.industria}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={selectedEmpresa.status === 'ativa' ? 'default' : 'secondary'}>
                    {selectedEmpresa.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Caixas Explicativas dos Módulos */}
      {showExplanation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Módulo de Auditoria</AlertTitle>
            <AlertDescription className="text-blue-700">
              <strong>O que faz:</strong> Monitora e analisa todas as atividades do sistema para garantir conformidade e segurança.<br/><br/>
              <strong>Funcionalidades principais:</strong><br/>
              • Rastreamento de ações de personas<br/>
              • Análise de compliance e conformidade<br/>
              • Relatórios de auditoria automáticos<br/>
              • Detecção de anomalias e riscos<br/>
              • Logs detalhados de segurança
            </AlertDescription>
          </Alert>
          
          <Alert className="border-purple-200 bg-purple-50">
            <Package className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">Módulo de Provisionamento</AlertTitle>
            <AlertDescription className="text-purple-700">
              <strong>O que faz:</strong> Gerencia a criação de packages de deployment e sincronização de dados entre sistemas.<br/><br/>
              <strong>Funcionalidades principais:</strong><br/>
              • Criação de packages personalizados<br/>
              • Sincronização bidirecionais de dados<br/>
              • Controle de versões e rollback<br/>
              • Deploy automatizado de personas<br/>
              • Gestão de conflitos de dados
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auditoria</p>
                <p className="text-2xl font-bold">97.5%</p>
                <p className="text-xs text-green-600">
                  Conformidade
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-blue-600">
                  Deployments ativos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sincronização</p>
                <p className="text-2xl font-bold">Ativa</p>
                <p className="text-xs text-green-600">
                  Últimos dados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-2xl font-bold">+12%</p>
                <p className="text-xs text-green-600">
                  vs mês anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Navigation */}
      <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as 'auditoria' | 'provisionamento')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auditoria" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Auditoria & Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="provisionamento" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Provisionamento & Sync</span>
          </TabsTrigger>
        </TabsList>

        {/* Auditoria Module */}
        <TabsContent value="auditoria" className="space-y-4">
          <AuditoriaDashboard empresaId={empresaId} empresaNome={empresaNome} />
        </TabsContent>

        {/* Provisionamento Module */}
        <TabsContent value="provisionamento" className="space-y-4">
          <ProvisionamentoDashboard empresaId={empresaId} empresaNome={empresaNome} />
        </TabsContent>
      </Tabs>
    </div>
  );
}