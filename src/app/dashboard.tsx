'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  BarChart3,
  Database,
  RefreshCw,
  TrendingUp,
  Users,
  Building,
  Package,
  Shield,
  AlertTriangle,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { useHealthCheck } from '@/lib/hooks';
import TasksPage from '@/app/tasks/page';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType | null>('onboarding');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const { data: healthData, isLoading: healthLoading } = useHealthCheck();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BuildCorp Dashboard</h1>
              <p className="text-gray-600">Gestão Inteligente de Empresas Virtuais</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/manual', '_blank')}
                className="flex items-center gap-2"
              >
                <BookOpen size={16} />
                Manual
              </Button>
              
              {healthLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity size={20} className="animate-pulse" />
                  <span>Verificando...</span>
                </div>
              ) : healthData && healthData.status === 'healthy' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span>API Conectada</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertTriangle size={20} />
                  <span>Modo Desenvolvimento</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* API Status Banner */}
      {!healthLoading && (!healthData || healthData.status !== 'healthy') && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Modo Desenvolvimento:</strong> Dashboard funcionando com dados simulados. 
                    Para ativar funcionalidades completas de automação, execute: 
                    <code className="bg-blue-100 px-2 py-1 rounded ml-1 text-blue-900">python api_bridge_real.py</code>
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                onClick={() => window.location.reload()}
              >
                Tentar Reconectar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        // Reset subtab when changing main tab
        if (tab === 'home') setActiveSubTab(null);
        else if (tab === 'empresas') setActiveSubTab(null);
        else if (tab === 'avatars') setActiveSubTab(null);
        else if (tab === 'diversidade') setActiveSubTab(null);
        else if (tab === 'scripts') setActiveSubTab(null);
        else setActiveSubTab(null);
      }} />
      
      {/* Sub Navigation */}
      <SubTabNavigation 
        activeTab={activeTab} 
        activeSubTab={activeSubTab} 
        onSubTabChange={setActiveSubTab} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HOME TAB */}
        {activeTab === 'home' && !activeSubTab && (
          <VisaoGeralPage />
        )}
        
        {activeTab === 'home' && activeSubTab === 'onboarding' && (
          <OnBoardingWizard />
        )}

        {/* EMPRESAS TAB */}
        {activeTab === 'empresas' && !activeSubTab && (
          <EmpresasPage 
            onEmpresaSelect={setSelectedEmpresaId}
            selectedEmpresaId={selectedEmpresaId}
          />
        )}
        
        {activeTab === 'empresas' && activeSubTab === 'tarefas' && (
          <TasksPage />
        )}

        {/* AVATARS & IMAGENS TAB */}
        {activeTab === 'avatars' && (
          <AvatarsSistemaCompleto />
        )}

        {/* DIVERSIDADE TAB */}
        {activeTab === 'diversidade' && (
          <EquipeDiversaGeneratorSafe />
        )}

        {/* SCRIPTS & TOOLS TAB */}
        {activeTab === 'scripts' && !activeSubTab && (
          <ScriptsNodeJSPage />
        )}
        
        {activeTab === 'scripts' && activeSubTab === 'tools' && (
          <SubsystemsPage />
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <IntegrationsMonitor />
        )}

        {/* MACHINE LEARNING TAB */}
        {activeTab === 'ml' && (
          <MachineLearningPage />
        )}

        {/* AUDITORIA TAB */}
        {activeTab === 'auditoria' && (
          <EnterpriseModules 
            empresaId={selectedEmpresaId || 'demo-empresa'} 
            empresaNome={selectedEmpresaId ? 'Empresa Selecionada' : 'Empresa Demo'} 
          />
        )}

        {/* PROVISIONAMENTO TAB */}
        {activeTab === 'provisionamento' && (
          <EnterpriseModules 
            empresaId={selectedEmpresaId || 'demo-empresa'} 
            empresaNome={selectedEmpresaId ? 'Empresa Selecionada' : 'Empresa Demo'} 
          />
        )}

        {/* CONFIGURAÇÕES TAB */}
        {activeTab === 'configuracoes' && (
          <ConfiguracoesPage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>BuildCorp Dashboard - Interface Real para execução de scripts de automação</p>
            <p className="mt-1">
              API Backend: <span className="font-mono">http://localhost:8000</span> | 
              Frontend: <span className="font-mono">http://localhost:3001</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}