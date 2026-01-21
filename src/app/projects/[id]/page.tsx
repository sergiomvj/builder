
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Project } from '@/types/project';
import { FileText, Lightbulb, Download, Target, Briefcase, TrendingUp, AlertTriangle, Users, Rocket, Shield, Archive, Quote, Plus, Pencil, Trash2, FileJson } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ExecutionPlanTab from '@/components/dashboard/ExecutionPlanTab';
import WorkflowsTab from '@/components/dashboard/WorkflowsTab';
import HRManagerChat from '@/components/dashboard/HRManagerChat';
import TeamMemberModal from '@/components/dashboard/TeamMemberModal';
import { marked } from 'marked';

export default function ProjectDashboard() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

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
      setLoading(false);
      return;
    }

    setProject({
      ...projectData,
      systems_modules: projectData.metadata?.systems_and_modules || projectData.metadata?.systems_modules,
      backlog: projectData.metadata?.backlog_preview || projectData.metadata?.backlog,
      roadmap: projectData.roadmap || projectData.metadata?.roadmap,
      swot: projectData.swot || projectData.metadata?.swot,
      marketing_strategy: projectData.marketing_strategy || projectData.metadata?.marketing_strategy,
      lead_generation_strategy: projectData.lead_generation_strategy || projectData.metadata?.lead_generation_strategy,
      executive_summary: projectData.executive_summary || projectData.metadata?.executive_summary,
      business_diagnosis: projectData.metadata?.business_potential_diagnosis || projectData.metadata?.business_diagnosis,
      key_metrics: projectData.metadata?.key_metrics,
      risks: projectData.metadata?.risks_and_gaps,
      pain_points: projectData.pain_points || projectData.metadata?.pain_points,
      improvements: projectData.metadata?.improvement_suggestions || projectData.metadata?.improvements || projectData.improvements
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

    let md = `# ${project.name}\n\n`;
    md += `**Tagline:** ${project.description}\n\n`;
    md += `## Executive Summary\n${project.executive_summary}\n\n`;

    if (project.business_diagnosis) {
      md += `## Business Diagnosis\n`;
      md += `- Viability Score: ${project.business_diagnosis.viability_score}/100\n`;
      md += `- Analysis: ${project.business_diagnosis.viability_analysis}\n`;
      md += `- Why Now: ${project.business_diagnosis.compelling_reason}\n\n`;
    }

    if (project.mission) md += `## Mission\n${project.mission}\n\n`;
    if (project.vision) md += `## Vision\n${project.vision}\n\n`;

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
        summary: project.executive_summary?.substring(0, 300) + '...',
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
      // Find or Create Empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('project_id', projectId)
        .single();

      let empresaId = empresa?.id;

      if (!empresaId) {
        const { data: newEmpresa, error: createError } = await supabase
          .from('empresas')
          .insert({ project_id: projectId, nome: project.name })
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

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>Projects</span>
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
          <Button variant="outline" size="sm" onClick={generateMarkdown} className="ml-auto gap-2">
            <Download className="w-4 h-4" /> Export Analysis (MD)
          </Button>
          <Button variant="default" size="sm" onClick={saveToSystem} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Archive className="w-4 h-4" /> Salvar no Sistema
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
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
                <div
                  className="text-slate-700 leading-relaxed prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(project.executive_summary || '') }}
                />

                {project.business_diagnosis && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div className="text-center">
                      <p className="text-xs uppercase text-slate-500 font-bold">Viability Score</p>
                      <div className={`text-3xl font-bold mt-1 inline-block px-3 py-1 rounded-lg ${getViabilityColor(Number(project.business_diagnosis.viability_score))}`}>
                        {project.business_diagnosis.viability_score}/100
                      </div>
                      <p className="text-xs font-semibold mt-1 text-slate-600">{getViabilityLabel(Number(project.business_diagnosis.viability_score))}</p>
                    </div>
                    <div className="col-span-2 space-y-3">
                      <div>
                        <p className="text-xs uppercase text-slate-500 font-bold mb-1">Diagnosis</p>
                        <p className="text-sm text-slate-600">{project.business_diagnosis.viability_analysis}</p>
                        <p className="text-xs text-slate-500 mt-1"><span className="font-semibold">Why Now:</span> {project.business_diagnosis.compelling_reason}</p>
                      </div>

                      {(Number(project.business_diagnosis.viability_score) < 99 || project.improvements?.length > 0) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <h5 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-600" /> Potential Improvements
                          </h5>
                          <ul className="space-y-1">
                            {project.improvements?.map((imp: string, i: number) => (
                              <li key={i} className="text-xs text-amber-900 flex items-start gap-2">
                                <span className="mt-1 block w-1 h-1 rounded-full bg-amber-500"></span>
                                {imp}
                              </li>
                            ))}
                          </ul>
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
            {project.marketing_strategy && (
              <Card className="border-indigo-100">
                <CardHeader className="bg-indigo-50/50">
                  <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
                    <Rocket className="w-5 h-5 text-indigo-600" /> Marketing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {project.marketing_strategy.value_proposition && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Value Proposition</h4>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100 italic">"{project.marketing_strategy.value_proposition}"</p>
                    </div>
                  )}

                  {project.marketing_strategy.target_audience && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Target Audience</h4>
                      <p className="text-sm text-slate-700">{project.marketing_strategy.target_audience}</p>
                    </div>
                  )}

                  {project.marketing_strategy.approach_strategy && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Approach Strategy</h4>
                      <p className="text-sm text-slate-700">{project.marketing_strategy.approach_strategy}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Channels</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.marketing_strategy.channels?.map((c, i) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tactics</h4>
                    <ul className="space-y-1">
                      {project.marketing_strategy.tactics?.map((t, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.lead_generation_strategy && (
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
                      {project.lead_generation_strategy.lead_magnets?.map((m, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">🎁</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Conversion Tactics</h4>
                    <ul className="space-y-1">
                      {project.lead_generation_strategy.conversion_tactics?.map((t, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">⚡</span> {t}
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
                  {project.key_metrics?.map((metric: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      {metric}
                    </li>
                  )) || <p className="text-sm text-slate-400">No metrics defined yet.</p>}
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
                  {project.risks?.map((risk: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  )) || <p className="text-sm text-slate-400">No risks identified yet.</p>}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* SWOT */}
          {project.swot && (
            <Card>
              <CardHeader><CardTitle>SWOT Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside text-sm text-green-900">{project.swot.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-bold text-red-800 mb-2">Weaknesses</h4>
                    <ul className="list-disc list-inside text-sm text-red-900">{project.swot.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">Opportunities</h4>
                    <ul className="list-disc list-inside text-sm text-blue-900">{project.swot.opportunities?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-bold text-orange-800 mb-2">Threats</h4>
                    <ul className="list-disc list-inside text-sm text-orange-900">{project.swot.threats?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

      {/* Elegant Original Concept Box - Moved to the bottom */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm border-l-4 border-l-indigo-500 max-w-4xl mx-auto relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <Quote className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Gênese do Projeto</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">O Conceito Original do Idealizador</p>
            </div>
          </div>
          <div
            className="text-slate-600 leading-relaxed markdown-content italic font-light text-xl pl-4 border-l-2 border-slate-100 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: marked.parse(project.description || '') }}
          />

          {/* Subtle decor */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
            <Lightbulb className="w-32 h-32" />
          </div>
        </div>
      </div>

      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
        member={editingMember}
      />
    </div>
  );
}
