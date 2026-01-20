"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsClient } from '@/components/no-ssr';
import { 
  Home,
  Users,
  Shield,
  BarChart3,
  Settings,
  FileText,
  Activity,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Building,
  Zap,
  BookOpen,
  Menu,
  X,
  Code,
  Server,
  Lightbulb,
  Workflow,
  Image,
  Target
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function SidebarNavigation({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isClient = useIsClient();
  const pathname = usePathname();

  // Prevenir hidratação se ainda não estamos no cliente
  if (!isClient) {
    return (
      <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col" suppressHydrationWarning>
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const navigationItems = [
    { title: 'Dashboard', href: '/', icon: Home, badge: null },
    { title: 'Company OS', href: '/company-os', icon: Target, badge: 'NEW' },
    { title: 'Empresas', href: '/empresas', icon: Building, badge: null },
    { title: 'Personas', href: '/personas', icon: Users, badge: 'Central' },
    { title: 'Avatares', href: '/avatares', icon: Image, badge: 'AI' },
    { title: 'Tarefas e metas', href: '/tasks', icon: CheckCircle, badge: null },
    { title: 'Workflows', href: '/workflows', icon: Workflow, badge: 'Auto' },
    { title: 'Tools', href: '/tools', icon: Code, badge: null },
    { title: 'Auditoria', href: '/auditoria', icon: Shield, badge: 'Enterprise' },
    { title: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
    { title: 'Integrações', href: '/integracoes', icon: Zap, badge: 'API' },
    { title: 'Manual', href: '/manual', icon: BookOpen, badge: 'Docs' },
    { title: 'Configurações', href: '/configuracoes', icon: Settings, badge: null },
    { title: 'Status', href: '/status', icon: Server, badge: null },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg text-gray-900">BuildCorp</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  isCollapsed && 'justify-center'
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-blue-700')} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Sistema Ativo</span>
              </div>
              <div className="text-xs text-gray-600">
                Última atualização: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      <div className={cn('hidden md:block transition-all duration-300', isCollapsed ? 'w-16' : 'w-64')} />
    </>
  );
}