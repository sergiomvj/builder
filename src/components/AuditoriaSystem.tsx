import React from 'react';
import { Shield } from 'lucide-react';

export function AuditoriaSystem() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Sistema de Auditoria</h2>
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Sistema de Auditoria</p>
          <p className="text-sm text-gray-600"> Conectado ao Supabase</p>
        </div>
      </div>
    </div>
  );
}
