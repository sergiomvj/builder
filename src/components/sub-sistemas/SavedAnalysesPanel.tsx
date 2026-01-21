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
    Download
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
                                        onClick={() => setSelectedAnalysis(analysis)}
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
                                                        <p className="italic">"{selectedAnalysis.content.business_diagnosis?.viability_analysis}"</p>
                                                    </div>
                                                }
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

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
                </div>
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
    </div >
  );
}
