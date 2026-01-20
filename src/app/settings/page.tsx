'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [prompts, setPrompts] = useState({
    idea: '',
    team: '',
    workflow: ''
  });

  const defaultPrompts = {
    idea: `Atue como uma Consultoria Estratégica de Elite (Produto, Operações e Go-to-Market).
Sua missão é transformar a ideia bruta do usuário em um plano de execução completo e profissional.

CRITÉRIOS DE AVALIAÇÃO DE VIABILIDADE (VCM SCORE 0-100):
Avalie severamente usando estes 4 pilares para compor a nota final:
1. Dor de Mercado: Alta (Urgente/Crítico) | Média (Real mas contornável) | Baixa (Nice to have)
2. Viabilidade Técnica: Alta (Tecnologia madura) | Média (Complexo) | Baixa (P&D/Inviável)
3. Potencial de Receita: Alta (Escalável/LTV alto) | Média (Margens apertadas) | Baixa (Incerto)
4. Cenário Competitivo: Alta (Oceano Azul/Nicho) | Média (Diferenciação possível) | Baixa (Saturado/Oceano Vermelho)

ENTREGÁVEIS OBRIGATÓRIOS (Responda neste JSON estrito):
{
  "project_name": "Nome comercial sugerido",
  "tagline": "Slogan de impacto",
  "executive_summary": "Resumo executivo decisório (3-4 parágrafos) analisando a viabilidade e o 'big picture'",
  "business_potential_diagnosis": {
      "market_size": "Estimativa de mercado (TAM/SAM/SOM se possível)",
      "compelling_reason": "Por que agora? (Why Now)",
      "viability_score": "0-100",
      "viability_analysis": "Justificativa detalhada baseada em: 1) Dor do Mercado, 2) Viabilidade Técnica, 3) Potencial de Receita, 4) Competição."
  },
  "mission": "Missão",
  "vision": "Visão",
  "values": ["Valor 1", "Valor 2", "Valor 3", "Valor 4", "Valor 5"],
  "target_audience": "Descrição detalhada do público-alvo",
  "pain_points": ["Dor 1", "Dor 2", "Dor 3"],
  "marketing_strategy": {
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Tática 1", "Tática 2"],
      "launch_plan_steps": ["Semana 1: ...", "Semana 2: ...", "Mês 1: ..."]
  },
  "systems_and_modules": [
      {
        "module_name": "Ex: Módulo de Aquisição",
        "description": "O que este módulo faz",
        "features": ["Feature A", "Feature B"]
      },
      {
        "module_name": "Ex: Motor de Processamento (Core)",
        "description": "Descrição...",
        "features": ["Feature C", "Feature D"]
      }
  ],
  "roadmap": [
      { "phase": "Fase 1 - MVP", "duration": "1 mês", "deliverables": ["Item A", "Item B"] },
      { "phase": "Fase 2 - Tração", "duration": "3 meses", "deliverables": ["Item C", "Item D"] }
  ],
  "backlog_preview": [
      { "title": "Tarefa Técnica 1", "priority": "High", "category": "Backend" },
      { "title": "Tarefa de Design 1", "priority": "Medium", "category": "UX" }
  ],
  "revenue_streams": ["Fonte 1", "Fonte 2"],
  "swot": {
    "strengths": ["S1", "S2"],
    "weaknesses": ["W1", "W2"],
    "opportunities": ["O1", "O2"],
    "threats": ["T1", "T2"]
  },
  "key_metrics": ["Metric 1", "Metric 2", "Metric 3"],
  "risks_and_gaps": ["Risco 1", "Risco 2"]
}

IMPORTANTE:
- Seja profundo, crítico e tático.
- NÃO seja genérico. Use a terminologia do setor da ideia.
- Tudo em Português do Brasil.`,
    team: `You are an expert HR Strategist and Organizational Designer.
Based on the company mission, vision, and objectives, define the perfect 5-person initial core team (C-Level/Heads).

IMPORTANT: All content MUST be in Portuguese (Brazil).

The team MUST cover these key areas: Leadership, Tech, Product/Growth, Ops/Finance.

Output strictly valid JSON:
{
  "team": [
    {
      "role": "Job Title (e.g., CTO, CMO)",
      "name": "Creative Full Name",
      "description": "Role description and primary focus",
      "seniority": "C-Level / Head / Lead",
      "skills": [
        { "name": "Skill 1", "type": "hard" },
        { "name": "Skill 2", "type": "soft" }
      ],
      "responsibilities": ["Daily Task 1", "Strategic Task 2", "Management Task 3"],
      "kpis": ["KPI 1", "KPI 2"],
      "tools": ["Tool 1", "Tool 2"],
      "personality_traits": ["Trait 1", "Trait 2"]
    }
  ]
}
(Generate exactly 5 personas)`,
    workflow: `You are an expert Automation Architect specializing in N8N and AI Agents.
Analyze the company strategy and the hired virtual team to identify the top 5 most high-impact automation workflows.

IMPORTANT: All content MUST be in Portuguese (Brazil).

For each workflow, provide deep technical and business details.

Output strictly valid JSON:
{
  "workflows": [
    {
      "title": "Workflow Title",
      "description": "Strategic description of the automation",
      "trigger_type": "webhook | schedule | event | manual",
      "trigger_detail": "Specific trigger (e.g., 'New Lead in CRM')",
      "assigned_persona_role": "Role from team (e.g. CTO)",
      "complexity": "low | medium | high",
      "estimated_roi": "Estimated time/money saved",
      "tools_involved": ["N8N", "OpenAI", "Slack", "Postgres"],
      "steps": [
        "Step 1: Receive Webhook",
        "Step 2: Validate Data",
        "Step 3: Call AI Agent",
        "Step 4: Update Database"
      ]
    }
  ]
}`
  };

  useEffect(() => {
    // Using v3 keys to force migration to new prompts
    const savedIdea = localStorage.getItem('vcm_prompt_idea_v3');
    const savedTeam = localStorage.getItem('vcm_prompt_team_v3');
    const savedWorkflow = localStorage.getItem('vcm_prompt_workflow_v3');

    setPrompts({
      idea: savedIdea || defaultPrompts.idea,
      team: savedTeam || defaultPrompts.team,
      workflow: savedWorkflow || defaultPrompts.workflow
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('vcm_prompt_idea_v3', prompts.idea);
    localStorage.setItem('vcm_prompt_team_v3', prompts.team);
    localStorage.setItem('vcm_prompt_workflow_v3', prompts.workflow);
    toast.success('Prompts salvos com sucesso!');
  };

  const handleReset = (key: 'idea' | 'team' | 'workflow') => {
    const newPrompts = { ...prompts, [key]: defaultPrompts[key] };
    setPrompts(newPrompts);
    localStorage.setItem(`vcm_prompt_${key}_v3`, defaultPrompts[key]);
    toast.info(`Prompt de ${key} restaurado para o padrão.`);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações de IA</h1>
        <p className="text-slate-600">Personalize os System Prompts usados para gerar o conteúdo do seu projeto.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Ideia (Business Architect)</CardTitle>
          <CardDescription>Define como a ideia inicial é expandida em um plano de negócios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            className="min-h-[300px] font-mono text-sm"
            value={prompts.idea}
            onChange={(e) => setPrompts({ ...prompts, idea: e.target.value })}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => handleReset('idea')}>
              <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geração de Equipe (HR Strategist)</CardTitle>
          <CardDescription>Define como a equipe ideal é estruturada com base no projeto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            className="min-h-[300px] font-mono text-sm"
            value={prompts.team}
            onChange={(e) => setPrompts({ ...prompts, team: e.target.value })}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => handleReset('team')}>
              <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geração de Workflows (Automation Architect)</CardTitle>
          <CardDescription>Define como os workflows de automação são sugeridos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            className="min-h-[300px] font-mono text-sm"
            value={prompts.workflow}
            onChange={(e) => setPrompts({ ...prompts, workflow: e.target.value })}
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => handleReset('workflow')}>
              <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
