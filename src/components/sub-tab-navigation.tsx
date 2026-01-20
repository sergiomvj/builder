'use client';

import { useState } from 'react';
import { TabType, SubTabType } from './tab-navigation';
import { Button } from './ui/button';
import { Home as HomeIcon, UserPlus, Building, CheckSquare, Code, Wrench } from 'lucide-react';

interface SubTabNavigationProps {
  activeTab: TabType;
  activeSubTab: SubTabType | null;
  onSubTabChange: (subTab: SubTabType | null) => void;
}

export function SubTabNavigation({ activeTab, activeSubTab, onSubTabChange }: SubTabNavigationProps) {
  const getSubTabs = (tab: TabType) => {
    switch (tab) {
      case 'home':
        return [
          { id: null, label: 'Visão Geral', icon: HomeIcon },
          { id: 'onboarding' as SubTabType, label: 'OnBoarding', icon: UserPlus }
        ];
      case 'empresas':
        return [
          { id: null, label: 'Lista de Empresas', icon: Building },
          { id: 'tarefas' as SubTabType, label: 'Tarefas', icon: CheckSquare }
        ];
      case 'scripts':
        return [
          { id: null, label: 'Scripts Node.js', icon: Code },
          { id: 'tools' as SubTabType, label: 'Tools & Subsistemas', icon: Wrench }
        ];
      default:
        return [];
    }
  };

  const subTabs = getSubTabs(activeTab);

  if (subTabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-100 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 py-2">
          {subTabs.map((subTab) => {
            const Icon = subTab.icon;
            const isActive = activeSubTab === subTab.id;
            
            return (
              <Button
                key={subTab.label}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onSubTabChange(subTab.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-sm border' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                <Icon size={16} />
                {subTab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}