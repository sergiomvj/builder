#!/usr/bin/env python3
"""
Sistema de Arbitragem Inteligente de Tarefas VCM
Este script arbitra tarefas para personas baseado em suas posições,
competências e integrações com sub-sistemas.
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('task_arbitration.log'),
        logging.StreamHandler()
    ]
)

class TaskArbitrator:
    """
    Classe responsável por arbitrar tarefas inteligentemente para personas
    baseado em suas funções, competências e integrações com sub-sistemas.
    """
    
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.personas_competencias = self.load_personas_config()
        self.subsistemas = self.load_subsistemas_config()
        self.task_templates = self.load_task_templates()
        
        logging.info("TaskArbitrator iniciado com sucesso")
    
    def load_personas_config(self) -> Dict[str, Any]:
        """Carrega configurações das personas"""
        try:
            config_path = self.base_path / "AUTOMACAO" / "personas_config.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                logging.warning(f"Arquivo personas_config.json não encontrado em {config_path}")
                return self.get_default_personas_config()
        except Exception as e:
            logging.error(f"Erro ao carregar personas_config.json: {e}")
            return self.get_default_personas_config()
    
    def load_subsistemas_config(self) -> Dict[str, Any]:
        """Carrega configurações dos sub-sistemas"""
        return {
            "Email Management": ["email_campaigns", "email_templates", "email_contacts"],
            "CRM": ["crm_leads", "crm_pipelines", "crm_opportunities", "crm_activities"],
            "Social Media": ["social_accounts", "social_posts", "social_campaigns"],
            "Marketing": ["marketing_campaigns", "marketing_ads", "marketing_metrics"],
            "Financial": ["financial_accounts", "financial_transactions", "financial_invoices"],
            "Content Creation": ["content_projects", "content_assets", "content_scripts"],
            "Support": ["support_tickets", "support_messages", "support_knowledge_base"],
            "Analytics": ["analytics_reports", "analytics_metrics", "analytics_dashboards"],
            "HR": ["hr_employees", "hr_departments", "hr_payroll"],
            "E-commerce": ["ecommerce_products", "ecommerce_orders"],
            "AI Assistant": ["ai_conversations", "ai_automations"],
            "BI": ["bi_dashboards", "bi_data_models", "bi_reports"]
        }
    
    def load_task_templates(self) -> Dict[str, Any]:
        """Carrega templates de tarefas por posição"""
        return {
            "CEO": {
                "daily": [
                    {
                        "title": "Revisão de Métricas Executivas",
                        "description": "Análise do dashboard executivo com KPIs principais da empresa",
                        "estimated_duration": 30,
                        "priority": "HIGH",
                        "required_subsystems": ["Analytics", "BI", "Financial"],
                        "inputs_from": ["CFO", "CTO", "Sales Director", "Operations Manager"],
                        "outputs_to": ["Equipe executiva", "Board"],
                        "dependencies": ["Relatórios atualizados", "Dados consolidados"]
                    },
                    {
                        "title": "Aprovação de Decisões Pendentes",
                        "description": "Review e aprovação de decisões escaladas pelos departamentos",
                        "estimated_duration": 45,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "Financial", "HR"],
                        "inputs_from": ["Todos os departamentos"],
                        "outputs_to": ["Departamentos solicitantes"],
                        "dependencies": ["Requests de aprovação nos sistemas"]
                    },
                    {
                        "title": "Comunicação Estratégica",
                        "description": "Definição de comunicados e direcionamentos estratégicos",
                        "estimated_duration": 20,
                        "priority": "MEDIUM",
                        "required_subsystems": ["Content Creation", "Email Management"],
                        "inputs_from": ["Marketing Manager", "HR Director"],
                        "outputs_to": ["Toda a empresa", "Stakeholders externos"],
                        "dependencies": ["Informações estratégicas consolidadas"]
                    }
                ],
                "weekly": [
                    {
                        "title": "Reunião de Liderança",
                        "description": "Reunião semanal com C-level para alinhamento estratégico",
                        "estimated_duration": 90,
                        "priority": "HIGH",
                        "required_subsystems": ["Analytics", "BI"],
                        "frequency": "weekly",
                        "day_of_week": "monday"
                    },
                    {
                        "title": "Review de Objetivos Semanais",
                        "description": "Análise de progresso dos objetivos da semana",
                        "estimated_duration": 60,
                        "priority": "MEDIUM",
                        "required_subsystems": ["Analytics", "HR"],
                        "frequency": "weekly",
                        "day_of_week": "friday"
                    }
                ],
                "monthly": [
                    {
                        "title": "Review Estratégico Mensal",
                        "description": "Análise completa de performance e ajustes estratégicos",
                        "estimated_duration": 240,
                        "priority": "HIGH",
                        "required_subsystems": ["Analytics", "BI", "Financial"],
                        "frequency": "monthly",
                        "week_of_month": 1
                    }
                ]
            },
            "Marketing Manager": {
                "daily": [
                    {
                        "title": "Análise de Performance de Campanhas",
                        "description": "Monitoramento detalhado de métricas de campanhas ativas",
                        "estimated_duration": 60,
                        "priority": "HIGH",
                        "required_subsystems": ["Marketing", "Analytics", "Social Media"],
                        "inputs_from": ["Marketing Metrics", "Social Media Manager", "Performance data"],
                        "outputs_to": ["Sales Director", "CEO", "Equipe de marketing"],
                        "dependencies": ["Dados atualizados de campanhas", "Acesso aos dashboards"]
                    },
                    {
                        "title": "Otimização de Anúncios",
                        "description": "Ajustes estratégicos em campanhas baseados em performance",
                        "estimated_duration": 45,
                        "priority": "MEDIUM",
                        "required_subsystems": ["Marketing"],
                        "inputs_from": ["Performance data", "Budget status"],
                        "outputs_to": ["Marketing Metrics", "Financial"],
                        "dependencies": ["Budget aprovado", "Creative assets disponíveis"]
                    },
                    {
                        "title": "Gestão de Conteúdo e Briefings",
                        "description": "Aprovação e direcionamento de conteúdos para criação",
                        "estimated_duration": 40,
                        "priority": "HIGH",
                        "required_subsystems": ["Content Creation", "Social Media"],
                        "inputs_from": ["Content Creator", "Social Media Manager"],
                        "outputs_to": ["Content Creation", "Social Media"],
                        "dependencies": ["Calendário editorial", "Brand guidelines"]
                    }
                ],
                "weekly": [
                    {
                        "title": "Planejamento de Conteúdo Semanal",
                        "description": "Definição estratégica de conteúdo para a próxima semana",
                        "estimated_duration": 120,
                        "priority": "HIGH",
                        "required_subsystems": ["Content Creation", "Social Media"],
                        "frequency": "weekly",
                        "day_of_week": "friday"
                    },
                    {
                        "title": "Análise de Competidores",
                        "description": "Monitoramento e análise de atividades da concorrência",
                        "estimated_duration": 90,
                        "priority": "MEDIUM",
                        "required_subsystems": ["Analytics", "Social Media"],
                        "frequency": "weekly",
                        "day_of_week": "wednesday"
                    }
                ]
            },
            "SDR": {
                "daily": [
                    {
                        "title": "Prospecção de Novos Leads",
                        "description": "Identificação ativa e contato inicial com prospects qualificados",
                        "estimated_duration": 120,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "Email Management"],
                        "inputs_from": ["Marketing leads", "Lead scoring", "Marketing Manager"],
                        "outputs_to": ["CRM pipeline", "Account Executives", "Sales Director"],
                        "dependencies": ["Lista de leads atualizada", "Templates de email", "CRM funcionando"]
                    },
                    {
                        "title": "Follow-up de Leads Existentes",
                        "description": "Sequência estruturada de follow-up com prospects em pipeline",
                        "estimated_duration": 90,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "Email Management"],
                        "inputs_from": ["CRM activities", "Lead status", "Previous interactions"],
                        "outputs_to": ["Updated lead status", "Meeting bookings", "Sales pipeline"],
                        "dependencies": ["CRM atualizado", "Email sequences ativas"]
                    },
                    {
                        "title": "Qualificação e Scoring de Leads",
                        "description": "Avaliação e classificação de leads para priorização",
                        "estimated_duration": 45,
                        "priority": "MEDIUM",
                        "required_subsystems": ["CRM", "Analytics"],
                        "inputs_from": ["Lead interactions", "Behavioral data"],
                        "outputs_to": ["Lead scores", "Sales priorities"],
                        "dependencies": ["Critérios de qualificação definidos"]
                    }
                ],
                "weekly": [
                    {
                        "title": "Análise de Pipeline Semanal",
                        "description": "Review completo do pipeline e identificação de oportunidades",
                        "estimated_duration": 60,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "Analytics"],
                        "frequency": "weekly",
                        "day_of_week": "friday"
                    }
                ]
            },
            "CFO": {
                "daily": [
                    {
                        "title": "Análise de Cash Flow",
                        "description": "Monitoramento diário do fluxo de caixa e posição financeira",
                        "estimated_duration": 45,
                        "priority": "HIGH",
                        "required_subsystems": ["Financial", "Analytics"],
                        "inputs_from": ["Bank accounts", "Receivables", "Payables"],
                        "outputs_to": ["CEO", "Financial reports"],
                        "dependencies": ["Dados bancários atualizados", "Reconciliação"]
                    },
                    {
                        "title": "Aprovação de Despesas",
                        "description": "Review e aprovação de despesas pendentes",
                        "estimated_duration": 30,
                        "priority": "HIGH",
                        "required_subsystems": ["Financial", "HR"],
                        "inputs_from": ["Expense requests", "Budget status"],
                        "outputs_to": ["Approved expenses", "Budget updates"],
                        "dependencies": ["Políticas de aprovação", "Budget disponível"]
                    }
                ],
                "monthly": [
                    {
                        "title": "Fechamento Financeiro Mensal",
                        "description": "Consolidação completa das movimentações financeiras do mês",
                        "estimated_duration": 480,
                        "priority": "HIGH",
                        "required_subsystems": ["Financial", "Analytics", "BI"],
                        "frequency": "monthly",
                        "week_of_month": 1
                    }
                ]
            },
            "Sales Director": {
                "daily": [
                    {
                        "title": "Review de Pipeline de Vendas",
                        "description": "Análise diária do pipeline e oportunidades em andamento",
                        "estimated_duration": 60,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "Analytics"],
                        "inputs_from": ["SDR activities", "AE updates", "Lead status"],
                        "outputs_to": ["CEO", "Sales team", "Forecast updates"],
                        "dependencies": ["CRM atualizado", "Pipeline data"]
                    },
                    {
                        "title": "Coaching de Equipe",
                        "description": "Orientação e desenvolvimento da equipe de vendas",
                        "estimated_duration": 45,
                        "priority": "HIGH",
                        "required_subsystems": ["CRM", "HR"],
                        "inputs_from": ["Individual performance", "Deal status"],
                        "outputs_to": ["Team development", "Performance improvement"],
                        "dependencies": ["Performance metrics", "Team availability"]
                    }
                ]
            }
        }
    
    def get_default_personas_config(self) -> Dict[str, Any]:
        """Retorna configuração padrão das personas"""
        return {
            "personas": [
                {"nome": "CEO", "cargo": "CEO", "categoria": "executivos"},
                {"nome": "Marketing Manager", "cargo": "Marketing Manager", "categoria": "especialistas"},
                {"nome": "SDR", "cargo": "SDR", "categoria": "assistentes"},
                {"nome": "CFO", "cargo": "CFO", "categoria": "executivos"},
                {"nome": "Sales Director", "cargo": "Sales Director", "categoria": "especialistas"}
            ]
        }
    
    def arbitrate_tasks_for_persona(self, persona_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Arbitra tarefas para uma persona específica baseado em:
        1. Posição na empresa
        2. Competências técnicas e comportamentais  
        3. Integração com sub-sistemas
        """
        try:
            persona_id = persona_data.get('id', str(uuid.uuid4()))
            persona_name = persona_data.get('nome', 'Unknown')
            position = persona_data.get('cargo', 'Unknown')
            
            logging.info(f"Arbitrando tarefas para {persona_name} ({position})")
            
            # Gerar tarefas por frequência
            daily_tasks = self.generate_tasks_by_frequency(persona_data, 'daily')
            weekly_tasks = self.generate_tasks_by_frequency(persona_data, 'weekly') 
            monthly_tasks = self.generate_tasks_by_frequency(persona_data, 'monthly')
            
            result = {
                "persona_id": persona_id,
                "persona_name": persona_name,
                "position": position,
                "arbitration_timestamp": datetime.now().isoformat(),
                "daily_tasks": daily_tasks,
                "weekly_tasks": weekly_tasks,
                "monthly_tasks": monthly_tasks,
                "subsystem_integrations": self.map_subsystem_integrations(persona_data),
                "total_estimated_time": {
                    "daily_minutes": sum(task.get('estimated_duration', 0) for task in daily_tasks),
                    "weekly_minutes": sum(task.get('estimated_duration', 0) for task in weekly_tasks),
                    "monthly_minutes": sum(task.get('estimated_duration', 0) for task in monthly_tasks)
                }
            }
            
            logging.info(f"Tarefas arbitradas com sucesso para {persona_name}: {len(daily_tasks)} diárias, {len(weekly_tasks)} semanais, {len(monthly_tasks)} mensais")
            
            return result
            
        except Exception as e:
            logging.error(f"Erro ao arbitrar tarefas para persona: {e}")
            return {"error": str(e)}
    
    def generate_tasks_by_frequency(self, persona_data: Dict[str, Any], frequency: str) -> List[Dict[str, Any]]:
        """Gera tarefas baseadas na frequência (daily, weekly, monthly)"""
        position = persona_data.get('cargo', 'Unknown')
        tasks = []
        
        # Buscar templates da posição
        position_templates = self.task_templates.get(position, {})
        frequency_templates = position_templates.get(frequency, [])
        
        current_date = datetime.now()
        
        for template in frequency_templates:
            task = {
                "id": f"{frequency}_{position.lower().replace(' ', '_')}_{current_date.strftime('%Y%m%d')}_{len(tasks) + 1}",
                "title": template.get('title'),
                "description": template.get('description'),
                "task_type": frequency,
                "priority": template.get('priority', 'MEDIUM'),
                "status": "pending",
                "estimated_duration": template.get('estimated_duration', 60),
                "required_subsystems": template.get('required_subsystems', []),
                "inputs_from": template.get('inputs_from', []),
                "outputs_to": template.get('outputs_to', []),
                "dependencies": template.get('dependencies', []),
                "due_date": self.calculate_due_date(frequency, current_date),
                "created_at": current_date.isoformat(),
                "metadata": {
                    "arbitrated_by": "TaskArbitrator",
                    "template_based": True,
                    "frequency": frequency,
                    "position": position
                }
            }
            
            # Adicionar campos específicos da frequência
            if frequency == 'weekly':
                task['day_of_week'] = template.get('day_of_week')
            elif frequency == 'monthly':
                task['week_of_month'] = template.get('week_of_month')
            
            tasks.append(task)
        
        return tasks
    
    def calculate_due_date(self, frequency: str, base_date: datetime) -> str:
        """Calcula data de vencimento baseada na frequência"""
        if frequency == 'daily':
            # Tarefas diárias vencem no mesmo dia às 18:00
            due_date = base_date.replace(hour=18, minute=0, second=0, microsecond=0)
        elif frequency == 'weekly':
            # Tarefas semanais vencem no final da semana
            days_until_friday = (4 - base_date.weekday()) % 7
            due_date = base_date + timedelta(days=days_until_friday)
            due_date = due_date.replace(hour=17, minute=0, second=0, microsecond=0)
        elif frequency == 'monthly':
            # Tarefas mensais vencem no final do mês
            if base_date.month == 12:
                due_date = base_date.replace(year=base_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                due_date = base_date.replace(month=base_date.month + 1, day=1) - timedelta(days=1)
            due_date = due_date.replace(hour=17, minute=0, second=0, microsecond=0)
        else:
            due_date = base_date + timedelta(days=1)
        
        return due_date.isoformat()
    
    def map_subsystem_integrations(self, persona_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mapeia integrações necessárias com sub-sistemas"""
        position = persona_data.get('cargo', 'Unknown')
        
        # Mapeamento de integrações por posição
        integrations_map = {
            "CEO": {
                "primary": ["Analytics", "BI", "Financial"],
                "secondary": ["HR", "CRM", "Marketing"],
                "data_sources": ["All subsystems"],
                "data_outputs": ["Strategic directives", "Approvals", "Communications"],
                "critical_workflows": ["Executive reporting", "Decision approval", "Strategic planning"]
            },
            "Marketing Manager": {
                "primary": ["Marketing", "Social Media", "Content Creation"],
                "secondary": ["CRM", "Analytics", "Email Management"],
                "data_sources": ["CRM leads", "Campaign metrics", "Social engagement"],
                "data_outputs": ["Campaigns", "Content briefs", "Lead scoring"],
                "critical_workflows": ["Campaign management", "Content planning", "Lead nurturing"]
            },
            "SDR": {
                "primary": ["CRM", "Email Management"],
                "secondary": ["Marketing", "Content Creation"],
                "data_sources": ["Marketing leads", "Lead scoring", "Email templates"],
                "data_outputs": ["Qualified leads", "Activity logs", "Meeting bookings"],
                "critical_workflows": ["Lead qualification", "Prospecting", "Pipeline management"]
            },
            "CFO": {
                "primary": ["Financial", "Analytics", "BI"],
                "secondary": ["HR", "CRM"],
                "data_sources": ["Financial transactions", "Revenue data", "Cost data"],
                "data_outputs": ["Financial reports", "Budget approvals", "Forecasts"],
                "critical_workflows": ["Financial reporting", "Budget management", "Cash flow management"]
            },
            "Sales Director": {
                "primary": ["CRM", "Analytics"],
                "secondary": ["Marketing", "Financial"],
                "data_sources": ["Sales pipeline", "Performance metrics", "Revenue data"],
                "data_outputs": ["Sales forecasts", "Team coaching", "Strategy adjustments"],
                "critical_workflows": ["Pipeline management", "Sales coaching", "Revenue optimization"]
            }
        }
        
        return integrations_map.get(position, {
            "primary": [],
            "secondary": [],
            "data_sources": [],
            "data_outputs": [],
            "critical_workflows": []
        })
    
    def arbitrate_all_personas(self, empresa_personas: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Arbitra tarefas para todas as personas de uma empresa"""
        results = {
            "empresa_id": empresa_personas[0].get('empresa_id') if empresa_personas else None,
            "arbitration_timestamp": datetime.now().isoformat(),
            "total_personas": len(empresa_personas),
            "personas_tasks": [],
            "summary": {
                "total_daily_tasks": 0,
                "total_weekly_tasks": 0,
                "total_monthly_tasks": 0,
                "total_estimated_daily_minutes": 0
            }
        }
        
        for persona in empresa_personas:
            persona_tasks = self.arbitrate_tasks_for_persona(persona)
            results["personas_tasks"].append(persona_tasks)
            
            # Atualizar sumário
            if 'daily_tasks' in persona_tasks:
                results["summary"]["total_daily_tasks"] += len(persona_tasks["daily_tasks"])
                results["summary"]["total_estimated_daily_minutes"] += persona_tasks.get("total_estimated_time", {}).get("daily_minutes", 0)
            
            if 'weekly_tasks' in persona_tasks:
                results["summary"]["total_weekly_tasks"] += len(persona_tasks["weekly_tasks"])
            
            if 'monthly_tasks' in persona_tasks:
                results["summary"]["total_monthly_tasks"] += len(persona_tasks["monthly_tasks"])
        
        return results
    
    def export_tasks_to_json(self, tasks_data: Dict[str, Any], output_path: Optional[Path] = None) -> Path:
        """Exporta as tarefas arbitradas para um arquivo JSON"""
        if output_path is None:
            output_path = self.base_path / f"arbitrated_tasks_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(tasks_data, f, indent=2, ensure_ascii=False)
            
            logging.info(f"Tarefas exportadas para: {output_path}")
            return output_path
            
        except Exception as e:
            logging.error(f"Erro ao exportar tarefas: {e}")
            raise

def main():
    """Função principal para testar o arbitrador"""
    arbitrator = TaskArbitrator()
    
    # Exemplo de personas para teste
    test_personas = [
        {"id": "ceo_001", "nome": "John CEO", "cargo": "CEO", "empresa_id": "empresa_001"},
        {"id": "mkt_001", "nome": "Maria Marketing", "cargo": "Marketing Manager", "empresa_id": "empresa_001"},
        {"id": "sdr_001", "nome": "Pedro SDR", "cargo": "SDR", "empresa_id": "empresa_001"},
        {"id": "cfo_001", "nome": "Ana CFO", "cargo": "CFO", "empresa_id": "empresa_001"}
    ]
    
    # Arbitrar tarefas para todas as personas
    all_tasks = arbitrator.arbitrate_all_personas(test_personas)
    
    # Exportar resultados
    output_file = arbitrator.export_tasks_to_json(all_tasks)
    
    print(f"✅ Arbitragem concluída!")
    print(f"📊 Total de personas: {all_tasks['total_personas']}")
    print(f"📅 Tarefas diárias: {all_tasks['summary']['total_daily_tasks']}")
    print(f"📊 Tarefas semanais: {all_tasks['summary']['total_weekly_tasks']}")
    print(f"📈 Tarefas mensais: {all_tasks['summary']['total_monthly_tasks']}")
    print(f"⏱️  Tempo diário estimado: {all_tasks['summary']['total_estimated_daily_minutes']} minutos")
    print(f"📄 Arquivo exportado: {output_file}")

if __name__ == "__main__":
    main()