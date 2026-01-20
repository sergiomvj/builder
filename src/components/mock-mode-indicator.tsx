'use client';

import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export function MockModeIndicator() {
  const pathname = usePathname();
  
  // Check if we are in a mock project context
  // This covers /projects/mock-project-xyz and sub-routes
  const isMockMode = pathname?.includes('mock-project-');

  if (!isMockMode) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-sm font-medium animate-pulse" suppressHydrationWarning>
      <AlertTriangle className="w-4 h-4" />
      <span>Modo Simulado</span>
    </div>
  );
}
