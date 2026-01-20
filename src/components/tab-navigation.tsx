'use client';

import { Building2, Settings, Home, Shield, Code, Brain, BookOpen, Camera, Users, Package } from 'lucide-react';

export type TabType = 'home' | 'empresas' | 'avatars' | 'diversidade' | 'scripts' | 'integrations' | 'ml' | 'auditoria' | 'provisionamento' | 'configuracoes';

export type SubTabType = 'onboarding' | 'tarefas' | 'tools';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
      description: 'Visão geral e OnBoarding',
      hasSubTabs: true
    },
    {
      id: 'empresas' as TabType,
      label: 'Empresas',
      icon: Building2,
      description: 'Gerenciar empresas e tarefas',
      hasSubTabs: true
    },
    {
      id: 'avatars' as TabType,
      label: 'Avatars & Imagens',
      icon: Camera,
      description: 'Geração de avatares e imagens para redes sociais',
      hasSubTabs: false
    },
    {
      id: 'diversidade' as TabType,
      label: 'Diversidade',
      icon: Users,
      description: 'Gerador de equipes diversas e realistas',
      hasSubTabs: false
    },
    {
      id: 'scripts' as TabType,
      label: 'Scripts & Tools',
      icon: Code,
      description: 'Automação e ferramentas',
      hasSubTabs: true
    },
    {
      id: 'integrations' as TabType,
      label: 'Integrações',
      icon: Brain,
      description: 'APIs externas e integrações',
      hasSubTabs: false
    },
    {
      id: 'ml' as TabType,
      label: 'Machine Learning',
      icon: Brain,
      description: 'Sistema de aprendizado contínuo',
      hasSubTabs: false
    },
    {
      id: 'auditoria' as TabType,
      label: '🛡️ Auditoria',
      icon: Shield,
      description: 'Sistema de auditoria e compliance empresarial',
      hasSubTabs: false
    },
    {
      id: 'provisionamento' as TabType,
      label: '📦 Deploy',
      icon: Package,
      description: 'Deploy e sincronização de dados empresariais',
      hasSubTabs: false
    },
    {
      id: 'configuracoes' as TabType,
      label: '⚙️',
      icon: Settings,
      description: 'Configurações do sistema',
      hasSubTabs: false
    }
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon 
                  size={20} 
                  className={`
                    mr-2 
                    ${isActive 
                      ? 'text-blue-500' 
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `} 
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          {/* Manual Button */}
          <button
            onClick={() => window.open('/manual', '_blank')}
            className="group inline-flex items-center py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm ml-auto"
            title="Manual de Instruções"
          >
            <BookOpen 
              size={20} 
              className="mr-2 text-gray-400 group-hover:text-gray-500" 
            />
            <span>Manual</span>
          </button>
        </nav>
      </div>
    </div>
  );
}