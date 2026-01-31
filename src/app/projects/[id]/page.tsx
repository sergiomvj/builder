
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Project } from '@/types/project';
import { FileText, Lightbulb, Download, Target, Briefcase, TrendingUp, AlertTriangle, Users, Rocket, Shield, Archive, Quote, Plus, Pencil, Trash2, FileJson, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ExecutionPlanTab from '@/components/dashboard/ExecutionPlanTab';
import WorkflowsTab from '@/components/dashboard/WorkflowsTab';
import HRManagerChat from '@/components/dashboard/HRManagerChat';
import TeamMemberModal from '@/components/dashboard/TeamMemberModal';
import { marked } from 'marked';

// Helper to detect JSON string
const isJsonString = (str: string) => {
  try {
    const o = JSON.parse(str);
    return (o && typeof o === "object");
  } catch (e) { return false; }
};

const StructuredExecutiveSummary = ({ data }: { data: any }) => {
  if (!data) return null;

  // Handle new simple content format
  if (data.content && !data.investment_thesis) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border border-slate-100">
          <p className="text-slate-700 leading-relaxed whitespace-pre-line leading-relaxed text-justify">
            {data.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.investment_thesis && (
        <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
          <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Tese de Investimento
          </h4>
          <p className="text-slate-700 leading-relaxed">{data.investment_thesis}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.solution_overview && (
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Visão Geral da Solução</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{data.solution_overview}</p>
          </div>
        )}
        {data.opportunity_statement && (
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Oportunidade</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{data.opportunity_statement}</p>
          </div>
        )}
      </div>

      {data.market_positioning && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Posicionamento de Mercado</h4>
          <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-indigo-300 pl-4">
            "{data.market_positioning}"
          </p>
        </div>
      )}
    </div>
  );
};

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Genesis Edit State
  const [isEditingGenesis, setIsEditingGenesis] = useState(false);
  const [genesisContent, setGenesisContent] = useState('');
  const [isReevaluating, setIsReevaluating] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!params.id) return;

    const projectId = params.id as string;

    // Fetch Project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*, ideas(*)')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);

      // If project doesn't exist (deleted or invalid ID), redirect to projects list
      if (projectError.code === 'PGRST116' || projectError.message?.includes('0 rows')) {
        toast.error('Projeto não encontrado. Pode ter sido excluído.');
        router.push('/projects-list');
        return;
      }

      setLoading(false);
      return;
    }


    const ensureString = (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return val.content || val.message || JSON.stringify(val);
      return String(val);
    };

    const executionPlan = projectData.metadata?.execution_plan || {};

    setProject({
      ...projectData,
      systems_modules: projectData.metadata?.systems_and_modules || projectData.metadata?.systems_modules || executionPlan.systems_breakdown,
      backlog: projectData.metadata?.backlog_preview || projectData.metadata?.backlog || executionPlan.backlog_preview,
      roadmap: projectData.roadmap || projectData.metadata?.roadmap || executionPlan.roadmap,
      swot: projectData.swot || projectData.metadata?.swot,
      marketing_strategy: projectData.marketing_strategy || projectData.metadata?.marketing_strategy,
      lead_generation_strategy: projectData.lead_generation_strategy || projectData.metadata?.lead_generation_strategy,
      executive_summary: projectData.executive_summary || projectData.metadata?.executive_summary, // Allow object or string
      business_diagnosis: projectData.metadata?.business_potential_diagnosis || projectData.metadata?.business_diagnosis,
      key_metrics: projectData.metadata?.key_metrics || projectData.key_metrics, // Try root level too just in case
      risks: projectData.metadata?.risks_and_gaps || projectData.metadata?.risks,
      pain_points: projectData.pain_points || projectData.metadata?.pain_points,
      improvements: projectData.metadata?.improvement_suggestions || projectData.metadata?.improvements || projectData.improvements || projectData.metadata?.potential_improvements
    });

    // Workflows - Use Metadata (NoSQL approach for MVP)
    const workflowsFromMetadata = projectData.metadata?.workflows || [];
    setWorkflows(workflowsFromMetadata);

    // Fetch Team (via Empresa link)
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('project_id', projectId)
      .single();

    if (empresa) {
      const { data: teamData } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', empresa.id);

      if (teamData) setTeam(teamData);
    }

    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const getViabilityColor = (score: number) => {
    if (score < 60) return 'text-red-600 bg-red-100';
    if (score >= 60 && score < 75) return 'text-yellow-600 bg-yellow-100';
    if (score >= 75 && score < 90) return 'text-lime-600 bg-green-50';
    return 'text-emerald-700 bg-emerald-100';
  };

  const getViabilityLabel = (score: number) => {
    if (score < 60) return 'Não Viável';
    if (score >= 60 && score < 75) return 'Needs Improvement';
    if (score >= 75 && score < 90) return 'Viável';
    return 'Extremamente Viável';
  };

  const generateMarkdown = () => {
    if (!project) return;

    // Helper to unify access to analysis data locally for the export
    const analysisData: any = {
      ...project,
      ...project.metadata,
      marketing_strategy: project.marketing_strategy || project.metadata?.marketing_strategy,
      lead_generation_strategy: project.lead_generation_strategy || project.metadata?.lead_generation_strategy,
      business_diagnosis: project.business_diagnosis || project.metadata?.business_diagnosis,
      swot: project.swot || project.metadata?.swot,
      key_metrics: project.key_metrics || project.metadata?.key_metrics,
      risks: project.risks || project.metadata?.risks,
      why_now: project.metadata?.why_now,
      why_not_100: project.metadata?.why_not_100,
      potential_improvements: project.metadata?.potential_improvements,
      executive_summary: project.executive_summary || project.metadata?.executive_summary
    };

    let md = `# ${project.name}\n\n`;
    md += `**Tagline:** ${project.description}\n\n`;

    // Executive Summary
    if (analysisData.executive_summary) {
      md += `## Executive Summary\n`;
      if (typeof analysisData.executive_summary === 'string') {
        if (isJsonString(analysisData.executive_summary)) {
          const es = JSON.parse(analysisData.executive_summary);
          if (es.investment_thesis) md += `### Investment Thesis\n${es.investment_thesis}\n\n`;
          if (es.solution_overview) md += `### Solution Overview\n${es.solution_overview}\n\n`;
          if (es.opportunity_statement) md += `### Opportunity\n${es.opportunity_statement}\n\n`;
          if (es.market_positioning) md += `### Market Positioning\n${es.market_positioning}\n\n`;
          if (es.content) md += `${es.content}\n\n`;
        } else {
          md += `${analysisData.executive_summary}\n\n`;
        }
      } else {
        const es = analysisData.executive_summary;
        if (es.investment_thesis) md += `### Investment Thesis\n${es.investment_thesis}\n\n`;
        if (es.solution_overview) md += `### Solution Overview\n${es.solution_overview}\n\n`;
        if (es.opportunity_statement) md += `### Opportunity\n${es.opportunity_statement}\n\n`;
        if (es.market_positioning) md += `### Market Positioning\n${es.market_positioning}\n\n`;
        if (es.content) md += `${es.content}\n\n`;
      }
    }

    // Business Diagnosis / Viability
    const diagnosis = analysisData.business_diagnosis;
    const score = analysisData.viability_score?.total || diagnosis?.viability_score;

    if (diagnosis || score) {
      md += `## Business Diagnosis\n`;
      if (score) md += `- **Viability Score:** ${score}/100\n`;

      const analysisContent = diagnosis?.viability_analysis || diagnosis?.content || diagnosis;
      if (analysisContent && typeof analysisContent === 'string') {
        md += `- **Analysis:** ${analysisContent}\n`;
      } else if (analysisContent?.content) {
        md += `- **Analysis:** ${analysisContent.content}\n`;
      }

      const whyNow = analysisData.why_now?.content || (typeof analysisData.why_now === 'string' ? analysisData.why_now : null);
      if (whyNow) md += `- **Why Now:** ${whyNow}\n`;

      md += `\n`;
    }

    // Why Not 100?
    if (analysisData.why_not_100) {
      md += `### Why Not 100?\n`;
      if (analysisData.why_not_100.summary) md += `${analysisData.why_not_100.summary}\n\n`;
      if (analysisData.why_not_100.critical_gaps) {
        md += `**Critical Gaps:**\n`;
        analysisData.why_not_100.critical_gaps.forEach((gap: any) => {
          md += `- ${gap.gap} (Impact: ${gap.impact_on_score})\n`;
        });
        md += `\n`;
      }
    }

    // Potential Improvements
    if (analysisData.potential_improvements) {
      md += `### Potential Improvements\n`;
      const improvements = analysisData.potential_improvements.content || (typeof analysisData.potential_improvements === 'string' ? analysisData.potential_improvements : JSON.stringify(analysisData.potential_improvements));
      md += `${improvements}\n\n`;
    }

    // Standard Fields
    if (project.mission) md += `## Mission\n${project.mission}\n\n`;
    if (project.vision) md += `## Vision\n${project.vision}\n\n`;
    if (project.values) md += `## Values\n${project.values.join(', ')}\n\n`;
    if (project.target_audience) md += `## Target Audience\n${project.target_audience}\n\n`;

    // Pain Points
    const painPoints = analysisData.pain_points || project.pain_points;
    if (painPoints && Array.isArray(painPoints)) md += `## Pain Points\n- ${painPoints.join('\n- ')}\n\n`;

    // Marketing Strategy
    const marketing = analysisData.marketing_strategy;
    if (marketing) {
      md += `## Marketing Strategy\n`;
      if (marketing.value_proposition) {
        const uvp = typeof marketing.value_proposition === 'string' ? marketing.value_proposition : marketing.value_proposition.content;
        md += `**UVP:** ${uvp}\n\n`;
      }

      if (marketing.approach_strategy) {
        const approach = typeof marketing.approach_strategy === 'string' ? marketing.approach_strategy : marketing.approach_strategy.content;
        md += `### Approach\n${approach}\n\n`;
      }

      if (marketing.channels && Array.isArray(marketing.channels)) {
        md += `### Channels\n- ${marketing.channels.map((c: any) => typeof c === 'string' ? c : c.name).join('\n- ')}\n\n`;
      }

      if (marketing.tactics && Array.isArray(marketing.tactics)) {
        md += `### Tactics\n- ${marketing.tactics.map((t: any) => typeof t === 'string' ? t : `${t.tactic}: ${t.description}`).join('\n- ')}\n\n`;
      }
    }

    // Lead Generation
    const leadGen = analysisData.lead_generation_strategy;
    if (leadGen) {
      md += `## Lead Generation\n`;
      if (leadGen.lead_magnets) {
        md += `### Lead Magnets\n- ${leadGen.lead_magnets.map((m: any) => typeof m === 'string' ? m : `${m.name} - ${m.description}`).join('\n- ')}\n\n`;
      }
      if (leadGen.conversion_tactics) {
        md += `### Conversion Tactics\n- ${leadGen.conversion_tactics.map((t: any) => typeof t === 'string' ? t : `${t.tactic}: ${t.description}`).join('\n- ')}\n\n`;
      }
    }

    // Systems
    if (project.systems_modules) {
      md += `## Systems & Modules\n`;
      project.systems_modules.forEach((mod: any) => {
        md += `### ${mod.module_name}\n`;
        md += `${mod.description}\n`;
        if (mod.tech_stack_recommendation) md += `**Tech Stack:** ${mod.tech_stack_recommendation}\n`;
        if (mod.features) md += `**Features:**\n- ${mod.features.join('\n- ')}\n\n`;
      });
    }

    // Roadmap
    if (project.roadmap) {
      md += `## Roadmap\n`;
      project.roadmap.forEach((phase: any) => {
        md += `### ${phase.phase} (${phase.duration})\n`;
        phase.deliverables?.forEach((del: any) => {
          if (typeof del === 'string') {
            md += `- ${del}\n`;
          } else {
            md += `- [${del.area}] ${del.task}\n`;
          }
        });
        md += `\n`;
      });
    }

    // SWOT
    const swot = analysisData.swot;
    if (swot) {
      md += `## SWOT Analysis\n`;
      if (swot.strengths) md += `### Strengths\n- ${swot.strengths.join('\n- ')}\n\n`;
      if (swot.weaknesses) md += `### Weaknesses\n- ${swot.weaknesses.join('\n- ')}\n\n`;
      if (swot.opportunities) md += `### Opportunities\n- ${swot.opportunities.join('\n- ')}\n\n`;
      if (swot.threats) md += `### Threats\n- ${swot.threats.join('\n- ')}\n\n`;
    }

    // Key Metrics
    const metrics = analysisData.key_metrics;
    if (metrics) {
      md += `## Key Metrics\n`;
      if (Array.isArray(metrics)) {
        md += `- ${metrics.join('\n- ')}\n\n`;
      } else {
        const mContent = metrics.content || (typeof metrics === 'string' ? metrics : '');
        if (mContent) md += `${mContent}\n\n`;
      }
    }

    // Risks
    const risks = analysisData.risks;
    if (risks) {
      md += `## Risks\n`;
      if (Array.isArray(risks)) {
        md += `- ${risks.join('\n- ')}\n\n`;
      } else {
        const rContent = risks.content || (typeof risks === 'string' ? risks : '');
        if (rContent) md += `${rContent}\n\n`;
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_').toLowerCase()}_analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analysis exported to Markdown');
  };

  const saveToSystem = async () => {
    if (!project) return;
    try {
      // Validate UUID or use null
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const analysisData = {
        empresa_id: project.empresa_id && isUuid(project.empresa_id) ? project.empresa_id : null,
        title: `Análise Estratégica: ${project.name}`,
        summary: typeof project.executive_summary === 'string'
          ? project.executive_summary.substring(0, 300) + '...'
          : JSON.stringify(project.executive_summary || {}).substring(0, 300) + '...',
        analysis_type: 'strategic',
        content: {
          executive_summary: project.executive_summary,
          business_diagnosis: project.business_diagnosis,
          swot: project.swot,
          marketing_strategy: project.marketing_strategy,
          key_metrics: project.key_metrics,
          risks: project.risks,
          team: team,
          workflows: workflows
        }
      };

      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar');
      }

      toast.success('Análise estratégica salva com sucesso no sistema!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  };

  const handleSaveMember = async (memberData: any) => {
    try {
      const currentProjectId = params.id as string;
      // Find or Create Empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('project_id', currentProjectId)
        .single();

      let empresaId = empresa?.id;

      if (!empresaId) {
        const { data: newEmpresa, error: createError } = await supabase
          .from('empresas')
          .insert({ project_id: currentProjectId, nome: project?.name || 'Nova Empresa' })
          .select()
          .single();
        if (createError) throw createError;
        empresaId = newEmpresa.id;
      }

      const { error } = await supabase
        .from('personas')
        .upsert({
          ...memberData,
          empresa_id: empresaId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(editingMember ? 'Membro atualizado!' : 'Membro adicionado!');
      setIsModalOpen(false);
      fetchProjectData();
    } catch (error: any) {
      toast.error('Erro ao salvar membro: ' + error.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;
    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Membro removido.');
      fetchProjectData();
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
    }
  };

  const handleExportTeamWorkflows = () => {
    const data = {
      project: project.name,
      exportedAt: new Date().toLocaleString(),
      team: team.map(m => ({
        nome: m.nome,
        cargo: m.cargo,
        nacionalidade: m.nacionalidade,
        idade: m.idade,
        perfil: m.perfil_profissional,
        funcao: m.descricao_funcao
      })),
      workflows: workflows
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VCM_Export_${project.name.replace(/\s+/g, '_')}.json`;
    a.click();
    toast.success('Equipe e Workflows exportados!');
  };

  const handleSaveGenesis = async () => {
    if (!project || !genesisContent.trim()) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: genesisContent })
        .eq('id', project.id);

      if (error) throw error;
      toast.success('Descrição atualizada!');
      setIsEditingGenesis(false);
      fetchProjectData();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    }
  };

  const handleReevaluate = async () => {
    if (!project || !confirm('Isso irá refazer TODA a análise com base na descrição atual. Deseja continuar?')) return;
    setIsReevaluating(true);
    try {
      const response = await fetch('/api/reevaluate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          newDescription: project.description // Use current state description (or genesisContent if we wanted to allow saving first)
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha na reavaliação');
      }

      toast.success('Projeto reavaliado com sucesso!');
      fetchProjectData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsReevaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="container mx-auto py-8">Project not found</div>;
  }

  // Helper to unify access to analysis data (Columns vs Metadata)
  const analysisData: any = {
    ...project,
    ...project.metadata, // Metadata takes precedence for prompt-generated fields that might not be columns
    marketing_strategy: project.marketing_strategy || project.metadata?.marketing_strategy,
    lead_generation_strategy: project.lead_generation_strategy || project.metadata?.lead_generation_strategy,
    business_diagnosis: project.business_diagnosis || project.metadata?.business_diagnosis,
    swot: project.swot || project.metadata?.swot,
    key_metrics: project.key_metrics || project.metadata?.key_metrics,
    risks: project.risks || project.metadata?.risks,
    // New fields specifically from metadata
    why_now: project.metadata?.why_now,
    why_not_100: project.metadata?.why_not_100,
    potential_improvements: project.metadata?.potential_improvements,
    executive_summary: project.executive_summary || project.metadata?.executive_summary
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Link href="/projects-list" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{project.name}</h1>

        <div className="flex gap-2 mt-4">
          <Badge variant="secondary" className="text-sm">{project.status}</Badge>
          <Badge variant="outline" className="text-sm">MVP Mode</Badge>
          {project.id.startsWith('mock-project-') && (
            <Badge variant="destructive" className="text-sm bg-amber-500 hover:bg-amber-600">Simulated Mode</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => window.open(`/projects/${project.id}/report`, '_blank')} className="gap-2 print:hidden">
            <FileText className="w-4 h-4" /> Export PDF (E-book)
          </Button>
          <Button variant="outline" size="sm" onClick={generateMarkdown} className="ml-auto gap-2 print:hidden">
            <Download className="w-4 h-4" /> Export MD
          </Button>
          <Button variant="default" size="sm" onClick={saveToSystem} className="gap-2 bg-indigo-600 hover:bg-indigo-700 print:hidden">
            <Archive className="w-4 h-4" /> Salvar no Sistema
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px] print:hidden">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="execution">Execution Plan</TabsTrigger>
          <TabsTrigger value="team">Virtual Team</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="mt-6 space-y-6">
          {/* Executive Summary & Diagnosis */}
          {project.executive_summary && (
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Resumo Executivo Estratégico
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {typeof project.executive_summary === 'string' ? (
                  isJsonString(project.executive_summary) ? (
                    <StructuredExecutiveSummary data={JSON.parse(project.executive_summary)} />
                  ) : (
                    <div
                      className="text-slate-700 leading-relaxed prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked.parse(project.executive_summary || '') }}
                    />
                  )
                ) : (
                  <StructuredExecutiveSummary data={analysisData.executive_summary} />
                )}

                {(analysisData.business_diagnosis || analysisData.viability_score) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div className="text-center">
                      <p className="text-xs uppercase text-slate-500 font-bold">Viability Score</p>
                      {/* Check legacy path (business_diagnosis.viability_score) OR new path (viability_score.total) */}
                      <div className={`text-3xl font-bold mt-1 inline-block px-3 py-1 rounded-lg ${getViabilityColor(Number(analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score || 0))}`}>
                        {analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score || 0}/100
                      </div>
                      <p className="text-xs font-semibold mt-1 text-slate-600">{getViabilityLabel(Number(analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score || 0))}</p>
                    </div>
                    <div className="col-span-2 space-y-3">
                      <div>
                        <p className="text-xs uppercase text-slate-500 font-bold mb-1">Diagnosis</p>
                        <p className="text-sm text-slate-600">
                          {analysisData.business_diagnosis?.viability_analysis || (typeof analysisData.business_diagnosis?.content === 'string' ? analysisData.business_diagnosis.content : analysisData.business_diagnosis?.content?.content) || analysisData.business_diagnosis?.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-semibold">Why Now:</span>{' '}
                          {analysisData.why_now?.content || (typeof analysisData.why_now === 'string' ? analysisData.why_not : '') || 'N/A'}
                        </p>
                      </div>

                      {/* Why Not 100? */}
                      {analysisData.why_not_100 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                          <h5 className="text-xs font-bold text-slate-700 uppercase mb-1">
                            Why {analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score} and not 100?
                          </h5>
                          <p className="text-xs text-slate-600 mb-2">
                            {analysisData.why_not_100.summary}
                          </p>
                          {analysisData.why_not_100.critical_gaps?.map((gap: any, i: number) => (
                            <div key={i} className="text-xs text-red-600 mb-1 flex gap-1">
                              <span>⚠️</span> <span>{gap.gap} ({gap.impact_on_score})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Potential Improvements */}
                      {analysisData.potential_improvements && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <h5 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-600" /> Potential Improvements
                          </h5>
                          <p className="text-xs text-amber-900 whitespace-pre-line">
                            {analysisData.potential_improvements.content || (typeof analysisData.potential_improvements === 'string' ? analysisData.potential_improvements : JSON.stringify(analysisData.potential_improvements))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Marketing & Lead Gen - Immediately after Viability/Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisData.marketing_strategy && (
              <Card className="border-indigo-100">
                <CardHeader className="bg-indigo-50/50">
                  <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
                    <Rocket className="w-5 h-5 text-indigo-600" /> Marketing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {analysisData.marketing_strategy.value_proposition && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Value Proposition</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100 italic">
                        "{typeof analysisData.marketing_strategy.value_proposition === 'string' ? analysisData.marketing_strategy.value_proposition : analysisData.marketing_strategy.value_proposition?.content}"
                      </p>
                    </div>
                  )}

                  {analysisData.marketing_strategy.target_audience && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Target Audience</h4>
                      <p className="text-sm text-slate-700">
                        {typeof analysisData.marketing_strategy.target_audience === 'string'
                          ? analysisData.marketing_strategy.target_audience
                          : (() => {
                            const ta = analysisData.marketing_strategy.target_audience;
                            return (
                              <span>
                                <span className="font-semibold">Primary:</span> {ta?.primary}<br />
                                <span className="font-semibold">Secondary:</span> {ta?.secondary}
                              </span>
                            );
                          })()
                        }
                      </p>
                    </div>
                  )}

                  {analysisData.marketing_strategy.approach_strategy && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Approach Strategy</h4>
                      <p className="text-sm text-slate-700">
                        {typeof analysisData.marketing_strategy.approach_strategy === 'string' ? analysisData.marketing_strategy.approach_strategy : analysisData.marketing_strategy.approach_strategy?.content}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.marketing_strategy.channels?.map((c: any, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                          {typeof c === 'string' ? c : c.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tactics</h4>
                    <ul className="space-y-1">
                      {analysisData.marketing_strategy.tactics?.map((t: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span> {typeof t === 'string' ? t : `${t.tactic}: ${t.description}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisData.lead_generation_strategy && (
              <Card className="border-emerald-100">
                <CardHeader className="bg-emerald-50/50">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                    <Users className="w-5 h-5 text-emerald-600" /> Lead Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Lead Magnets</h4>
                    <ul className="space-y-1">
                      {analysisData.lead_generation_strategy.lead_magnets?.map((m: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">🎁</span> {typeof m === 'string' ? m : `${m.name} - ${m.description}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Conversion Tactics</h4>
                    <ul className="space-y-1">
                      {analysisData.lead_generation_strategy.conversion_tactics?.map((t: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">⚡</span> {typeof t === 'string' ? t : `${t.tactic}: ${t.description}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Key Metrics & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Array.isArray(analysisData.key_metrics) ? (
                    analysisData.key_metrics.map((metric: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        {metric}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-600 whitespace-pre-line">
                      {/* @ts-ignore */}
                      {analysisData.key_metrics?.content || (typeof analysisData.key_metrics === 'string' ? analysisData.key_metrics : <span className="text-slate-400">No metrics defined yet.</span>)}
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Risks & Mitigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Array.isArray(analysisData.risks) ? (
                    analysisData.risks.map((risk: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-600 whitespace-pre-line">
                      {/* @ts-ignore */}
                      {analysisData.risks?.content || (typeof analysisData.risks === 'string' ? analysisData.risks : <span className="text-slate-400">No risks identified yet.</span>)}
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* SWOT */}
          {analysisData.swot && (
            <Card>
              <CardHeader><CardTitle>SWOT Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside text-sm text-green-900">{analysisData.swot.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-bold text-red-800 mb-2">Weaknesses</h4>
                    <ul className="list-disc list-inside text-sm text-red-900">{analysisData.swot.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">Opportunities</h4>
                    <ul className="list-disc list-inside text-sm text-blue-900">{analysisData.swot.opportunities?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-bold text-orange-800 mb-2">Threats</h4>
                    <ul className="list-disc list-inside text-sm text-orange-900">{analysisData.swot.threats?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Genesis / Description - Moved inside Strategy for cohesive report */}
          <div className="mt-8 pt-8 border-t border-slate-200 print:break-before-page">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm border-l-4 border-l-indigo-500 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <Quote className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">Gênese do Projeto</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">O Conceito Original</p>
                </div>
                <div className="flex gap-2 print:hidden z-10 relative">
                  {!isEditingGenesis ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setGenesisContent(project.description || ''); setIsEditingGenesis(true); }} className="gap-2 text-slate-500 hover:text-indigo-600">
                        <Pencil className="w-4 h-4" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReevaluate} disabled={isReevaluating} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        {isReevaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {isReevaluating ? 'Reavaliando...' : 'Reavaliar'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingGenesis(false)} className="text-slate-500">
                        Cancelar
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveGenesis} className="bg-indigo-600 hover:bg-indigo-700">
                        Salvar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditingGenesis ? (
                <textarea
                  className="w-full text-slate-600 leading-relaxed border border-indigo-200 rounded-md p-4 min-h-[150px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={genesisContent}
                  onChange={(e) => setGenesisContent(e.target.value)}
                />
              ) : (
                <div
                  className="text-slate-600 leading-relaxed markdown-content italic font-light text-xl pl-4 border-l-2 border-slate-100 prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(project.description || '') }}
                />
              )}

              {/* Subtle decor */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                <Lightbulb className="w-32 h-32" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          <ExecutionPlanTab
            project={project}
            onUpdate={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HRManagerChat
                projectId={project.id}
                mode="team"
                onUpdate={fetchProjectData}
                currentData={{ team }}
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Equipe do Projeto</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportTeamWorkflows} className="gap-2">
                    <FileJson className="w-4 h-4" /> Exportar Dados
                  </Button>
                  <Button size="sm" onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="gap-2 bg-indigo-600">
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member) => (
                  <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-slate-100 p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.nome?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{member.nome}</h4>
                        <p className="text-sm text-indigo-600 font-medium">{member.cargo}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => { setEditingMember(member); setIsModalOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteMember(member.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      {(member.nacionalidade || member.idade) && (
                        <div className="flex gap-3 text-[10px] uppercase font-bold text-slate-400 border-b pb-2 mb-2">
                          {member.nacionalidade && <span>🌍 {member.nacionalidade}</span>}
                          {member.idade && <span>🎂 {member.idade} anos</span>}
                        </div>
                      )}
                      {member.perfil_profissional && (
                        <p className="text-xs font-semibold text-slate-500 line-clamp-2">{member.perfil_profissional}</p>
                      )}
                      <p className="text-sm text-slate-600">{member.descricao_funcao}</p>
                      <div className="flex flex-wrap gap-1">
                        {member.tracos_personalidade?.map((trait: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {team.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No team members yet. Talk to the HR Manager to build your team!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <WorkflowsTab
            workflows={workflows}
            team={team}
            projectId={project.id}
            onUpdate={fetchProjectData}
          />
        </TabsContent>
      </Tabs>



      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        member={editingMember}
      />
    </div>
  );
}
