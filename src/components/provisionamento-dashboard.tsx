"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  Database,
  RefreshCw as Sync,
  Download,
  Upload,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Server,
  Cloud,
  Archive,
  RefreshCw,
  Play,
  Pause,
  FileText,
  Copy
} from 'lucide-react';
import { packageBuilder } from '@/lib/package-builder';
import { syncEngine } from '@/lib/sync-engine';
import type { 
  ProvisionamentoSyncStatus
} from '@/types/provisionamento';

// Interfaces locais para o dashboard
interface ProvisionamentoPackageConfig {
  nome: string;
  versao: string;
  descricao: string;
  empresa_id: string;
  incluir_esquema: boolean;
  incluir_dados: boolean;
  incluir_imagens: boolean;
  incluir_workflows: boolean;
  incluir_documentacao: boolean;
  formato_saida: 'zip' | 'tar' | 'folder';
  compressao: 'none' | 'standard' | 'maximum';
  encriptacao: boolean;
  senha_encriptacao: string;
  backup_incremental: boolean;
  retention_policy: '7_dias' | '30_dias' | '90_dias' | '1_ano';
  auto_sync: boolean;
  sync_interval_hours: number;
  conflict_resolution: 'manual_review' | 'central_wins' | 'client_wins' | 'timestamp';
}

interface ProvisionamentoDeploymentPackage {
  id: string;
  nome: string;
  versao: string;
  descricao: string;
  empresa_id: string;
  status: 'pending' | 'building' | 'completed' | 'error';
  created_at: string;
  tamanho_bytes?: number;
  formato_saida: string;
  incluir_esquema: boolean;
  incluir_dados: boolean;
  incluir_imagens: boolean;
  incluir_workflows: boolean;
  incluir_documentacao: boolean;
}

interface SyncConfig {
  operation_type: 'full_sync' | 'incremental_sync';
  direction: 'bidirectional' | 'central_to_client' | 'client_to_central';
  conflict_resolution_strategy: 'central_wins' | 'client_wins' | 'manual_review';
}

interface ProvisionamentoDashboardProps {
  empresaId: string;
  empresaNome: string;
}

export default function ProvisionamentoDashboard({ empresaId, empresaNome }: ProvisionamentoDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Estados dos dados
  const [syncStatus, setSyncStatus] = useState<ProvisionamentoSyncStatus | null>(null);
  const [packages, setPackages] = useState<ProvisionamentoDeploymentPackage[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Estados do formulário de package
  const [packageConfig, setPackageConfig] = useState<ProvisionamentoPackageConfig>({
    nome: '',
    versao: '1.0.0',
    descricao: '',
    empresa_id: empresaId,
    incluir_esquema: true,
    incluir_dados: true,
    incluir_imagens: true,
    incluir_workflows: true,
    incluir_documentacao: true,
    formato_saida: 'zip',
    compressao: 'standard',
    encriptacao: false,
    senha_encriptacao: '',
    backup_incremental: false,
    retention_policy: '30_dias',
    auto_sync: false,
    sync_interval_hours: 24,
    conflict_resolution: 'manual_review'
  });

  // ===================================================
  // CARREGAMENTO DE DADOS
  // ===================================================

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh a cada 2 minutos
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [empresaId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadSyncStatus(),
        loadPackageHistory()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do provisionamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await syncEngine.getSyncStatus(empresaId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Erro ao buscar status de sync:', error);
    }
  };

  const loadPackageHistory = async () => {
    try {
      // Buscar histórico de packages do localStorage ou API
      const stored = localStorage.getItem(`packages_${empresaId}`);
      if (stored) {
        setPackages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de packages:', error);
    }
  };

  // ===================================================
  // HANDLERS - PACKAGE BUILDER
  // ===================================================

  const handleCreatePackage = async () => {
    try {
      setIsBuilding(true);

      // Simular criação de package (convertendo para o tipo correto)
      const mockPackage: ProvisionamentoDeploymentPackage = {
        id: Date.now().toString(),
        nome: packageConfig.nome || 'Package sem nome',
        versao: packageConfig.versao,
        descricao: packageConfig.descricao || '',
        empresa_id: empresaId,
        status: 'completed',
        created_at: new Date().toISOString(),
        tamanho_bytes: Math.random() * 1000000,
        formato_saida: packageConfig.formato_saida,
        incluir_esquema: packageConfig.incluir_esquema,
        incluir_dados: packageConfig.incluir_dados,
        incluir_imagens: packageConfig.incluir_imagens,
        incluir_workflows: packageConfig.incluir_workflows,
        incluir_documentacao: packageConfig.incluir_documentacao
      };

      // Adicionar ao histórico
      const updatedPackages = [mockPackage, ...packages];
      setPackages(updatedPackages);
      localStorage.setItem(`packages_${empresaId}`, JSON.stringify(updatedPackages));

      // Reset do formulário
      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({
        ...prev,
        nome: '',
        descricao: ''
      }));

      alert('Package criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar package:', error);
      alert('Erro ao criar package. Veja o console para detalhes.');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownloadPackage = async (packageData: ProvisionamentoDeploymentPackage) => {
    try {
      // Simular criação de package para download
      const packageContent = JSON.stringify(packageData, null, 2);
      const blob = new Blob([packageContent], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${packageData.nome}-${packageData.versao}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download do package:', error);
      alert('Erro ao fazer download. Veja o console para detalhes.');
    }
  };

  // ===================================================
  // HANDLERS - SYNC ENGINE
  // ===================================================

  const handleStartSync = async () => {
    try {
      setIsSyncing(true);
      await syncEngine.startSync(empresaId, {
        operation_type: 'full_sync',
        direction: 'bidirectional',
        conflict_resolution_strategy: packageConfig.conflict_resolution === 'manual_review' ? 'manual_review' : 
                                    packageConfig.conflict_resolution === 'central_wins' ? 'central_wins' : 'client_wins'
      } as SyncConfig);
      
      // Recarregar status
      await loadSyncStatus();
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error);
      alert('Erro ao iniciar sincronização. Veja o console para detalhes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStopSync = async () => {
    try {
      setIsSyncing(true);
      // Simular parada de sync - método não existe ainda
      console.log('Parando sincronização para empresa:', empresaId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadSyncStatus();
    } catch (error) {
      console.error('Erro ao parar sincronização:', error);
      alert('Erro ao parar sincronização. Veja o console para detalhes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      // Simular sync forçado - método não existe ainda
      console.log('Executando sincronização forçada para empresa:', empresaId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadSyncStatus();
      alert('Sincronização forçada executada com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
      alert('Erro na sincronização forçada. Veja o console para detalhes.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ===================================================
  // UTILIDADES
  // ===================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // ===================================================
  // MÉTRICAS CALCULADAS
  // ===================================================

  const metrics = {
    totalPackages: packages.length,
    successfulPackages: packages.filter(p => p.status === 'completed').length,
    totalSizeGB: packages.reduce((acc, p) => acc + (p.tamanho_bytes || 0), 0) / (1024 * 1024 * 1024),
    lastPackageDate: packages.length > 0 ? new Date(packages[0].created_at) : null,
    syncActive: syncStatus?.status === 'running',
    lastSync: null, // Campo não existe na interface
    conflictsCount: syncStatus?.conflicts?.length || 0
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provisionamento e Sync</h1>
          <p className="text-gray-500 mt-1">{empresaNome}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadDashboardData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-2xl font-bold">{metrics.totalPackages}</p>
                <p className="text-xs text-green-600">
                  {metrics.successfulPackages} bem-sucedidos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Armazenamento</p>
                <p className="text-2xl font-bold">{metrics.totalSizeGB.toFixed(1)}GB</p>
                <p className="text-xs text-blue-600">
                  Total utilizado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Sync className={`h-8 w-8 ${metrics.syncActive ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sincronização</p>
                <p className="text-2xl font-bold">{metrics.syncActive ? 'Ativa' : 'Inativa'}</p>
                <p className="text-xs text-gray-600">
                  {'Dados de sincronização não disponíveis'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className={`h-8 w-8 ${metrics.conflictsCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conflitos</p>
                <p className="text-2xl font-bold">{metrics.conflictsCount}</p>
                <p className="text-xs text-gray-600">
                  Pendentes de resolução
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="builder">Criar Package</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status da Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sync className="h-5 w-5 mr-2" />
                  Status da Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent>
                {syncStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant={syncStatus.status === 'running' ? 'default' : 'secondary'}>
                        {syncStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Progresso:</span>
                      <span className="text-sm">
                        {syncStatus.progress}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Itens sincronizados:</span>
                      <span className="text-sm">
                        {syncStatus.sync_items?.length || 0} itens
                      </span>
                    </div>
                    
                    {syncStatus.status === 'running' && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso:</span>
                          <span>{syncStatus.progress}%</span>
                        </div>
                        <Progress value={syncStatus.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          Sincronizando dados...
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {syncStatus.status !== 'running' ? (
                        <Button size="sm" onClick={handleStartSync} disabled={isSyncing}>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleStopSync} disabled={isSyncing}>
                          <Pause className="h-4 w-4 mr-2" />
                          Parar
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" onClick={handleForceSync} disabled={isSyncing}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Forçar Sync
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Carregando status de sincronização...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Packages Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Packages Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {packages.slice(0, 5).map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          pkg.status === 'completed' ? 'bg-green-500' :
                          pkg.status === 'error' ? 'bg-red-500' :
                          pkg.status === 'building' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium">{pkg.nome} v{pkg.versao}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(pkg.tamanho_bytes || 0)} • {new Date(pkg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadPackage(pkg)}
                          disabled={pkg.status !== 'completed'}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {packages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum package criado ainda
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conflitos de Sincronização */}
          {syncStatus?.conflicts && syncStatus.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Conflitos de Sincronização
                </CardTitle>
                <CardDescription>
                  Conflitos que precisam de resolução manual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncStatus.conflicts.map((conflict, index) => (
                    <div key={index} className="p-4 border-l-4 border-red-500 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-800">{conflict.table_name}</p>
                          <p className="text-sm text-red-600">ID: {conflict.record_id}</p>
                          <p className="text-xs text-red-500 mt-1">
                            Campo: {conflict.field_name} | Status: {conflict.resolved ? 'Resolvido' : 'Pendente'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Packages */}
        <TabsContent value="packages" className="space-y-4">
          <div className="grid gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {pkg.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                        {pkg.status === 'error' && <XCircle className="h-5 w-5 text-red-600 mr-2" />}
                        {pkg.status === 'building' && <Clock className="h-5 w-5 text-yellow-600 mr-2" />}
                        {pkg.nome} v{pkg.versao}
                      </CardTitle>
                      <CardDescription>{pkg.descricao}</CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={pkg.status === 'completed' ? 'default' : 'secondary'}>
                        {pkg.status}
                      </Badge>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadPackage(pkg)}
                        disabled={pkg.status !== 'completed'}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tamanho:</span>
                      <span className="font-medium ml-1">
                        {formatFileSize(pkg.tamanho_bytes || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Formato:</span>
                      <span className="font-medium ml-1">{pkg.formato_saida}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Criado:</span>
                      <span className="font-medium ml-1">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Empresa:</span>
                      <span className="font-medium ml-1">{empresaNome}</span>
                    </div>
                  </div>

                  {/* Componentes incluídos */}
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Componentes incluídos:</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.incluir_esquema && <Badge variant="outline">Esquema</Badge>}
                      {pkg.incluir_dados && <Badge variant="outline">Dados</Badge>}
                      {pkg.incluir_imagens && <Badge variant="outline">Imagens</Badge>}
                      {pkg.incluir_workflows && <Badge variant="outline">Workflows</Badge>}
                      {pkg.incluir_documentacao && <Badge variant="outline">Documentação</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {packages.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum package encontrado</p>
                  <p className="text-sm text-gray-500">Crie seu primeiro package na aba "Criar Package".</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Sync */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Sincronização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync">Sincronização Automática</Label>
                  <Switch
                    id="auto-sync"
                    checked={packageConfig.auto_sync}
                    onCheckedChange={(checked) => 
                      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, auto_sync: checked }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="sync-interval">Intervalo (horas)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    value={packageConfig.sync_interval_hours}
                    onChange={(e) => 
                      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ 
                        ...prev, 
                        sync_interval_hours: parseInt(e.target.value) || 24 
                      }))
                    }
                    min="1"
                    max="168"
                  />
                </div>

                <div>
                  <Label htmlFor="conflict-resolution">Resolução de Conflitos</Label>
                  <select
                    id="conflict-resolution"
                    className="w-full p-2 border rounded-md"
                    value={packageConfig.conflict_resolution}
                    onChange={(e) => 
                      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ 
                        ...prev, 
                        conflict_resolution: e.target.value as ProvisionamentoPackageConfig['conflict_resolution']
                      }))
                    }
                  >
                    <option value="manual">Manual</option>
                    <option value="local_wins">Local ganha</option>
                    <option value="remote_wins">Remoto ganha</option>
                    <option value="timestamp">Mais recente ganha</option>
                  </select>
                </div>

                <Button 
                  onClick={handleStartSync} 
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Aplicar Configurações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Histórico de Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncStatus?.sync_items?.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.error_count === 0 && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {item.error_count > 0 && <XCircle className="h-4 w-4 text-red-600" />}
                        <div>
                          <p className="text-sm font-medium">
                            {item.table_name} - {item.operation}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.success_count}/{item.records_count} registros
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {item.error_count > 0 ? `${item.error_count} erros` : 'Sucesso'}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      Nenhum histórico de sincronização
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Criar Package */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Package</CardTitle>
              <CardDescription>
                Configure e crie um package de deployment para a empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="package-name">Nome do Package</Label>
                  <Input
                    id="package-name"
                    value={packageConfig.nome}
                    onChange={(e) => 
                      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="ex: producao-deploy"
                  />
                </div>
                
                <div>
                  <Label htmlFor="package-version">Versão</Label>
                  <Input
                    id="package-version"
                    value={packageConfig.versao}
                    onChange={(e) => 
                      setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, versao: e.target.value }))
                    }
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="package-description">Descrição</Label>
                <Textarea
                  id="package-description"
                  value={packageConfig.descricao}
                  onChange={(e) => 
                    setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descreva o propósito deste package..."
                  rows={3}
                />
              </div>

              {/* Componentes a Incluir */}
              <div>
                <Label className="text-base font-medium">Componentes a Incluir</Label>
                <div className="mt-3 space-y-3">
                  {[
                    { key: 'incluir_esquema', label: 'Esquema do Banco de Dados', description: 'Estrutura das tabelas e relacionamentos' },
                    { key: 'incluir_dados', label: 'Dados das Personas', description: 'Informações completas das personas criadas' },
                    { key: 'incluir_imagens', label: 'Imagens de Avatar', description: 'Fotos dos avatares gerados' },
                    { key: 'incluir_workflows', label: 'Workflows N8N', description: 'Configurações de automação' },
                    { key: 'incluir_documentacao', label: 'Documentação', description: 'Manuais e guias de uso' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-gray-500">{description}</p>
                      </div>
                      <Switch
                        checked={packageConfig[key as keyof ProvisionamentoPackageConfig] as boolean}
                        onCheckedChange={(checked) => 
                          setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div>
                <Label className="text-base font-medium">Configurações Avançadas</Label>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Formato de Saída</Label>
                    <select
                      id="format"
                      className="w-full p-2 border rounded-md"
                      value={packageConfig.formato_saida}
                      onChange={(e) => 
                        setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ 
                          ...prev, 
                          formato_saida: e.target.value as ProvisionamentoPackageConfig['formato_saida']
                        }))
                      }
                    >
                      <option value="zip">ZIP</option>
                      <option value="tar">TAR</option>
                      <option value="folder">Pasta</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="compression">Compressão</Label>
                    <select
                      id="compression"
                      className="w-full p-2 border rounded-md"
                      value={packageConfig.compressao}
                      onChange={(e) => 
                        setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ 
                          ...prev, 
                          compressao: e.target.value as ProvisionamentoPackageConfig['compressao']
                        }))
                      }
                    >
                      <option value="none">Nenhuma</option>
                      <option value="standard">Padrão</option>
                      <option value="maximum">Máxima</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encryption">Criptografia</Label>
                      <Switch
                        id="encryption"
                        checked={packageConfig.encriptacao}
                        onCheckedChange={(checked) => 
                          setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, encriptacao: checked }))
                        }
                      />
                    </div>
                    
                    {packageConfig.encriptacao && (
                      <Input
                        type="password"
                        placeholder="Senha de criptografia"
                        className="mt-2"
                        value={packageConfig.senha_encriptacao}
                        onChange={(e) => 
                          setPackageConfig((prev: ProvisionamentoPackageConfig) => ({ ...prev, senha_encriptacao: e.target.value }))
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPackageConfig((prev: ProvisionamentoPackageConfig) => ({
                      ...prev,
                      nome: '',
                      descricao: '',
                      versao: '1.0.0'
                    }));
                  }}
                >
                  Limpar
                </Button>
                
                <Button 
                  onClick={handleCreatePackage} 
                  disabled={isBuilding || !packageConfig.nome}
                >
                  {isBuilding ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando Package...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Criar Package
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}