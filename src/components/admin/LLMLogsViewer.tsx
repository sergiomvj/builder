'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '../../lib/supabase';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Eye,
    Code
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface LLMLog {
    id: string;
    project_id: string | null;
    prompt_type: string;
    full_prompt_sent: string;
    llm_response: any;
    expected_deliverables: string[];
    missing_deliverables: string[];
    status: 'success' | 'partial_failure' | 'error';
    created_at: string;
}

export function LLMLogsViewer() {
    const [logs, setLogs] = useState<LLMLog[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabase();

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('llm_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // Limit to last 50 for performance

        if (!error && data) {
            setLogs(data as LLMLog[]);
        } else {
            console.error('Error fetching logs:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'partial_failure':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <span className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    📜 Histórico de Consultas LLM
                </h2>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="p-2 text-sm bg-white border rounded hover:bg-slate-50 flex items-center gap-1"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Data/Hora</th>
                                <th className="px-4 py-3">Validação</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                        Nenhum registro encontrado. Execute uma análise para gerar logs.
                                    </td>
                                </tr>
                            )}

                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">{getStatusIcon(log.status)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700">{log.prompt_type}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.missing_deliverables && log.missing_deliverables.length > 0 ? (
                                            <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">
                                                Faltando: {log.missing_deliverables.join(', ')}
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded border border-green-100">
                                                Completo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="text-indigo-600 hover:text-indigo-800 p-1">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Detalhes da Consulta</DialogTitle>
                                                    <DialogDescription>ID: {log.id} | Tipo: {log.prompt_type}</DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4 mt-4">
                                                    {/* Validation Summary */}
                                                    <div className={`p-4 rounded-md border ${log.missing_deliverables?.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                                        <h4 className={`font-bold pb-2 border-b ${log.missing_deliverables?.length > 0 ? 'text-red-700 border-red-200' : 'text-green-700 border-green-200'}`}>
                                                            Resumo da Validação
                                                        </h4>
                                                        <div className="mt-2 text-sm grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="font-semibold text-slate-600 block mb-1">Esperado:</span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {log.expected_deliverables?.map(k => (
                                                                        <span key={k} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border">{k}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-slate-600 block mb-1">Faltando:</span>
                                                                {log.missing_deliverables?.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {log.missing_deliverables.map(k => (
                                                                            <span key={k} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs border border-red-200">{k}</span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-green-600 italic">Nenhum (Sucesso total)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Response Viewer */}
                                                    <div>
                                                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                                            <Code className="w-4 h-4" /> Resposta da LLM
                                                        </h4>
                                                        <pre className="bg-slate-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono max-h-96">
                                                            {JSON.stringify(log.llm_response, null, 2)}
                                                        </pre>
                                                    </div>

                                                    {/* Prompt Viewer */}
                                                    <div>
                                                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                                            <Code className="w-4 h-4" /> Prompt Enviado
                                                        </h4>
                                                        <pre className="bg-slate-100 text-slate-600 p-4 rounded-md overflow-x-auto text-xs font-mono max-h-60 whitespace-pre-wrap">
                                                            {log.full_prompt_sent}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
