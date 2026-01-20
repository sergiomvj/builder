'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Mail, AlertTriangle, Loader2 } from 'lucide-react';

interface FixEmailsButtonProps {
  empresaId: string;
  dominio?: string;
  onSuccess?: () => void;
}

export function FixEmailsButton({ empresaId, dominio, onSuccess }: FixEmailsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFixEmails = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/empresas/${empresaId}/fix-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao corrigir emails');
      }

      setResult(data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao corrigir emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Correção de Emails
          </CardTitle>
          <CardDescription>
            Atualiza os emails de todas as personas para usar o domínio configurado: 
            <span className="font-mono font-semibold"> @{dominio || 'domínio da empresa'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Quando usar esta ferramenta:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Após alterar o domínio da empresa</li>
                  <li>Se os emails estiverem com domínios incorretos</li>
                  <li>Para padronizar todos os emails da equipe</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleFixEmails} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigindo emails...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Corrigir Todos os Emails
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {result.message}
                </AlertDescription>
              </Alert>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-base">📊 Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Total de personas:</p>
                      <p className="text-xl font-bold">{result.stats.total}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Emails atualizados:</p>
                      <p className="text-xl font-bold text-green-600">{result.stats.atualizados}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Alterados:</p>
                      <p className="text-xl font-bold text-blue-600">{result.stats.alterados}</p>
                    </div>
                    {result.stats.erros > 0 && (
                      <div>
                        <p className="text-slate-600">Erros:</p>
                        <p className="text-xl font-bold text-red-600">{result.stats.erros}</p>
                      </div>
                    )}
                    {result.stats.semNome > 0 && (
                      <div>
                        <p className="text-slate-600">Sem nome:</p>
                        <p className="text-xl font-bold text-amber-600">{result.stats.semNome}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {result.alteracoes && result.alteracoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📝 Alterações Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {result.alteracoes.map((alt: any, idx: number) => (
                        <div key={idx} className="border-b pb-3 last:border-b-0">
                          <p className="font-semibold text-sm">{alt.role}</p>
                          <p className="text-xs text-slate-600 mb-1">{alt.name}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-red-600 line-through">
                              {alt.oldEmail || 'sem email'}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="text-green-600 font-mono">
                              {alt.newEmail}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Domínio aplicado:</strong> <span className="font-mono">@{result.dominio}</span>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
