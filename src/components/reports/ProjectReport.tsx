import React from 'react';
import { Project } from '@/types/project';
import { Target, Rocket, Users, Workflow, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface ProjectReportProps {
    project: Project;
    team: any[];
    workflows: any[];
}

export default function ProjectReport({ project, team, workflows }: ProjectReportProps) {
    const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const analysisData: any = {
        ...project,
        ...project.metadata,
        marketing_strategy: project.marketing_strategy || project.metadata?.marketing_strategy,
        lead_generation_strategy: project.lead_generation_strategy || project.metadata?.lead_generation_strategy,
        business_diagnosis: project.business_diagnosis || project.metadata?.business_diagnosis,
        swot: project.swot || project.metadata?.swot,
        key_metrics: project.key_metrics || project.metadata?.key_metrics,
        risks: project.risks || project.metadata?.risks,
        executive_summary: project.executive_summary || project.metadata?.executive_summary
    };

    const getViabilityColor = (score: number) => {
        if (score < 60) return 'text-red-700 bg-red-50 border-red-200';
        if (score >= 60 && score < 75) return 'text-amber-700 bg-amber-50 border-amber-200';
        if (score >= 75 && score < 90) return 'text-lime-700 bg-lime-50 border-lime-200';
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    };

    const SectionTitle = ({ icon: Icon, title, color = "text-slate-900" }: { icon?: any, title: string, color?: string }) => (
        <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-100 pb-2 break-inside-avoid">
            {Icon && <Icon className={`w-8 h-8 ${color}`} />}
            <h2 className={`text-2xl font-bold uppercase tracking-tight ${color}`}>{title}</h2>
        </div>
    );

    return (
        <div className="max-w-[210mm] mx-auto bg-white min-h-screen text-slate-800 font-sans print:max-w-none">



            {/* --- HEADER --- */}
            <div className="px-12 pt-12 pb-6 border-b border-slate-200 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{project.name}</h1>
                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">Strategic Analysis Report</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1 justify-end">
                        <div className="w-4 h-4 rounded bg-indigo-600"></div>
                        <span>BUILDER</span>
                    </div>
                    <p className="text-xs text-slate-400">{date}</p>
                </div>
            </div>

            {/* --- SECTION 1: STRATEGY --- */}
            <div className="p-12 print:break-after-page">
                <SectionTitle icon={Target} title="Strategic Analysis" color="text-indigo-700" />

                {/* Executive Summary */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold uppercase text-slate-500 mb-4">Executive Summary</h3>
                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 leading-relaxed text-slate-700">
                        {(() => {
                            const es = analysisData.executive_summary;
                            if (typeof es === 'string') {
                                try {
                                    const parsed = JSON.parse(es);
                                    return (
                                        <div className="space-y-4">
                                            {parsed.investment_thesis && (
                                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded text-sm">
                                                    <strong className="block text-indigo-900 uppercase mb-1">Investment Thesis</strong>
                                                    {parsed.investment_thesis}
                                                </div>
                                            )}
                                            {parsed.solution_overview && (
                                                <div><strong className="block text-slate-900 mb-1">Solution Overview</strong>{parsed.solution_overview}</div>
                                            )}
                                            {parsed.opportunity_statement && (
                                                <div><strong className="block text-slate-900 mb-1">Opportunity</strong>{parsed.opportunity_statement}</div>
                                            )}
                                            {parsed.market_positioning && (
                                                <div className="italic text-slate-600 border-l-2 border-indigo-300 pl-3">"{parsed.market_positioning}"</div>
                                            )}
                                            {parsed.content && <div className="mt-4 whitespace-pre-line">{parsed.content}</div>}
                                        </div>
                                    );
                                } catch {
                                    return <div dangerouslySetInnerHTML={{ __html: es }} />;
                                }
                            }
                            // Object Fallback
                            return (
                                <div className="space-y-4">
                                    {es?.investment_thesis && <p><strong>Thesis:</strong> {es.investment_thesis}</p>}
                                    {es?.content && <p className="whitespace-pre-line">{es.content}</p>}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Diagnosis / Viability */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-lg font-bold uppercase text-slate-500 mb-4">Diagnosis & Viability</h3>

                    {/* Score & Main Diagnosis */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div className={`col-span-1 p-6 rounded-xl border flex flex-col items-center justify-center text-center ${getViabilityColor(Number(analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score || 0))}`}>
                            <span className="text-5xl font-extrabold mb-2">
                                {analysisData.viability_score?.total || analysisData.business_diagnosis?.viability_score || 0}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-wider">Viability Score</span>
                        </div>
                        <div className="col-span-2 bg-white border border-slate-200 p-6 rounded-xl space-y-3">
                            <div>
                                <strong className="text-xs uppercase text-slate-500 block mb-1">Analysis</strong>
                                <p className="text-slate-700 leading-relaxed text-sm">
                                    {analysisData.business_diagnosis?.viability_analysis ||
                                        (typeof analysisData.business_diagnosis?.content === 'string' ? analysisData.business_diagnosis.content : analysisData.business_diagnosis?.content?.content) ||
                                        analysisData.business_diagnosis?.content}
                                </p>
                            </div>
                            <div>
                                <strong className="text-xs uppercase text-slate-500 block mb-1">Why Now</strong>
                                <p className="text-slate-600 text-sm">
                                    {analysisData.why_now?.content || (typeof analysisData.why_now === 'string' ? analysisData.why_now : '') || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Why Not 100 & Improvements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Why Not 100 */}
                        {analysisData.why_not_100 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <h5 className="text-xs font-bold text-slate-700 uppercase mb-2">Critical Gaps</h5>
                                <p className="text-xs text-slate-600 mb-3 italic">{analysisData.why_not_100.summary}</p>
                                <ul className="space-y-1">
                                    {analysisData.why_not_100.critical_gaps?.map((gap: any, i: number) => (
                                        <li key={i} className="text-xs text-red-700 flex gap-2">
                                            <span>⚠️</span> <span>{gap.gap} <strong>({gap.impact_on_score})</strong></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvements */}
                        {analysisData.potential_improvements && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h5 className="text-xs font-bold text-amber-800 uppercase mb-2">Potential Improvements</h5>
                                <p className="text-xs text-amber-900 whitespace-pre-line leading-relaxed">
                                    {analysisData.potential_improvements.content || (typeof analysisData.potential_improvements === 'string' ? analysisData.potential_improvements : JSON.stringify(analysisData.potential_improvements))}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Marketing & Leads */}
                <div className="grid grid-cols-2 gap-8 break-inside-avoid">
                    {analysisData.marketing_strategy && (
                        <div>
                            <h3 className="text-lg font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                <Rocket className="w-5 h-5" /> Marketing
                            </h3>
                            <div className="space-y-4">
                                {analysisData.marketing_strategy.value_proposition && (
                                    <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                                        <strong className="block text-indigo-900 text-xs uppercase mb-1">Value Proposition</strong>
                                        <p className="text-sm text-indigo-800 italic">
                                            "{typeof analysisData.marketing_strategy.value_proposition === 'string' ? analysisData.marketing_strategy.value_proposition : analysisData.marketing_strategy.value_proposition?.content}"
                                        </p>
                                    </div>
                                )}

                                {analysisData.marketing_strategy.target_audience && (
                                    <div className="p-3 border border-slate-100 rounded">
                                        <strong className="block text-slate-500 text-xs uppercase mb-1">Target Audience</strong>
                                        <div className="text-sm text-slate-700">
                                            {typeof analysisData.marketing_strategy.target_audience === 'string'
                                                ? analysisData.marketing_strategy.target_audience
                                                : (
                                                    <div className="grid grid-cols-1 gap-1">
                                                        <p><span className="font-semibold">Primary:</span> {analysisData.marketing_strategy.target_audience?.primary}</p>
                                                        <p><span className="font-semibold">Secondary:</span> {analysisData.marketing_strategy.target_audience?.secondary}</p>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                )}

                                {analysisData.marketing_strategy.tactics && (
                                    <div>
                                        <strong className="block text-slate-500 text-xs uppercase mb-1">Tactics</strong>
                                        <ul className="text-xs space-y-1 text-slate-600">
                                            {analysisData.marketing_strategy.tactics?.map((t: any, i: number) => (
                                                <li key={i}>• {typeof t === 'string' ? t : `${t.tactic}: ${t.description}`}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {analysisData.lead_generation_strategy && (
                        <div>
                            <h3 className="text-lg font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Leads
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                                    <strong className="block text-emerald-900 text-xs uppercase mb-2">Lead Magnets</strong>
                                    <ul className="list-disc list-inside text-sm text-emerald-800">
                                        {analysisData.lead_generation_strategy.lead_magnets?.map((m: any, i: number) => (
                                            <li key={i}>{typeof m === 'string' ? m : `${m.name}`}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <strong className="block text-slate-500 text-xs uppercase mb-2">Acquisition Channels</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisData.marketing_strategy?.channels?.map((c: any, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-white rounded border border-emerald-200 text-xs font-semibold text-emerald-700">
                                                {typeof c === 'string' ? c : c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {analysisData.lead_generation_strategy.conversion_tactics && (
                                    <div>
                                        <strong className="block text-slate-500 text-xs uppercase mb-1">Conversion Tactics</strong>
                                        <ul className="text-xs space-y-1 text-slate-600">
                                            {analysisData.lead_generation_strategy.conversion_tactics?.map((t: any, i: number) => (
                                                <li key={i}>• {typeof t === 'string' ? t : `${t.tactic}: ${t.description}`}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- SECTION 2: EXECUTION PLAN --- */}
            <div className="p-12 print:break-after-page">
                <SectionTitle icon={CheckCircle} title="Execution Plan" color="text-amber-700" />

                {/* Systems & Modules */}
                <div className="mb-10">
                    <h3 className="text-lg font-bold uppercase text-slate-500 mb-6">Systems Architecture</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {project.systems_modules?.map((mod: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 break-inside-avoid shadow-sm">
                                <h4 className="font-bold text-slate-800 text-lg mb-2">{mod.module_name}</h4>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{mod.description}</p>
                                {mod.tech_stack_recommendation && (
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-500 uppercase">Tech Stack:</span>
                                        <span className="ml-2 text-indigo-600 font-medium">{mod.tech_stack_recommendation}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Roadmap */}
                <div>
                    <h3 className="text-lg font-bold uppercase text-slate-500 mb-6">Development Roadmap</h3>
                    <div className="space-y-4">
                        {project.roadmap?.map((phase: any, idx: number) => (
                            <div key={idx} className="flex gap-4 break-inside-avoid">
                                <div className="w-24 text-right pt-2">
                                    <span className="block font-bold text-slate-900">{phase.phase}</span>
                                    <span className="block text-xs text-slate-500">{phase.duration}</span>
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 relative">
                                    <div className="absolute top-4 -left-2 w-4 h-4 bg-slate-200 rotate-45 transform"></div>
                                    <ul className="space-y-1">
                                        {phase.deliverables?.map((del: any, dIdx: number) => (
                                            <li key={dIdx} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="text-slate-400">•</span>
                                                {typeof del === 'string' ? del : del.task}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: VIRTUAL TEAM --- */}
            <div className="p-12 print:break-after-page">
                <SectionTitle icon={Users} title="Virtual Team" color="text-blue-700" />

                <div className="grid grid-cols-2 gap-6">
                    {team.map((member, idx) => (
                        <div key={idx} className="flex gap-4 bg-white border border-slate-200 rounded-xl p-5 break-inside-avoid shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                                {member.gender === 'female' ? '👩‍💼' : '👨‍💼'}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-slate-900">{member.nome}</h4>
                                <p className="text-sm font-medium text-indigo-600 mb-2">{member.cargo}</p>
                                <p className="text-xs text-slate-500 mb-2 leading-relaxed line-clamp-3">
                                    {member.perfil_profissional}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full uppercase tracking-wide">
                                        {member.nacionalidade}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>



        </div>
    );
}
