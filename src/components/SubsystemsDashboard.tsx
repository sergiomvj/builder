import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Target, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  Video, 
  Headphones, 
  BarChart, 
  Users, 
  ShoppingCart, 
  Bot, 
  Database 
} from 'lucide-react';

interface Subsystem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'development';
  features: number;
  tables: string[];
  personas: string[];
}

const subsystems: Subsystem[] = [
  {
    id: 'email',
    name: 'Email Management',
    description: 'Campanhas de email, templates e automações',
    icon: <Mail className="h-6 w-6" />,
    status: 'active',
    features: 5,
    tables: ['email_campaigns', 'email_templates', 'email_contacts', 'email_sequences'],
    personas: ['Marketing Manager', 'SDR', 'Content Manager']
  },
  {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'Gestão de leads, pipeline e oportunidades',
    icon: <Target className="h-6 w-6" />,
    status: 'active',
    features: 6,
    tables: ['crm_leads', 'crm_pipelines', 'crm_opportunities', 'crm_activities'],
    personas: ['Sales Director', 'SDR', 'Account Executive']
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Gestão de redes sociais e posts',
    icon: <Share2 className="h-6 w-6" />,
    status: 'active',
    features: 4,
    tables: ['social_accounts', 'social_posts', 'social_campaigns'],
    personas: ['Marketing Manager', 'Content Creator', 'Social Media Manager']
  },
  {
    id: 'marketing',
    name: 'Marketing & Traffic',
    description: 'Campanhas de traffic pago e ROI',
    icon: <TrendingUp className="h-6 w-6" />,
    status: 'active',
    features: 5,
    tables: ['marketing_campaigns', 'marketing_ads', 'marketing_metrics'],
    personas: ['Performance Manager', 'Creative Director', 'Data Analyst']
  },
  {
    id: 'financial',
    name: 'Financial Management',
    description: 'Gestão financeira e contabilidade',
    icon: <DollarSign className="h-6 w-6" />,
    status: 'active',
    features: 6,
    tables: ['financial_accounts', 'financial_transactions', 'financial_invoices'],
    personas: ['CFO', 'Accountant', 'Financial Analyst']
  },
  {
    id: 'content',
    name: 'Content Creation',
    description: 'Projetos de conteúdo e assets',
    icon: <Video className="h-6 w-6" />,
    status: 'development',
    features: 4,
    tables: ['content_projects', 'content_assets', 'content_scripts'],
    personas: ['Content Manager', 'Creative Director', 'Video Editor']
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Tickets e base de conhecimento',
    icon: <Headphones className="h-6 w-6" />,
    status: 'active',
    features: 5,
    tables: ['support_tickets', 'support_messages', 'support_knowledge_base'],
    personas: ['Support Manager', 'Support Agent', 'QA Analyst']
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Relatórios e dashboards',
    icon: <BarChart className="h-6 w-6" />,
    status: 'active',
    features: 4,
    tables: ['analytics_reports', 'analytics_metrics', 'analytics_dashboards'],
    personas: ['CEO', 'Data Analyst', 'Operations Manager']
  },
  {
    id: 'hr',
    name: 'HR Management',
    description: 'Gestão de funcionários e folha',
    icon: <Users className="h-6 w-6" />,
    status: 'development',
    features: 6,
    tables: ['hr_employees', 'hr_departments', 'hr_payroll', 'hr_performance_reviews'],
    personas: ['HR Director', 'HR Analyst', 'Payroll Specialist']
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Loja virtual e gestão de produtos',
    icon: <ShoppingCart className="h-6 w-6" />,
    status: 'development',
    features: 5,
    tables: ['ecommerce_products', 'ecommerce_orders', 'ecommerce_customers'],
    personas: ['E-commerce Manager', 'Product Manager', 'Operations Manager']
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    description: 'Assistentes de IA e automações',
    icon: <Bot className="h-6 w-6" />,
    status: 'development',
    features: 4,
    tables: ['ai_conversations', 'ai_automations', 'ai_executions'],
    personas: ['AI Specialist', 'Operations Manager', 'Content Creator']
  },
  {
    id: 'bi',
    name: 'Business Intelligence',
    description: 'BI avançado e análise preditiva',
    icon: <Database className="h-6 w-6" />,
    status: 'development',
    features: 5,
    tables: ['bi_dashboards', 'bi_data_models', 'bi_reports'],
    personas: ['BI Analyst', 'Data Scientist', 'Executive']
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'development': return 'bg-yellow-500';
    case 'inactive': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'development': return 'Em Desenvolvimento';
    case 'inactive': return 'Inativo';
    default: return 'Desconhecido';
  }
};

export function SubsystemsDashboard() {
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sub-sistemas VCM</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os sub-sistemas da Virtual Company Manager
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-500/10">
            {subsystems.filter(s => s.status === 'active').length} Ativos
          </Badge>
          <Badge variant="outline" className="bg-yellow-500/10">
            {subsystems.filter(s => s.status === 'development').length} Em Desenvolvimento
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="database">Estrutura de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subsystems.map((subsystem) => (
              <Card 
                key={subsystem.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedSubsystem(subsystem)}
              >
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {subsystem.icon}
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(subsystem.status)}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{subsystem.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {subsystem.description}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{subsystem.features} funcionalidades</span>
                      <span>{subsystem.tables.length} tabelas</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(subsystem.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedSubsystem ? (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {selectedSubsystem.icon}
                  <div>
                    <CardTitle>{selectedSubsystem.name}</CardTitle>
                    <CardDescription>{selectedSubsystem.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tabelas do Sistema</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubsystem.tables.map((table) => (
                      <Badge key={table} variant="outline">{table}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Personas Indicadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubsystem.personas.map((persona) => (
                      <Badge key={persona} variant="secondary">{persona}</Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <Button>Acessar Sistema</Button>
                  <Button variant="outline" className="ml-2">Ver Documentação</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Selecione um sub-sistema na aba "Visão Geral" para ver os detalhes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subsystems.map((subsystem) => (
              <Card key={subsystem.id}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {subsystem.icon}
                    <CardTitle className="text-base">{subsystem.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Tabelas ({subsystem.tables.length})</h5>
                    <div className="space-y-1">
                      {subsystem.tables.map((table) => (
                        <div key={table} className="text-xs font-mono bg-muted p-1 rounded">
                          {table}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}