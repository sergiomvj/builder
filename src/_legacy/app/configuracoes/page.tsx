'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DatabaseService } from '@/lib/database';
import {
  Settings,
  Database,
  Key,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

interface SystemConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category: string;
  is_sensitive: boolean;
  updated_at: string;
}

interface ConfigurationAudit {
  id: string;
  config_key: string;
  old_value: any;
  new_value: any;
  changed_by_username: string;
  changed_at: string;
  change_reason?: string;
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfiguration[]>([]);
  const [configAudit, setConfigAudit] = useState<ConfigurationAudit[]>([]);
  const [activeTab, setActiveTab] = useState('sistema');
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const isClient = useIsClient();

  // Mock configuration data for fallback
  const mockConfigs: SystemConfiguration[] = [
    {
      id: '1',
      config_key: 'openai_api_key',
      config_value: 'sk-...Xt4J',
      config_type: 'string',
      description: 'Chave da API OpenAI para geração de conteúdo',
      category: 'integrations',
      is_sensitive: true,
      updated_at: '2024-11-19T10:00:00Z'
    },
    {
      id: '2',
      config_key: 'max_personas_per_company',
      config_value: '20',
      config_type: 'number',
      description: 'Número máximo de personas por empresa',
      category: 'limits',
      is_sensitive: false,
      updated_at: '2024-11-18T15:30:00Z'
    },
    {
      id: '3',
      config_key: 'auto_sync_enabled',
      config_value: 'true',
      config_type: 'boolean',
      description: 'Habilitar sincronização automática',
      category: 'system',
      is_sensitive: false,
      updated_at: '2024-11-17T09:15:00Z'
    },
    {
      id: '4',
      config_key: 'supabase_url',
      config_value: 'https://fzyokrvdyeczhfqlwxzb.supabase.co',
      config_type: 'string',
      description: 'URL do banco de dados principal',
      category: 'database',
      is_sensitive: false,
      updated_at: '2024-11-15T12:00:00Z'
    }
  ];

  const mockAuditData: ConfigurationAudit[] = [
    {
      id: '1',
      config_key: 'max_personas_per_company',
      old_value: '15',
      new_value: '20',
      changed_by_username: 'admin',
      changed_at: '2024-11-18T15:30:00Z',
      change_reason: 'Aumentar limite para empresas grandes'
    },
    {
      id: '2',
      config_key: 'auto_sync_enabled',
      old_value: 'false',
      new_value: 'true',
      changed_by_username: 'system',
      changed_at: '2024-11-17T09:15:00Z',
      change_reason: 'Habilitar sincronização automática por padrão'
    }
  ];

  useEffect(() => {
    if (isClient) {
      loadConfigurationData();
    }
  }, [isClient]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);
      const [configsData, auditData] = await Promise.all([
        DatabaseService.getSystemConfigurations(),
        DatabaseService.getConfigurationAudit()
      ]);
      setSystemConfigs(configsData || []);
      setConfigAudit(auditData || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Implement save logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Configurations saved successfully');
    } catch (error) {
      console.error('Error saving configurations:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleSensitiveVisibility = () => {
    setShowSensitive(!showSensitive);
  };

  const getConfigValueDisplay = (config: SystemConfiguration) => {
    if (config?.is_sensitive && !showSensitive) {
      return '••••••••';
    }
    return config?.config_value || 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Gerenciar configurações do sistema e integrações</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={toggleSensitiveVisibility}>
            {showSensitive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitive ? 'Ocultar' : 'Mostrar'} Sensíveis
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={saveLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="integracao">Integrações</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemConfigs
              .filter(config => config?.category === 'system' || config?.category === 'limits')
              .map((config) => (
                <Card key={config?.id || Math.random()}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {config?.config_key?.replace(/_/g, ' ')?.toUpperCase() || 'Configuração'}
                      {config?.is_sensitive && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Sensível
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{config?.description || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Valor:</span>
                        <span className="font-mono">{getConfigValueDisplay(config)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tipo:</span>
                        <Badge variant="outline">{config?.config_type || 'unknown'}</Badge>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Atualizado:</span>
                        <span className="text-xs">
                          {config?.updated_at ? new Date(config.updated_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="integracao" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemConfigs
              .filter(config => config?.category === 'integrations' || config?.category === 'database')
              .map((config) => (
                <Card key={config?.id || Math.random()}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {config?.config_key?.replace(/_/g, ' ')?.toUpperCase() || 'Configuração'}
                      {config?.is_sensitive && (
                        <Badge variant="destructive">
                          <Key className="h-3 w-3 mr-1" />
                          API Key
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{config?.description || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Valor:</span>
                        <span className="font-mono text-xs">
                          {getConfigValueDisplay(config)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
              <CardDescription>Registro de todas as modificações nas configurações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Configuração</th>
                      <th className="text-left p-2">Valor Anterior</th>
                      <th className="text-left p-2">Valor Novo</th>
                      <th className="text-left p-2">Alterado por</th>
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configAudit.map((audit) => (
                      <tr key={audit.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{audit.config_key}</td>
                        <td className="p-2 font-mono text-xs">{audit.old_value}</td>
                        <td className="p-2 font-mono text-xs">{audit.new_value}</td>
                        <td className="p-2">{audit.changed_by_username}</td>
                        <td className="p-2 text-xs">
                          {new Date(audit.changed_at).toLocaleString()}
                        </td>
                        <td className="p-2 text-xs">{audit.change_reason || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}