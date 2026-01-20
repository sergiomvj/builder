import React from 'react';
import { supabase } from '@/lib/supabase';

// Script para verificar quais sub-sistemas já estão implementados no Supabase

interface SubsystemCheck {
  name: string;
  tables: string[];
  status: 'implemented' | 'partial' | 'missing';
  missingTables: string[];
}

const expectedTables = {
  'Email Management': [
    'email_campaigns',
    'email_templates', 
    'email_contacts',
    'email_sequences',
    'email_sequence_emails'
  ],
  'CRM & Sales': [
    'crm_leads',
    'crm_pipelines',
    'crm_pipeline_stages',
    'crm_opportunities',
    'crm_activities'
  ],
  'Social Media': [
    'social_accounts',
    'social_posts',
    'social_campaigns'
  ],
  'Marketing': [
    'marketing_campaigns',
    'marketing_ads',
    'marketing_metrics'
  ],
  'Financial': [
    'financial_accounts',
    'financial_transactions',
    'financial_invoices',
    'financial_invoice_items',
    'financial_budgets'
  ],
  'Content': [
    'content_projects',
    'content_assets',
    'content_scripts'
  ],
  'Support': [
    'support_tickets',
    'support_ticket_messages',
    'support_knowledge_base'
  ],
  'Analytics': [
    'analytics_reports',
    'analytics_metrics',
    'analytics_dashboards'
  ],
  'HR': [
    'hr_employees',
    'hr_departments',
    'hr_payroll',
    'hr_performance_reviews'
  ],
  'E-commerce': [
    'ecommerce_products',
    'ecommerce_product_variants',
    'ecommerce_orders',
    'ecommerce_order_items'
  ],
  'AI Assistant': [
    'ai_conversations',
    'ai_conversation_messages',
    'ai_automations',
    'ai_automation_executions'
  ],
  'Business Intelligence': [
    'bi_dashboards',
    'bi_data_models',
    'bi_reports'
  ]
};

export async function checkSubsystemsStatus(): Promise<SubsystemCheck[]> {
  const results: SubsystemCheck[] = [];
  
  try {
    // Buscar todas as tabelas existentes
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Erro ao buscar tabelas:', error);
      return [];
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    
    // Verificar cada sub-sistema
    for (const [subsystemName, requiredTables] of Object.entries(expectedTables)) {
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      const implementedTables = requiredTables.filter(table => existingTables.includes(table));
      
      let status: 'implemented' | 'partial' | 'missing';
      if (missingTables.length === 0) {
        status = 'implemented';
      } else if (implementedTables.length > 0) {
        status = 'partial';
      } else {
        status = 'missing';
      }
      
      results.push({
        name: subsystemName,
        tables: requiredTables,
        status,
        missingTables
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar sub-sistemas:', error);
  }
  
  return results;
}

export async function implementSubsystem(subsystemName: string): Promise<boolean> {
  try {
    // Esta função executaria o SQL específico para implementar o sub-sistema
    console.log(`Implementando sub-sistema: ${subsystemName}`);
    
    // Aqui você executaria o SQL do arquivo database-schema-subsistemas.sql
    // correspondente ao sub-sistema específico
    
    return true;
  } catch (error) {
    console.error(`Erro ao implementar ${subsystemName}:`, error);
    return false;
  }
}

// Função para usar no componente React
export function useSubsystemsStatus() {
  const [status, setStatus] = React.useState<SubsystemCheck[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    checkSubsystemsStatus().then(result => {
      setStatus(result);
      setLoading(false);
    });
  }, []);
  
  return { status, loading, refresh: () => checkSubsystemsStatus().then(setStatus) };
}