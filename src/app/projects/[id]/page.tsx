
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
import { FileText, Lightbulb, Download, Target, Briefcase, TrendingUp, AlertTriangle, Users, Rocket, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ExecutionPlanTab from '@/components/dashboard/ExecutionPlanTab';
import WorkflowsTab from '@/components/dashboard/WorkflowsTab';
import HRManagerChat from '@/components/dashboard/HRManagerChat';

export default function ProjectDashboard() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
    if (!params.id) return;
    
    const projectId = params.id as string;

    // Handle Mock Project
    if (projectId.startsWith('mock-project-')) {
      const savedAnalysis = localStorage.getItem(`mock_analysis_${projectId}`);
      let projectData: any = {};

      if (savedAnalysis) {
          const analysis = JSON.parse(savedAnalysis);
          projectData = {
            id: projectId,
            name: analysis.project_name || 'Mock Project',
            description: analysis.tagline || 'Generated via Mock/Fallback Mode',
            mission: analysis.mission,
            vision: analysis.vision,
            values: analysis.values || [],
            objectives: analysis.objectives || [],
            target_audience: analysis.target_audience,
            pain_points: analysis.pain_points || [],
            marketing_strategy: analysis.marketing_strategy || [],
            swot: analysis.swot || {},
            revenue_streams: analysis.revenue_streams || [],
            status: 'planning',
            systems_modules: analysis.systems_and_modules || [],
            roadmap: analysis.roadmap || [],
            backlog: analysis.backlog_preview || [],
            executive_summary: analysis.executive_summary,
            business_diagnosis: analysis.business_potential_diagnosis,
            improvements: analysis.improvement_suggestions || [],
            key_metrics: analysis.key_metrics || [],
            risks: analysis.risks_and_gaps || [],
            ideas: {
                title: analysis.project_name,
                description: 'Original idea analysis'
            }
          };
      } else {
          // Hardcoded fallback
          projectData = {
            id: projectId,
            name: 'Mock Project (Hardcoded)',
            description: 'This is a simulated project.',
            status: 'planning',
            systems_modules: [],
            roadmap: [],
            backlog: [],
            key_metrics: [],
            risks: [],
            ideas: { title: 'Mock Idea', description: 'Test' }
          };
      }

      setProject(projectData);
      
      // Mock Team
      setTeam([
          { 
            id: 'mock-p1', 
            nome: 'Alice', 
            cargo: 'CEO', 
            descricao_funcao: 'Strategy', 
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
            responsibilities: ['Vision'],
            kpis: ['Growth'],
            tracos_personalidade: ['Visionary']
          }
      ]);

      // Mock Workflows
      setWorkflows([]);
      
      setLoading(false);
      return;
    }

    // Fetch Project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*, ideas(*)')
      .eq('id', params.id)
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
      executive_summary: projectData.executive_summary || projectData.metadata?.executive_summary,
      business_diagnosis: projectData.metadata?.business_potential_diagnosis || projectData.metadata?.business_diagnosis,
      key_metrics: projectData.metadata?.key_metrics,
      risks: projectData.metadata?.risks_and_gaps,
      pain_points: projectData.pain_points || projectData.metadata?.pain_points,
      improvements: projectData.metadata?.improvement_suggestions || projectData.metadata?.improvements || projectData.improvements
    });

    // Fetch Team & Workflows (via Empresa link)
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('project_id', params.id)
      .single();

    if (empresa) {
      const { data: teamData } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', empresa.id);
      
      if (teamData) setTeam(teamData);

      // Workflows - Use Metadata (NoSQL approach for MVP)
      const workflowsFromMetadata = projectData.metadata?.workflows || [];
      setWorkflows(workflowsFromMetadata);
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
        <h1 className="text-4xl font-bold text-slate-900">{project.name}</h1>
        <p className="text-xl text-slate-600 max-w-3xl">{project.description}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-sm">{project.status}</Badge>
          <Badge variant="outline" className="text-sm">MVP Mode</Badge>
          {project.id.startsWith('mock-project-') && (
             <Badge variant="destructive" className="text-sm bg-amber-500 hover:bg-amber-600">Simulated Mode</Badge>
          )}
          <Button variant="outline" size="sm" onClick={generateMarkdown} className="ml-auto gap-2">
             <Download className="w-4 h-4"/> Export Analysis (MD)
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
            <Card className="bg-slate-50 border-slate-200">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <FileText className="h-5 w-5 text-slate-700" />
                   Executive Summary
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.executive_summary}</p>
                 
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
                                  <Lightbulb className="w-4 h-4 text-amber-600"/> Potential Improvements
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
          
          {/* Key Metrics & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-5 h-5 text-blue-600"/> Key Metrics
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <ul className="space-y-3">
                      {project.key_metrics?.map((metric: string, i: number) => (
                         <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"/>
                            {metric}
                         </li>
                      )) || <p className="text-sm text-slate-400">No metrics defined yet.</p>}
                   </ul>
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 text-red-600"/> Risks & Mitigation
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <ul className="space-y-3">
                      {project.risks?.map((risk: string, i: number) => (
                         <li key={i} className="flex gap-2 text-sm text-slate-600">
                            <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"/>
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
                        <ul className="list-disc list-inside text-sm text-green-900">{project.swot.strengths?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                     </div>
                     <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-bold text-red-800 mb-2">Weaknesses</h4>
                        <ul className="list-disc list-inside text-sm text-red-900">{project.swot.weaknesses?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-bold text-blue-800 mb-2">Opportunities</h4>
                        <ul className="list-disc list-inside text-sm text-blue-900">{project.swot.opportunities?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                     </div>
                     <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-bold text-orange-800 mb-2">Threats</h4>
                        <ul className="list-disc list-inside text-sm text-orange-900">{project.swot.threats?.map((s,i) => <li key={i}>{s}</li>)}</ul>
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
                   <h3 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5"/> Current Team Structure</h3>
                   <Badge variant="outline">{team.length} Members</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {team.map((member) => (
                      <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
                         <div className="bg-slate-100 p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                               <AvatarImage src={member.avatar_url} />
                               <AvatarFallback>{member.nome?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                               <h4 className="font-bold text-slate-800">{member.nome}</h4>
                               <p className="text-sm text-indigo-600 font-medium">{member.cargo}</p>
                            </div>
                         </div>
                         <CardContent className="pt-4 space-y-3">
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
                         <Users className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
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
    </div>
  );
}
