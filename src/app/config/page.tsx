'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw, ChevronDown, ChevronUp, FileText, Activity } from 'lucide-react';
import { LLMLogsViewer } from '../../components/admin/LLMLogsViewer';

interface ConfigItem {
    id: string;
    key: string;
    value: string;
    description: string | null;
}

interface PromptSection {
    key: string;
    title: string;
    description: string;
    defaultFile: string;
    icon: string;
}

const PROMPT_SECTIONS: PromptSection[] = [
    {
        key: 'genesis_prompt',
        title: '🏗️ Análise de Ideia (Business Architect)',
        description: 'Prompt para análise de viabilidade e geração do relatório Genesis completo',
        defaultFile: 'prompts/genesis-analysis.md',
        icon: '🏗️'
    },
    {
        key: 'team_prompt',
        title: '👥 Geração de Equipe (HR Strategist)',
        description: 'Prompt para criar equipe virtual de 5-7 personas C-Level/Heads',
        defaultFile: 'prompts/team-generation.md',
        icon: '👥'
    },
    {
        key: 'workflow_prompt',
        title: '⚡ Geração de Workflows (Automation Architect)',
        description: 'Prompt para identificar os 5-10 workflows de automação mais impactantes',
        defaultFile: 'prompts/workflow-generation.md',
        icon: '⚡'
    }
];

export default function ConfigPage() {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [promptContents, setPromptContents] = useState<Record<string, string>>({});
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        genesis_prompt: true,
        team_prompt: false,
        workflow_prompt: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingPrompts, setLoadingPrompts] = useState(true);
    const [activeTab, setActiveTab] = useState<'prompts' | 'logs'>('prompts');

    useEffect(() => {
        fetchConfigs();
    }, []);

    useEffect(() => {
        if (configs.length > 0) {
            loadPromptFiles();
        }
    }, [configs]);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setConfigs(data.config || []);
        } catch (error) {
            console.error('Error fetching config:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const loadPromptFiles = async () => {
        try {
            const contents: Record<string, string> = {};

            for (const section of PROMPT_SECTIONS) {
                // First check if there's a custom prompt in the database
                const dbConfig = configs.find(c => c.key === section.key);
                const dbValue = dbConfig?.value || '';

                // If database has a value (not empty string or ""), use it
                if (dbValue && dbValue !== '""' && dbValue !== '') {
                    try {
                        // Try to parse if it's JSON string
                        const parsed = JSON.parse(dbValue);
                        contents[section.key] = parsed || '';
                    } catch {
                        // If not JSON, use as is
                        contents[section.key] = dbValue;
                    }
                } else {
                    // Otherwise, load from file via API
                    try {
                        const res = await fetch(`/api/config/defaults?key=${section.key}`);
                        if (res.ok) {
                            const data = await res.json();
                            contents[section.key] = data.content || '';
                        }
                    } catch (e) {
                        console.warn(`Failed to load ${section.defaultFile}`);
                        contents[section.key] = '';
                    }
                }
            }

            setPromptContents(contents);
        } catch (error) {
            console.error('Error loading prompt files:', error);
        } finally {
            setLoadingPrompts(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success('Configuração salva! As próximas análises usarão este prompt.');
            await fetchConfigs();
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const updateConfigValue = (key: string, newValue: string) => {
        setConfigs(configs.map(c =>
            c.key === key ? { ...c, value: newValue } : c
        ));
    };

    const updatePromptContent = (key: string, content: string) => {
        setPromptContents(prev => ({ ...prev, [key]: content }));
    };

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const resetToDefault = async (key: string) => {
        const section = PROMPT_SECTIONS.find(s => s.key === key);
        if (section) {
            try {
                const res = await fetch(`/api/config/defaults?key=${section.key}`);
                if (res.ok) {
                    const data = await res.json();
                    setPromptContents(prev => ({ ...prev, [key]: data.content || '' }));
                    toast.info('Prompt resetado para o padrão do arquivo');
                }
            } catch (e) {
                toast.error('Erro ao carregar arquivo padrão');
            }
        }
    };

    if (loading || loadingPrompts) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-slate-600">Carregando configurações...</div>
            </div>
        );
    }

    const llmProvider = configs.find(c => c.key === 'llm_provider')?.value || 'openai';
    const llmModel = configs.find(c => c.key === 'llm_model')?.value || 'gpt-4o';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
                    </div>
                    <p className="text-slate-600">Gerencie provedor de IA, modelos e prompts personalizados</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-slate-200/50 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'prompts'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Prompts & Modelos
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'logs'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Consulta LLM (Logs)
                    </button>
                </div>

                {activeTab === 'logs' ? (
                    <LLMLogsViewer />
                ) : (
                    <>

                        {/* LLM Provider */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">🤖 Provedor de IA</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Provedor
                                    </label>
                                    <select
                                        value={llmProvider}
                                        onChange={(e) => updateConfigValue('llm_provider', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="openai">OpenAI (Direto)</option>
                                        <option value="openrouter">OpenRouter</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Modelo
                                    </label>
                                    <select
                                        value={llmModel}
                                        onChange={(e) => updateConfigValue('llm_model', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                        <option value="gpt-4o-mini">GPT-4o Mini (Mais rápido)</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    handleSave('llm_provider', llmProvider);
                                    handleSave('llm_model', llmModel);
                                }}
                                disabled={saving}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Salvando...' : 'Salvar Provedor'}
                            </button>
                        </div>

                        {/* Prompts Sections */}
                        <div className="space-y-4">
                            {PROMPT_SECTIONS.map((section) => {
                                const isExpanded = expandedSections[section.key];
                                const currentContent = promptContents[section.key] || '';

                                return (
                                    <div key={section.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                        {/* Header */}
                                        <button
                                            onClick={() => toggleSection(section.key)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{section.icon}</span>
                                                <div className="text-left">
                                                    <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                                                    <p className="text-sm text-slate-600">{section.description}</p>
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Content */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-3 mt-4">
                                                    <p className="text-sm text-slate-600">
                                                        Arquivo padrão: <code className="px-2 py-1 bg-slate-100 rounded text-xs">{section.defaultFile}</code>
                                                    </p>
                                                    <button
                                                        onClick={() => resetToDefault(section.key)}
                                                        className="flex items-center gap-2 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        Resetar para Padrão
                                                    </button>
                                                </div>

                                                <textarea
                                                    value={currentContent}
                                                    onChange={(e) => updatePromptContent(section.key, e.target.value)}
                                                    placeholder={`Carregando prompt de ${section.defaultFile}...`}
                                                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                                                />

                                                <div className="mt-4 flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleSave(section.key, currentContent)}
                                                        disabled={saving}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        {saving ? 'Salvando...' : 'Salvar Prompt'}
                                                    </button>

                                                    <p className="text-sm text-slate-500">
                                                        {currentContent.length} caracteres
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Como funciona</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• O prompt é carregado do arquivo MD automaticamente ao abrir esta página</li>
                                <li>• Você pode editar diretamente no campo de texto</li>
                                <li>• Ao clicar em "Salvar Prompt", ele é salvo no banco de dados</li>
                                <li>• As próximas análises usarão o prompt salvo no banco</li>
                                <li>• Clique em "Resetar para Padrão" para voltar ao conteúdo do arquivo MD</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
