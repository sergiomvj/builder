'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/project';
import ProjectReport from '@/components/reports/ProjectReport';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function ReportPage() {
    const params = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!params.id) return;
            const projectId = params.id as string;

            // 1. Fetch Project
            const { data: projectData, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (error) {
                console.error('Error fetching project', error);
                setLoading(false);
                return;
            }

            const executionPlan = projectData.metadata?.execution_plan || {};

            setProject({
                ...projectData,
                systems_modules: projectData.metadata?.systems_and_modules || projectData.metadata?.systems_modules || executionPlan.systems_breakdown,
                backlog: projectData.metadata?.backlog_preview || projectData.metadata?.backlog || executionPlan.backlog_preview,
                roadmap: projectData.roadmap || projectData.metadata?.roadmap || executionPlan.roadmap,
                marketing_strategy: projectData.marketing_strategy || projectData.metadata?.marketing_strategy,
                lead_generation_strategy: projectData.lead_generation_strategy || projectData.metadata?.lead_generation_strategy,
                executive_summary: projectData.executive_summary || projectData.metadata?.executive_summary,
                business_diagnosis: projectData.metadata?.business_potential_diagnosis || projectData.metadata?.business_diagnosis,
                key_metrics: projectData.metadata?.key_metrics || projectData.key_metrics,
                risks: projectData.metadata?.risks_and_gaps || projectData.metadata?.risks,
                pain_points: projectData.pain_points || projectData.metadata?.pain_points,
                improvements: projectData.metadata?.improvement_suggestions || projectData.metadata?.improvements || projectData.improvements || projectData.metadata?.potential_improvements
            });

            // 2. Extract Workflows from Metadata
            setWorkflows(projectData.metadata?.workflows || []);

            // 3. Fetch Team via Empresas
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

            // Auto-print prompt after loading (optional, maybe annoying if debugging)
            // setTimeout(() => window.print(), 1000);
        };

        fetchData();
    }, [params.id]);

    if (loading) return <div className="flex items-center justify-center h-screen">Loading Report...</div>;
    if (!project) return <div className="p-8">Project not found.</div>;

    return (
        <div className="bg-slate-100 min-h-screen">
            {/* Floating Print Button (Hidden in Print) */}
            <div className="fixed top-4 right-4 z-50 print:hidden">
                <Button onClick={() => window.print()} className="shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                </Button>
            </div>

            {/* Report Component */}
            <ProjectReport project={project} team={team} workflows={workflows} />
        </div>
    );
}
