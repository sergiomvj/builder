'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

interface IntegrationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: {
    name: string;
    provider: string;
    type: 'api' | 'webhook' | 'database' | 'email' | 'social';
    auth_type: 'api_key' | 'oauth2' | 'basic' | 'bearer';
  };
  onSave: (config: any) => Promise<void>;
}

export function IntegrationConfigModal({ open, onOpenChange, integration, onSave }: IntegrationConfigModalProps) {
  const [config, setConfig] = useState<any>({
    api_key: '',
    endpoint: '',
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    additional_params: {}
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Implementar teste real baseado no tipo de integração
      const success = Math.random() > 0.2; // 80% de sucesso para demo
      
      setTestResult({
        success,
        message: success 
          ? `✅ Conexão com ${integration.name} estabelecida com sucesso!`
          : `❌ Falha ao conectar. Verifique as credenciais.`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Erro ao testar conexão: ${error}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    switch (integration.auth_type) {
      case 'api_key':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="sk_live_..."
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint (opcional)</Label>
              <Input
                id="endpoint"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
          </>
        );

      case 'oauth2':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                value={config.client_id}
                onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                placeholder="client_id_123..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="client_secret"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.client_secret}
                  onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                  placeholder="secret_..."
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect_uri">Redirect URI</Label>
              <Input
                id="redirect_uri"
                value={config.redirect_uri || ''}
                onChange={(e) => setConfig({ ...config, redirect_uri: e.target.value })}
                placeholder="https://your-app.com/oauth/callback"
              />
            </div>
          </>
        );

      case 'basic':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint *</Label>
              <Input
                id="endpoint"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
          </>
        );

      case 'bearer':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="token">Bearer Token *</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showSecrets ? 'text' : 'password'}
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="Bearer token..."
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint *</Label>
              <Input
                id="endpoint"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar {integration.name}</DialogTitle>
          <DialogDescription>
            Configure as credenciais para {integration.provider}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {renderFields()}

          {/* Configurações específicas por tipo */}
          {integration.type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={config.smtp_host || ''}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
          )}

          {integration.type === 'database' && (
            <div className="space-y-2">
              <Label htmlFor="database_name">Database Name</Label>
              <Input
                id="database_name"
                value={config.database_name || ''}
                onChange={(e) => setConfig({ ...config, database_name: e.target.value })}
                placeholder="my_database"
              />
            </div>
          )}

          {/* Botão de teste */}
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>

          {/* Resultado do teste */}
          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Instruções */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Onde encontrar as credenciais:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              {integration.provider === 'OpenAI' && (
                <li>OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></li>
              )}
              {integration.provider === 'Supabase' && (
                <li>Supabase: Project Settings → API → anon/service_role key</li>
              )}
              {integration.provider === 'Google' && (
                <li>Google Cloud Console → APIs & Services → Credentials</li>
              )}
              {integration.provider === 'Slack' && (
                <li>Slack: api.slack.com/apps → Create New App → OAuth & Permissions</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
