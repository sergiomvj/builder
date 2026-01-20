'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    const tests: any[] = [];

    // Teste 1: Variáveis de ambiente
    tests.push({
      name: 'Variáveis de Ambiente',
      status: 'running',
      message: 'Verificando...'
    });
    setResults([...tests]);

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    tests[0] = {
      name: 'Variáveis de Ambiente',
      status: hasUrl && hasKey ? 'success' : 'error',
      message: hasUrl && hasKey 
        ? `URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...` 
        : 'Variáveis não configuradas'
    };
    setResults([...tests]);

    if (!hasUrl || !hasKey) {
      setRunning(false);
      return;
    }

    // Teste 2: Importar Supabase
    tests.push({
      name: 'Importar Supabase Client',
      status: 'running',
      message: 'Carregando...'
    });
    setResults([...tests]);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      tests[1] = {
        name: 'Importar Supabase Client',
        status: 'success',
        message: 'Cliente criado com sucesso'
      };
      setResults([...tests]);

      // Teste 3: Buscar empresas
      tests.push({
        name: 'Buscar Empresas',
        status: 'running',
        message: 'Consultando...'
      });
      setResults([...tests]);

      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, status')
        .eq('status', 'ativa');

      if (empresasError) {
        tests[2] = {
          name: 'Buscar Empresas',
          status: 'error',
          message: `Erro: ${empresasError.message}`,
          details: empresasError
        };
      } else {
        tests[2] = {
          name: 'Buscar Empresas',
          status: 'success',
          message: `${empresas?.length || 0} empresas encontradas`,
          data: empresas
        };
      }
      setResults([...tests]);

      // Teste 4: Buscar personas SEM join
      tests.push({
        name: 'Buscar Personas (sem join)',
        status: 'running',
        message: 'Consultando...'
      });
      setResults([...tests]);

      const { data: personasSemJoin, error: errorSemJoin } = await supabase
        .from('personas')
        .select('*')
        .limit(5);

      if (errorSemJoin) {
        tests[3] = {
          name: 'Buscar Personas (sem join)',
          status: 'error',
          message: `Erro: ${errorSemJoin.message}`,
          details: errorSemJoin
        };
      } else {
        tests[3] = {
          name: 'Buscar Personas (sem join)',
          status: 'success',
          message: `${personasSemJoin?.length || 0} personas encontradas`,
          data: personasSemJoin
        };
      }
      setResults([...tests]);

      // Teste 5: Buscar personas COM inner join
      tests.push({
        name: 'Buscar Personas (com inner join)',
        status: 'running',
        message: 'Consultando...'
      });
      setResults([...tests]);

      const { data: personasComJoin, error: errorComJoin } = await supabase
        .from('personas')
        .select(`
          *,
          empresas!inner(id, nome, status)
        `)
        .eq('empresas.status', 'ativa')
        .limit(5);

      if (errorComJoin) {
        tests[4] = {
          name: 'Buscar Personas (com inner join)',
          status: 'error',
          message: `Erro: ${errorComJoin.message}`,
          details: errorComJoin
        };
      } else {
        tests[4] = {
          name: 'Buscar Personas (com inner join)',
          status: 'success',
          message: `${personasComJoin?.length || 0} personas encontradas`,
          data: personasComJoin
        };
      }
      setResults([...tests]);

      // Teste 6: Buscar ARVA Tech
      tests.push({
        name: 'Buscar ARVA Tech personas',
        status: 'running',
        message: 'Consultando...'
      });
      setResults([...tests]);

      const arvaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
      const { data: personasArva, error: errorArva } = await supabase
        .from('personas')
        .select(`
          *,
          empresas!inner(id, nome)
        `)
        .eq('empresa_id', arvaId);

      if (errorArva) {
        tests[5] = {
          name: 'Buscar ARVA Tech personas',
          status: 'error',
          message: `Erro: ${errorArva.message}`,
          details: errorArva
        };
      } else {
        tests[5] = {
          name: 'Buscar ARVA Tech personas',
          status: 'success',
          message: `${personasArva?.length || 0} personas encontradas`,
          data: personasArva
        };
      }
      setResults([...tests]);

    } catch (err: any) {
      tests.push({
        name: 'Erro Geral',
        status: 'error',
        message: err.message,
        details: err
      });
      setResults([...tests]);
    }

    setRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnóstico de Conexão - Personas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              'Rodar Diagnóstico Novamente'
            )}
          </Button>

          <div className="space-y-3">
            {results.map((test, index) => (
              <Alert key={index} variant={test.status === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-3">
                  {test.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {test.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {test.status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
                  
                  <div className="flex-1">
                    <div className="font-semibold">{test.name}</div>
                    <AlertDescription className="mt-1">
                      {test.message}
                    </AlertDescription>
                    
                    {test.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {test.data && test.data.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Ver dados ({test.data.length} registros)
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
