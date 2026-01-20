'use client';

import { useEffect, useState } from 'react';

export default function DebugPanel() {
  const [envVars, setEnvVars] = useState<Record<string, any>>({});
  const [apiTests, setApiTests] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      // 1. Test Environment Variables
      const env = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        window_location: typeof window !== 'undefined' ? window.location.href : 'SSR',
      };
      setEnvVars(env);

      // 2. Test Local APIs
      const tests: Record<string, any> = {};
      
      try {
        console.log('[DEBUG] Testing /api/health...');
        const healthResponse = await fetch('/api/health');
        tests.health = {
          status: healthResponse.status,
          ok: healthResponse.ok,
          data: await healthResponse.json()
        };
      } catch (error: any) {
        tests.health = { error: error.message };
      }

      try {
        console.log('[DEBUG] Testing /api/status...');
        const statusResponse = await fetch('/api/status');
        tests.status = {
          status: statusResponse.status,
          ok: statusResponse.ok,
          data: await statusResponse.json()
        };
      } catch (error: any) {
        tests.status = { error: error.message };
      }

      try {
        console.log('[DEBUG] Testing /api/outputs...');
        const outputsResponse = await fetch('/api/outputs');
        tests.outputs = {
          status: outputsResponse.status,
          ok: outputsResponse.ok,
          data: await outputsResponse.json()
        };
      } catch (error: any) {
        tests.outputs = { error: error.message };
      }

      setApiTests(tests);
      setLoading(false);
    }

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-900">🔍 Executando Diagnósticos...</h3>
        <p className="text-blue-700">Testando APIs e variáveis de ambiente...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
      <h3 className="text-lg font-bold text-gray-900">🔍 Debug Panel - VPS vs Local</h3>
      
      {/* Environment Variables */}
      <div>
        <h4 className="font-semibold text-gray-800">Environment Variables:</h4>
        <pre className="text-xs bg-white p-2 border rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      {/* API Tests */}
      <div>
        <h4 className="font-semibold text-gray-800">API Tests:</h4>
        <pre className="text-xs bg-white p-2 border rounded overflow-auto max-h-40">
          {JSON.stringify(apiTests, null, 2)}
        </pre>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className={`p-2 rounded text-center ${apiTests.health?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Health: {apiTests.health?.ok ? '✅' : '❌'}
        </div>
        <div className={`p-2 rounded text-center ${apiTests.status?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Status: {apiTests.status?.ok ? '✅' : '❌'}
        </div>
        <div className={`p-2 rounded text-center ${apiTests.outputs?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Outputs: {apiTests.outputs?.ok ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
}