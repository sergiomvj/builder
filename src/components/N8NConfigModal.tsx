import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface N8NConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: { url: string; apiKey: string }) => void;
  initialConfig?: { url: string; apiKey: string };
}

export function N8NConfigModal({ open, onOpenChange, onSave, initialConfig }: N8NConfigModalProps) {
  const [url, setUrl] = useState(initialConfig?.url || '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!url || !apiKey) {
      setTestResult({
        success: false,
        message: 'Preencha URL e API Key antes de testar'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/n8n/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey })
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `✅ ${data.message}${data.version ? ` (v${data.version})` : ''}`
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erro de conexão: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url || !apiKey) {
      setTestResult({
        success: false,
        message: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({ url, apiKey });
      onOpenChange(false);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Erro ao salvar: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar N8N</DialogTitle>
          <DialogDescription>
            Configure a conexão com sua instância N8N para automação de workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="n8n-url">
              N8N Instance URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="n8n-url"
              type="url"
              placeholder="https://seu-n8n.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              URL completa da sua instância N8N (sem barra final)
            </p>
          </div>

          {/* API Key */}
          <div className="grid gap-2">
            <Label htmlFor="n8n-api-key">
              API Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="n8n-api-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="n8n_api_xxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Obtenha em: Settings → API → Create API Key
            </p>
          </div>

          {/* Botão de Teste */}
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !url || !apiKey}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando conexão...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>

          {/* Resultado do Teste */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="ml-2">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Instruções */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">💡 Como obter API Key:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse seu N8N</li>
              <li>Vá em Settings → API</li>
              <li>Clique em "Create API Key"</li>
              <li>Copie a key e cole acima</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !url || !apiKey}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configuração'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
