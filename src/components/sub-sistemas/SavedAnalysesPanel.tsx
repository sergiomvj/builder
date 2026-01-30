'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText,
    Trash2,
    Eye,
    Calendar,
    Search,
    TrendingUp,
    AlertCircle,
    Clock,
    Download,
    Target,
    Database,
    Package,
    GitBranch,
    ListTodo
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SavedAnalysis {
    id: string;
    title: string;
    summary: string;
    content: any;
    analysis_type: string;
    created_at: string;
    empresa_id: string;
}

export default function SavedAnalysesPanel({ empresaId }: { empresaId?: string }) {
    const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);

    useEffect(() => {
        fetchAnalyses();
    }, [empresaId]);

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const url = empresaId
                ? `/api/analyses?empresa_id=${empresaId}`
                : '/api/analyses';
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAnalyses(data);
            }
        } catch (error) {
            console.error('Erro ao buscar análises:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta análise?')) return;

        try {
            await fetch(`/api/analyses?id=${id}`, { method: 'DELETE' });
            setAnalyses(analyses.filter(a => a.id !== id));
            if (selectedAnalysis?.id === id) setSelectedAnalysis(null);
        } catch (error) {
            console.error('Erro ao excluir análise:', error);
        }
    };

    const filteredAnalyses = analyses.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
            {/* Sidebar - List of Analyses */}
            <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-3 text-sm">
                    <CardTitle className="text-lg">Analises Salvas</CardTitle>
                    <CardDescription>Revise diagnósticos e estratégias anteriores</CardDescription>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar análises..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full px-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredAnalyses.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                Nenhuma análise encontrada.
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                {filteredAnalyses.map((analysis) => (
                                    <div
                                        key={analysis.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${selectedAnalysis?.id === analysis.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card'
                                            }`}
                                        onClick={() => {
                                            console.log('Selected Analysis Content:', analysis.content);
                                            setSelectedAnalysis(analysis);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-sm line-clamp-1">{analysis.title}</h4>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {analysis.analysis_type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                            {analysis.summary || 'Sem resumo disponível.'}
                                        </p>
                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(analysis.id);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content - Analysis Details */}
            <Card className="md:col-span-2 flex flex-col overflow-hidden">
                {selectedAnalysis ? (
                    <>
                        <CardHeader className="border-b bg-muted/20">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="mb-2 uppercase">{selectedAnalysis.analysis_type}</Badge>
                                    <CardTitle className="text-2xl">{selectedAnalysis.title}</CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Salvo em {new Date(selectedAnalysis.created_at).toLocaleString('pt-BR')}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto py-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-2 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-primary" />
                                        Resumo Executivo
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4 py-1 whitespace-pre-wrap">
                                        "{selectedAnalysis.summary}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Performance Metrics or Key Metrics */}
                                    {(selectedAnalysis.content?.metrics || selectedAnalysis.content?.key_metrics) && (
                                        <Card className="bg-muted/10 border-none shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Métricas e Indicadores</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {selectedAnalysis.content.metrics ?
                                                    Object.entries(selectedAnalysis.content.metrics).map(([key, val]: [string, any]) => (
                                                        <div key={key} className="flex justify-between text-xs border-b border-muted py-1">
                                                            <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                                                            <span className="font-bold">{val}</span>
                                                        </div>
                                                    )) :
                                                    selectedAnalysis.content.key_metrics.map((metric: string, idx: number) => (
                                                        <div key={idx} className="flex items-start space-x-2 text-xs border-b border-muted py-1">
                                                            <Target className="w-3 h-3 text-primary mt-0.5" />
                                                            <span>{metric}</span>
                                                        </div>
                                                    ))
                                                }
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Insights or Diagnosis */}

                                    {(selectedAnalysis.content?.insights || selectedAnalysis.content?.business_diagnosis) && (
                                        <Card className="bg-yellow-50/30 border-none shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Insights e Diagnóstico</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {selectedAnalysis.content.insights ?
                                                    selectedAnalysis.content.insights.map((insight: string, idx: number) => (
                                                        <div key={idx} className="flex items-start space-x-2 text-xs">
                                                            <TrendingUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                                            <span>{insight}</span>
                                                        </div>
                                                    )) :
                                                    <div className="text-xs space-y-2">
                                                        <div className="font-bold text-primary">Score: {selectedAnalysis.content.business_diagnosis?.viability_score}/100</div>
                                                        <p className="italic">"{selectedAnalysis.content.business_diagnosis?.viability_analysis || selectedAnalysis.content.business_diagnosis?.content}"</p>
                                                    </div>
                                                }
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Why Not 100? */}
                                {selectedAnalysis.content?.why_not_100 && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold flex items-center text-orange-700">
                                            <AlertCircle className="w-5 h-5 mr-2" />
                                            Por que não 100?
                                        </h3>
                                        <Card className="bg-orange-50 border-orange-100">
                                            <CardContent className="py-4">
                                                <p className="text-sm font-medium mb-3">{selectedAnalysis.content.why_not_100.summary}</p>
                                                <div className="grid gap-3">
                                                    {selectedAnalysis.content.why_not_100.critical_gaps?.map((gap: any, idx: number) => (
                                                        <div key={idx} className="bg-white/60 p-3 rounded border border-orange-200 text-xs">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-bold text-orange-900">{gap.gap}</span>
                                                                <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">{gap.impact_on_score}</Badge>
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                                                                <span>Pilar: {gap.pillar_affected}</span>
                                                                <span className="uppercase">{gap.severity} Severity</span>
                                                            </div>
                                                            <div className="mt-2 text-orange-800 italic">
                                                                👉 {gap.mitigation_path}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}


                                {/* Potential Improvements */}
                                {selectedAnalysis.content?.potential_improvements && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold flex items-center">
                                            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                                            Melhorias Potenciais
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Array.isArray(selectedAnalysis.content.potential_improvements) ? (
                                                selectedAnalysis.content.potential_improvements.map((imp: any, idx: number) => (
                                                    <Card key={idx} className="bg-slate-50 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                                        <CardHeader className="py-3 px-4 pb-2">
                                                            <div className="flex justify-between items-start">
                                                                <CardTitle className="text-sm font-bold text-blue-900">{imp.improvement}</CardTitle>
                                                                {imp.priority && (
                                                                    <Badge variant={imp.priority.toLowerCase() === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                                        {imp.priority}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="py-2 px-4 text-xs space-y-2">
                                                            <p className="text-slate-600">{imp.description}</p>
                                                            {imp.impact && (
                                                                <div className="flex items-center text-blue-600 font-medium">
                                                                    <Target className="w-3 h-3 mr-1" />
                                                                    Impacto: {imp.impact}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            ) : (
                                                <Card className="col-span-2 bg-slate-50 p-4 text-sm text-slate-600">
                                                    {/* Fallback for old format */}
                                                    {selectedAnalysis.content.potential_improvements.content || JSON.stringify(selectedAnalysis.content.potential_improvements)}
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* SWOT Analysis if available */}
                                {selectedAnalysis.content?.swot && (
                                    <div>
                                        <h3 className="text-sm font-bold mb-2">Análise SWOT</h3>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="p-2 bg-green-50 rounded"><strong>Forças:</strong> {selectedAnalysis.content.swot.strengths?.slice(0, 3).join(', ')}</div>
                                            <div className="p-2 bg-red-50 rounded"><strong>Fraquezas:</strong> {selectedAnalysis.content.swot.weaknesses?.slice(0, 3).join(', ')}</div>
                                        </div>
                                    </div>
                                )}


                                {/* Lead Generation Strategy */}
                                {/* EXECUTION PLAN (Systems, Roadmap, Backlog) */}
                                {(selectedAnalysis.content?.systems_breakdown || selectedAnalysis.content?.roadmap || selectedAnalysis.content?.backlog_preview) && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-bold flex items-center text-slate-800">
                                            <Database className="w-5 h-5 mr-2 text-primary" />
                                            Plano de Execução Técnica
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Systems Breakdown */}
                                            {selectedAnalysis.content?.systems_breakdown && (
                                                <Card className="bg-slate-50 border-slate-200">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-sm font-bold flex items-center">
                                                            <Package className="w-4 h-4 mr-2 text-indigo-600" />
                                                            Arquitetura e Módulos
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {selectedAnalysis.content.systems_breakdown.architecture_notes && (
                                                            <p className="text-xs text-slate-600 italic border-l-2 border-indigo-300 pl-2 mb-2">
                                                                {selectedAnalysis.content.systems_breakdown.architecture_notes}
                                                            </p>
                                                        )}
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {selectedAnalysis.content.systems_breakdown.modules?.map((mod: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs">
                                                                    <div className="font-bold text-indigo-900">{mod.name}</div>
                                                                    <p className="text-slate-600 my-1">{mod.description}</p>
                                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                                                        <Database className="w-3 h-3" />
                                                                        <span className="font-mono">{mod.tech_stack}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Roadmap */}
                                                {selectedAnalysis.content?.roadmap && (
                                                    <Card className="bg-blue-50/50 border-blue-100">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm font-bold flex items-center">
                                                                <GitBranch className="w-4 h-4 mr-2 text-blue-600" />
                                                                Roadmap de Fases
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-2">
                                                            {selectedAnalysis.content.roadmap.phases?.map((phase: any, idx: number) => (
                                                                <div key={idx} className="bg-white/80 p-2 rounded border border-blue-100 text-xs shadow-sm">
                                                                    <div className="flex justify-between font-bold text-blue-900">
                                                                        <span>{phase.name}</span>
                                                                        <span className="text-blue-600">{phase.duration}</span>
                                                                    </div>
                                                                    <p className="text-blue-800 my-1">{phase.goal}</p>
                                                                    <div className="space-y-1 mt-1">
                                                                        {phase.deliverables?.map((del: string, i: number) => (
                                                                            <div key={i} className="flex items-center gap-1 text-[10px] text-slate-600">
                                                                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                                                                <span>{del}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Backlog Preview */}
                                                {selectedAnalysis.content?.backlog_preview && (
                                                    <Card className="bg-emerald-50/50 border-emerald-100">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-sm font-bold flex items-center">
                                                                <ListTodo className="w-4 h-4 mr-2 text-emerald-600" />
                                                                Backlog Inicial
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-2">
                                                                {selectedAnalysis.content.backlog_preview.high_priority_tasks?.map((task: string, idx: number) => (
                                                                    <div key={idx} className="flex items-start gap-2 text-xs bg-white/60 p-2 rounded border border-emerald-100">
                                                                        <div className="mt-0.5 w-3 h-3 border border-emerald-400 rounded-sm"></div>
                                                                        <span className="text-emerald-900">{task}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Lead Generation Strategy */}
                                {selectedAnalysis.content?.lead_generation_strategy && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-bold flex items-center">
                                            <Target className="w-5 h-5 mr-2 text-primary" />
                                            Estratégia de Geração de Leads
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Lead Magnets */}
                                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                <h4 className="font-semibold text-sm mb-3 flex items-center text-purple-700">
                                                    🧲 Lead Magnets
                                                </h4>
                                                <div className="space-y-3">
                                                    {selectedAnalysis.content.lead_generation_strategy.lead_magnets?.map((magnet: any, idx: number) => (
                                                        <div key={idx} className="bg-purple-50 p-3 rounded border border-purple-100">
                                                            <div className="font-medium text-sm text-purple-900">{magnet.name}</div>
                                                            <p className="text-xs text-purple-700 mt-1">{magnet.description}</p>
                                                            {magnet.target && (
                                                                <div className="text-[10px] text-purple-600 mt-1 font-medium uppercase tracking-wide">
                                                                    Alvo: {magnet.target}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Conversion Tactics */}
                                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                                <h4 className="font-semibold text-sm mb-3 flex items-center text-emerald-700">
                                                    ⚡ Táticas de Conversão
                                                </h4>
                                                <div className="space-y-3">
                                                    {selectedAnalysis.content.lead_generation_strategy.conversion_tactics?.map((tactic: any, idx: number) => (
                                                        <div key={idx} className="bg-emerald-50 p-3 rounded border border-emerald-100">
                                                            <div className="font-medium text-sm text-emerald-900">{tactic.tactic}</div>
                                                            <p className="text-xs text-emerald-700 mt-1">{tactic.description}</p>
                                                            {tactic.expected_rate && (
                                                                <div className="text-[10px] text-emerald-600 mt-1 font-medium uppercase tracking-wide">
                                                                    Conv. Esp.: {tactic.expected_rate}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedAnalysis.content?.notes && (
                                    <div>
                                        <h3 className="text-sm font-bold mb-2 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                                            Observações Adicionais
                                        </h3>
                                        <div className="bg-muted/20 p-4 rounded-lg text-sm text-foreground/80 whitespace-pre-wrap">
                                            {selectedAnalysis.content.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/10 py-3">
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between w-full">
                                <span>ID: {selectedAnalysis.id}</span>
                                <span>UUID Empresa: {selectedAnalysis.empresa_id}</span>
                            </div>
                        </CardFooter>
                    </>
                ) : (
                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-10">
                        <div className="bg-muted/50 p-6 rounded-full mb-4">
                            <FileText className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Nenhuma Análise Selecionada</h3>
                        <p className="text-muted-foreground italic max-w-sm">
                            Selecione uma análise na barra lateral para visualizar os detalhes, métricas e recomendações salvas.
                        </p>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
