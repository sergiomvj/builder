'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { marked } from 'marked';
import {
  ArrowLeft, ArrowRight, CheckCircle, Rocket, Target, Users, Megaphone,
  BarChart3, Shield, Layers, RefreshCw, Download, FileText, Lightbulb,
  Building, Globe, Zap, TrendingUp, Clock, ChevronRight, Sparkles, Loader2
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const BASE_WIZARD_STEPS: WizardStep[] = [
  { id: 'basics', title: 'Informações Básicas', icon: Building, description: 'Setor, modelo de negócio e fase da empresa' },
  { id: 'group', title: 'Núcleo do Grupo', icon: Layers, description: 'Identidade do grupo, audiências e regras de convivência' },
  { id: 'diagnosis', title: 'Diagnóstico', icon: BarChart3, description: 'Concorrentes, maturidade digital e gaps' },
  { id: 'okrs', title: 'OKRs de Marketing', icon: Target, description: 'Objetivos e resultados-chave alinhados ao grupo' },
  { id: 'audience', title: 'Público-Alvo', icon: Users, description: 'Segmentação detalhada por clusters' },
  { id: 'positioning', title: 'Posicionamento', icon: Megaphone, description: 'UVP, brand personality e tom de voz' },
  { id: 'channels', title: 'Canais', icon: Globe, description: 'Estratégia de canais por estágio do funil' },
  { id: 'action', title: 'Plano de Ação', icon: Rocket, description: 'Sprints de 90 dias com ações imperativas' },
  { id: 'governance', title: 'Governança', icon: Shield, description: 'Ciclo de revisão, aprovação e consolidação' },
  { id: 'review', title: 'Revisão & Geração', icon: Sparkles, description: 'Confirme e gere a estratégia' },
];

const EMPTY_ANSWERS: Record<string, any> = {
  usa_plf: false,
  plf_tipo_lancamento: '',
  plf_promessa: '',
  plf_oferta: '',
  plf_preco: '',
  plf_duracao_carrinho: '',
  setor: '',
  modelo_negocio: '',
  fase: '',
  porte: '',
  faturamento_mensal: '',
  orcamento_marketing_mensal: '',
  diferenciais_competitivos: '',
  grupo_identidade: '',
  grupo_audiencias_macro: '',
  grupo_regras_convivencia: '',
  grupo_posicionamento_mae: '',
  concorrentes_principais: '',
  maturidade_digital: '',
  presenca_digital_atual: '',
  gaps_marketing: '',
  okrs_principais: '',
  alinhamento_grupo: '',
  clusters_publico: '',
  tam_sam_som: '',
  uvp: '',
  brand_personality: '',
  tom_voz: '',
  canais_principais: '',
  budget_alocacao: '',
  prioridades_90_dias: '',
  sprint_1: '',
  sprint_2: '',
  sprint_3: '',
  frequencia_revisao: '',
  aprovacao_niveis: '',
  consolidacao_grupo: '',
  modulos_opcionais: [],
  observacoes_adicionais: '',
};

export default function MarketingStrategyPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [existingStrategy, setExistingStrategy] = useState<any>(null);
  const [activeResultTab, setActiveResultTab] = useState('overview');

  const wizardSteps = [...BASE_WIZARD_STEPS];
  if (answers.usa_plf) {
    wizardSteps.splice(wizardSteps.length - 1, 0, {
      id: 'plf_formula',
      title: 'Launch Formula',
      icon: Rocket,
      description: 'Estratégia de Marketing usando Product Launch Formula (PLF)',
    });
  }

  // Batch AI Generation
  const [selectedAIFields, setSelectedAIFields] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [strategicDocExists, setStrategicDocExists] = useState(false);
  const [isGeneratingStrategicDoc, setIsGeneratingStrategicDoc] = useState(false);
  const strategicDocPollRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(2); // ignora render inicial + restore do banco

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    const { data: projectData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !projectData) {
      toast.error('Projeto não encontrado');
      router.push('/projects-list');
      return;
    }

    setProject(projectData);

    // Verificar se o strategic document já foi gerado
    const { data: strategicDoc } = await supabase
      .from('strategic_documents')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();
    setStrategicDocExists(!!strategicDoc);

    // Check for existing strategy
    try {
      const res = await fetch(`/api/generate-marketing-strategy?projectId=${projectId}`);
      const data = await res.json();
      if (data.strategy) {
        setExistingStrategy(data.strategy);
        if (data.strategy.strategy_data) {
          setGeneratedStrategy(data.strategy.strategy_data);
        }
        if (data.strategy.wizard_answers && Object.keys(data.strategy.wizard_answers).length > 0) {
          setAnswers(prev => ({ ...prev, ...data.strategy.wizard_answers }));
        }
      }
    } catch (e) {
      // No existing strategy
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-save: debounce de 1.5s a cada mudança em `answers`
  useEffect(() => {
    // Ignora renders iniciais (EMPTY_ANSWERS + possível restore do banco)
    if (isFirstLoad.current > 0) {
      isFirstLoad.current -= 1;
      return;
    }
    if (!projectId) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('marketing_strategies')
          .upsert(
            { project_id: projectId, wizard_answers: answers, updated_at: new Date().toISOString() },
            { onConflict: 'project_id' }
          );
        setAutoSaveStatus(error ? 'error' : 'saved');
        // Volta ao idle após 3s
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [answers, projectId]);



  // Quando chega na etapa de Revisão, garante que o strategic doc exista
  const REVIEW_STEP_INDEX = wizardSteps.length - 1;

  const stopStrategicDocPolling = useCallback(() => {
    if (strategicDocPollRef.current) {
      clearInterval(strategicDocPollRef.current);
      strategicDocPollRef.current = null;
    }
  }, []);

  const checkStrategicDocExists = useCallback(async (): Promise<boolean> => {
    const { data } = await supabase
      .from('strategic_documents')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();
    return !!data;
  }, [projectId]);

  useEffect(() => {
    if (currentStep !== REVIEW_STEP_INDEX || !projectId) return;

    // Já encontrado — não faz nada
    if (strategicDocExists) return;

    let cancelled = false;

    const triggerAndPoll = async () => {
      // Dispara a geração diretamente se ainda não existe
      setIsGeneratingStrategicDoc(true);
      try {
        await fetch('/api/generate-strategic-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });
      } catch (e) {
        // Ignora erro da geração — polling vai detectar se funcionou
      }

      if (cancelled) return;

      // Polling a cada 3s para confirmar que o doc foi salvo
      strategicDocPollRef.current = setInterval(async () => {
        if (cancelled) { stopStrategicDocPolling(); return; }
        const exists = await checkStrategicDocExists();
        if (exists) {
          setStrategicDocExists(true);
          setIsGeneratingStrategicDoc(false);
          stopStrategicDocPolling();
        }
      }, 3000);
    };

    triggerAndPoll();

    return () => {
      cancelled = true;
      stopStrategicDocPolling();
    };
  }, [currentStep, REVIEW_STEP_INDEX, projectId, strategicDocExists, checkStrategicDocExists, stopStrategicDocPolling]);


  const updateAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleGenerate = async () => {
    if (!project) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-marketing-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, wizardAnswers: answers }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha na geração');
      }

      const data = await res.json();
      setGeneratedStrategy(data.strategy);
      setExistingStrategy(data.strategy);
      toast.success('Estratégia Central de Marketing gerada com sucesso!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Mapa de chave → label legível (usado no preview e no prompt da LLM)
  const FIELD_LABELS: Record<string, string> = {
    setor: 'Setor / Indústria',
    modelo_negocio: 'Modelo de Negócio',
    fase: 'Fase da Empresa',
    porte: 'Porte da Empresa',
    faturamento_mensal: 'Faturamento Mensal Aproximado',
    orcamento_marketing_mensal: 'Orçamento de Marketing Mensal',
    diferenciais_competitivos: 'Diferenciais Competitivos Principais',
    grupo_identidade: 'Identidade do Grupo (Missão, Visão, Valores)',
    grupo_audiencias_macro: 'Audiências Macro do Grupo',
    grupo_regras_convivencia: 'Regras de Convivência Entre Marcas',
    grupo_posicionamento_mae: 'Posicionamento da Marca Mãe / Holding',
    concorrentes_principais: 'Principais Concorrentes (3-5)',
    maturidade_digital: 'Maturidade Digital',
    presenca_digital_atual: 'Presença Digital Atual',
    gaps_marketing: 'Gaps de Marketing Identificados',
    okrs_principais: 'OKRs de Marketing (3-5 objetivos)',
    alinhamento_grupo: 'Alinhamento com OKR do Grupo',
    clusters_publico: 'Clusters de Público-Alvo',
    tam_sam_som: 'TAM / SAM / SOM Estimado',
    uvp: 'Proposta de Valor Única (UVP)',
    brand_personality: 'Brand Personality (Arquétipos)',
    tom_voz: 'Tom de Voz e Guidelines de Comunicação',
    canais_principais: 'Canais de Marketing',
    budget_alocacao: 'Alocação de Budget (% por canal)',
    prioridades_90_dias: 'Prioridades Absolutas dos 90 dias',
    sprint_1: 'Sprint 1 — Semanas 1-4 (Quick Wins e Fundação)',
    sprint_2: 'Sprint 2 — Semanas 5-8 (Escala e Otimização)',
    sprint_3: 'Sprint 3 — Semanas 9-12 (Consolidação e Expansão)',
    frequencia_revisao: 'Frequência de Revisão da Estratégia',
    aprovacao_niveis: 'Níveis de Aprovação',
    consolidacao_grupo: 'Consolidação com o Grupo',
    observacoes_adicionais: 'Observações Adicionais',
  };

  const toggleAIField = (key: string) => {
    setSelectedAIFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleBatchGenerate = async () => {
    if (selectedAIFields.size === 0 || !project) return;
    setIsGeneratingBatch(true);
    try {
      const res = await fetch('/api/generate-batch-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          selectedFields: Array.from(selectedAIFields),
          fieldsMetadata: FIELD_LABELS,
          currentAnswers: answers,
        }),
      });
      if (!res.ok) throw new Error('Falha ao gerar sugestões em lote');
      const data = await res.json();
      if (data.suggestions && Object.keys(data.suggestions).length > 0) {
        setAiSuggestions(data.suggestions);
        setShowPreview(true);
        toast.success(`${Object.keys(data.suggestions).length} campos gerados com sucesso!`);
      } else {
        toast.error('A IA não retornou sugestões. Tente novamente.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleConfirmSuggestions = () => {
    setAnswers(prev => ({ ...prev, ...aiSuggestions }));
    setShowPreview(false);
    setSelectedAIFields(new Set());
    setAiSuggestions({});
    toast.success(`${Object.keys(aiSuggestions).length} campo(s) aplicado(s) com sucesso!`);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  const handleExport = () => {
    try {
      if (!generatedStrategy) {
        toast.error('Nenhuma estratégia gerada para exportar.');
        return;
      }
      const safeProjectName = project?.name
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase() || 'projeto';

      const blob = new Blob([JSON.stringify(generatedStrategy, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estrategia-marketing-${safeProjectName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Estratégia exportada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar JSON:', error);
      toast.error(`Falha ao exportar em JSON: ${error.message}`);
    }
  };

  const handleExportMarkdown = () => {
    try {
      if (!generatedStrategy) {
        toast.error('Nenhuma estratégia gerada para exportar.');
        return;
      }
      const s = generatedStrategy.estrategia_central_marketing;
      if (!s) {
        toast.error('Estrutura da estratégia central de marketing inválida.');
        return;
      }

      const safeProjectName = project?.name
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase() || 'projeto';

      let md = `# Estratégia Central de Marketing\n\n`;
      md += `**Projeto:** ${project?.name || 'N/A'}\n`;
      md += `**Setor:** ${s.empresa?.setor || 'N/A'} | **Modelo de Negócio:** ${s.empresa?.modelo_negocio || 'N/A'} | **Fase:** ${s.empresa?.fase || 'N/A'}\n\n`;
      md += `**Versão:** ${s.versao || '1.0'}\n\n`;
      md += `---\n\n`;

      // Núcleo do Grupo
      if (s.camada_1_nucleo_grupo?.grupo) {
        md += `## 1. Núcleo do Grupo\n\n`;
        const grupo = s.camada_1_nucleo_grupo.grupo;
        md += `### Identidade do Grupo\n\n`;
        md += `- **Missão:** ${grupo.identidade?.missao || 'N/A'}\n`;
        md += `- **Visão:** ${grupo.identidade?.visao || 'N/A'}\n`;
        md += `- **Valores:** ${Array.isArray(grupo.identidade?.valores) ? grupo.identidade.valores.join(', ') : 'N/A'}\n\n`;
        md += `### Audiências Macro\n\n`;
        md += `${Array.isArray(grupo.audiencias_macro) ? grupo.audiencias_macro.join(', ') : 'N/A'}\n\n`;
        md += `### Regras de Convivência\n\n`;
        md += `${Array.isArray(grupo.regras_convivencia) ? grupo.regras_convivencia.join(', ') : 'N/A'}\n\n`;
        md += `### Posicionamento da Marca Mãe\n\n`;
        md += `${grupo.posicionamento_mae || 'N/A'}\n\n`;
        md += `---\n\n`;
      }

      // Diagnóstico
      if (s.camada_2_modulos_obrigatorios?.diagnostico) {
        const d = s.camada_2_modulos_obrigatorios.diagnostico;
        md += `## 2. Diagnóstico\n\n`;
        md += `### Situação do Mercado\n\n`;
        md += `${d.situacao_atual_mercado || 'N/A'}\n\n`;

        if (d.analise_competitiva && d.analise_competitiva.length > 0) {
          md += `### Análise Competitiva\n\n`;
          d.analise_competitiva.forEach((c: any) => {
            if (!c) return;
            md += `#### ${c.concorrente || 'N/A'}\n\n`;
            md += `- **Posicionamento:** ${c.posicionamento || 'N/A'}\n`;
            md += `- **Nível de Ameaça:** ${c.ameaca_nivel || 'N/A'}\n`;
            md += `- **Pontos Fortes:** ${Array.isArray(c.pontos_fortes) ? c.pontos_fortes.join(', ') : 'N/A'}\n`;
            md += `- **Pontos Fracos:** ${Array.isArray(c.pontos_fracos) ? c.pontos_fracos.join(', ') : 'N/A'}\n\n`;
          });
        }

        if (d.maturidade_digital) {
          md += `### Maturidade Digital\n\n`;
          md += `- **Nível:** ${d.maturidade_digital.nivel || 'N/A'}\n`;
          md += `- **Justificativa:** ${d.maturidade_digital.justificativa || 'N/A'}\n\n`;
        }

        if (d.gaps_marketing && d.gaps_marketing.length > 0) {
          md += `### Gaps de Marketing\n\n`;
          d.gaps_marketing.forEach((g: any) => {
            if (!g) return;
            md += `- **Gap:** ${g.gap || 'N/A'} (Impacto: ${g.impacto || 'N/A'})\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      }

      // OKRs
      if (s.camada_2_modulos_obrigatorios?.okrs) {
        md += `## 3. OKRs de Marketing\n\n`;
        s.camada_2_modulos_obrigatorios.okrs.forEach((okr: any, i: number) => {
          if (!okr) return;
          md += `### Objetivo ${i + 1}: ${okr.objetivo || 'N/A'}\n\n`;
          if (okr.alinhamento_okr_grupo) {
            md += `**Alinhamento com Grupo:** ${okr.alinhamento_okr_grupo}\n\n`;
          }
          md += `#### Key Results\n\n`;
          okr.key_results?.forEach((kr: any, j: number) => {
            if (!kr) return;
            md += `- **KR${j + 1}:** ${kr.kr || 'N/A'}\n`;
            md += `  - Meta: ${kr.meta || 'N/A'}\n`;
            md += `  - Baseline: ${kr.baseline || 'N/A'}\n`;
            md += `  - Timeline: ${kr.timeline || 'N/A'}\n\n`;
          });
          md += `- **Responsável Sugerido:** ${okr.responsavel_sugerido || 'N/A'}\n`;
          md += `- **Confiança:** ${okr.confianca || 'N/A'}\n\n`;
        });
        md += `---\n\n`;
      }

      // Público-Alvo
      if (s.camada_2_modulos_obrigatorios?.publico_alvo) {
        const aud = s.camada_2_modulos_obrigatorios.publico_alvo;
        md += `## 4. Público-Alvo\n\n`;
        if (aud.clusters && aud.clusters.length > 0) {
          aud.clusters.forEach((cluster: any, i: number) => {
            if (!cluster) return;
            md += `### Cluster ${i + 1}: ${cluster.nome_cluster || 'N/A'}\n\n`;
            md += `- **Tamanho Estimado:** ${cluster.tamanho_estimado || 'N/A'}\n\n`;

            if (cluster.demographics && typeof cluster.demographics === 'object') {
              md += `#### Demographics\n\n`;
              Object.entries(cluster.demographics).forEach(([k, v]) => {
                md += `- **${k}:** ${v || 'N/A'}\n`;
              });
              md += `\n`;
            }

            if (cluster.psychographics && typeof cluster.psychographics === 'object') {
              md += `#### Psychographics\n\n`;
              Object.entries(cluster.psychographics).forEach(([k, v]) => {
                md += `- **${k}:** ${Array.isArray(v) ? v.join(', ') : (v || 'N/A')}\n`;
              });
              md += `\n`;
            }

            if (cluster.pain_points && cluster.pain_points.length > 0) {
              md += `#### Pain Points\n\n`;
              cluster.pain_points.forEach((p: string) => md += `- ${p}\n`);
              md += `\n`;
            }

            if (cluster.desired_outcomes && cluster.desired_outcomes.length > 0) {
              md += `#### Desired Outcomes\n\n`;
              cluster.desired_outcomes.forEach((o: string) => md += `- ${o}\n`);
              md += `\n`;
            }

            if (cluster.watering_holes && cluster.watering_holes.length > 0) {
              md += `#### Watering Holes\n\n`;
              cluster.watering_holes.forEach((w: string) => md += `- ${w}\n`);
              md += `\n`;
            }
          });
        }

        if (aud.mercado_total) {
          md += `### Mercado Total\n\n`;
          md += `- **TAM:** ${aud.mercado_total.tam || 'N/A'}\n`;
          md += `- **SAM:** ${aud.mercado_total.sam || 'N/A'}\n`;
          md += `- **SOM:** ${aud.mercado_total.som || 'N/A'}\n`;
          md += `- **Metodologia:** ${aud.mercado_total.metodologia_calculo || 'N/A'}\n\n`;
        }
        md += `---\n\n`;
      }

      // Posicionamento
      if (s.camada_2_modulos_obrigatorios?.posicionamento) {
        const p = s.camada_2_modulos_obrigatorios.posicionamento;
        md += `## 5. Posicionamento\n\n`;
        md += `### Declaração de Posicionamento\n\n`;
        md += `> "${p.declaracao || 'N/A'}"\n\n`;
        md += `### Proposta de Valor Única (UVP)\n\n`;
        md += `${p.uvp || 'N/A'}\n\n`;

        if (p.brand_personality) {
          md += `### Brand Personality\n\n`;
          md += `- **Arquétipos:** ${Array.isArray(p.brand_personality.arquetipos) ? p.brand_personality.arquetipos.join(', ') : 'N/A'}\n`;
          md += `- **Tom de Voz:** ${p.brand_personality.tom_voz || 'N/A'}\n\n`;
          if (p.brand_personality.guidelines_comunicacao && p.brand_personality.guidelines_comunicacao.length > 0) {
            md += `#### Guidelines de Comunicação\n\n`;
            p.brand_personality.guidelines_comunicacao.forEach((g: string) => md += `- ${g}\n`);
            md += `\n`;
          }
        }
        md += `---\n\n`;
      }

      // Canais
      if (s.camada_2_modulos_obrigatorios?.canais) {
        md += `## 6. Canais de Marketing\n\n`;
        s.camada_2_modulos_obrigatorios.canais.forEach((ch: any) => {
          if (!ch) return;
          md += `### ${ch.canal || 'N/A'}\n\n`;
          md += `- **Objetivo:** ${ch.objetivo || 'N/A'}\n`;
          md += `- **Funil Stage:** ${ch.funil_stage || 'N/A'}\n`;
          md += `- **Prioridade:** ${ch.prioridade || 'N/A'}\n`;
          md += `- **Formatos:** ${Array.isArray(ch.formatos) ? ch.formatos.join(', ') : 'N/A'}\n`;
          md += `- **Frequência:** ${ch.frequencia || 'N/A'}\n`;
          md += `- **Investimento:** ${ch.investimento_mensal_estimado || 'N/A'}\n`;
          md += `- **Budget:** ${ch.percentual_budget || 'N/A'}\n`;
          md += `- **KPIs:** ${Array.isArray(ch.kpis) ? ch.kpis.join(', ') : 'N/A'}\n\n`;
        });
        md += `---\n\n`;
      }

      // Plano de Ação
      if (s.camada_2_modulos_obrigatorios?.plano_acao_90_dias) {
        const plan = s.camada_2_modulos_obrigatorios.plano_acao_90_dias;
        md += `## 7. Plano de Ação (90 Dias)\n\n`;
        ['sprint_1_semanas_1_4', 'sprint_2_semanas_5_8', 'sprint_3_semanas_9_12'].forEach((sprintKey, idx) => {
          const sprint = plan[sprintKey];
          if (!sprint) return;
          md += `### Sprint ${idx + 1}: ${sprint.foco || 'N/A'}\n\n`;
          sprint.acoes?.forEach((acao: any) => {
            if (!acao) return;
            if (typeof acao === 'string') {
              md += `- ${acao}\n`;
            } else {
              md += `- **${acao.acao || 'N/A'}**\n`;
              md += `  - Responsável: ${acao.responsavel || 'N/A'}\n`;
              md += `  - Métrica: ${acao.metrica_sucesso || 'N/A'}\n`;
              md += `  - Esforço: ${acao.esforco || 'N/A'}\n`;
            }
          });
          md += `\n`;
        });
        md += `---\n\n`;
      }

      // Governança
      if (s.camada_4_governanca) {
        const g = s.camada_4_governanca;
        md += `## 8. Governança\n\n`;
        md += `### Frequência de Revisão\n\n`;
        md += `${g.frequencia_revisao || 'N/A'}\n\n`;

        if (g.aprovacao_niveis && typeof g.aprovacao_niveis === 'object') {
          md += `### Níveis de Aprovação\n\n`;
          Object.entries(g.aprovacao_niveis).forEach(([nivel, responsavel]) => {
            md += `- **${nivel.charAt(0).toUpperCase() + nivel.slice(1)}:** ${responsavel || 'N/A'}\n`;
          });
          md += `\n`;
        }

        if (g.consolidacao_grupo) {
          md += `### Consolidação com o Grupo\n\n`;
          md += `- **Frequência:** ${g.consolidacao_grupo.frequencia || 'N/A'}\n`;
          md += `- **Processo:** ${g.consolidacao_grupo.processo || 'N/A'}\n`;
          md += `- **Output:** ${g.consolidacao_grupo.output || 'N/A'}\n\n`;
        }

        if (g.dashboard_kpis && g.dashboard_kpis.length > 0) {
          md += `### Dashboard KPIs\n\n`;
          g.dashboard_kpis.forEach((kpi: any) => {
            if (!kpi) return;
            md += `- **${kpi.nome || 'N/A'}** (Frequência: ${kpi.frequencia_medicao || 'N/A'}) - Responsável: ${kpi.responsavel || 'N/A'}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      }

      // Estratégia de Lançamento (PLF)
      if (answers?.usa_plf) {
        md += `## 9. Estratégia de Lançamento (PLF)\n\n`;
        md += `- **Tipo de Lançamento:** ${answers.plf_tipo_lancamento || 'N/A'}\n`;
        md += `- **Promessa (A Roma):** ${answers.plf_promessa || 'N/A'}\n`;
        md += `- **Oferta:** ${answers.plf_oferta || 'N/A'}\n`;
        md += `- **Preço e Condições:** ${answers.plf_preco || 'N/A'}\n`;
        md += `- **Duração do Carrinho:** ${answers.plf_duracao_carrinho || 'N/A'}\n\n`;
        md += `---\n\n`;
      }

      md += `\n*Documento gerado em ${new Date().toLocaleString('pt-BR')}*\n`;

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estrategia-marketing-${safeProjectName}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Estratégia exportada em Markdown com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar markdown:', error);
      toast.error(`Falha ao exportar em Markdown: ${error.message}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!generatedStrategy) {
        toast.error('Nenhuma estratégia gerada para exportar.');
        return;
      }
      
      const safeProjectName = project?.name
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase() || 'projeto';

      toast.info('Gerando PDF, aguarde...');
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('pdf-export-content');
      if (!element) return;
      
      const opt = {
        margin:       10,
        filename:     `estrategia-marketing-${safeProjectName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1200 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error(`Falha ao gerar PDF: ${error.message}`);
    }
  };

  const renderInput = (key: string, label: string, type: 'text' | 'textarea' | 'select' = 'text', options?: string[], placeholder?: string) => {
    // Campos select são simples demais para precisar de IA — sem checkbox
    const showAICheckbox = type !== 'select';
    const isAISelected = selectedAIFields.has(key);

    const renderLabelRow = () => (
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {showAICheckbox && (
          <label className="flex items-center gap-1.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
              checked={isAISelected}
              onChange={() => toggleAIField(key)}
            />
            <span className={`text-xs flex items-center gap-0.5 transition-colors ${
              isAISelected ? 'text-indigo-600 font-semibold' : 'text-slate-400 group-hover:text-indigo-500'
            }`}>
              <Sparkles className="w-3 h-3" /> IA
            </span>
          </label>
        )}
      </div>
    );

    if (type === 'textarea') {
      return (
        <div key={key} className={`space-y-1 rounded-lg p-2 -mx-2 transition-colors ${
          isAISelected ? 'bg-indigo-50/60 ring-1 ring-indigo-200' : ''
        }`}>
          {renderLabelRow()}
          <Textarea
            value={answers[key] || ''}
            onChange={(e) => updateAnswer(key, e.target.value)}
            placeholder={placeholder || `Descreva ${label.toLowerCase()}...`}
            className="min-h-[100px] border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white"
          />
        </div>
      );
    }
    if (type === 'select' && options) {
      return (
        <div key={key} className="space-y-1">
          {renderLabelRow()}
          <div className="flex flex-wrap gap-2">
            {options.map(opt => (
              <Button
                key={opt}
                variant={answers[key] === opt ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAnswer(key, opt)}
                className={answers[key] === opt ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div key={key} className={`space-y-1 rounded-lg p-2 -mx-2 transition-colors ${
        isAISelected ? 'bg-indigo-50/60 ring-1 ring-indigo-200' : ''
      }`}>
        {renderLabelRow()}
        <Input
          value={answers[key] || ''}
          onChange={(e) => updateAnswer(key, e.target.value)}
          placeholder={placeholder || `Informe ${label.toLowerCase()}`}
          className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white"
        />
      </div>
    );
  };

  const renderStepContent = () => {
    const step = wizardSteps[currentStep];

    switch (step.id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-indigo-800">
                <strong>Objetivo:</strong> Mapear as variáveis fundamentais do negócio para contextualizar toda a estratégia.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Utilizar framework PLF?</p>
                <p className="text-sm text-slate-500">Habilita a aba Launch Formula para incluir a estratégia de lançamento no plano.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={answers.usa_plf || false} onChange={(e) => updateAnswer('usa_plf', e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {renderInput('setor', 'Setor / Indústria', 'text', undefined, 'Ex: Tecnologia, Saúde, Educação, E-commerce...')}
            {renderInput('modelo_negocio', 'Modelo de Negócio', 'select', ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'E-commerce', 'Serviços'])}
            {renderInput('fase', 'Fase da Empresa', 'select', ['Early Stage (pré-product-market-fit)', 'Growth (escalando)', 'Mature (consolidada)'])}
            {renderInput('porte', 'Porte da Empresa', 'select', ['Startup (1-10 pessoas)', 'Pequena (11-50)', 'Média (51-200)', 'Grande (200+)'])}
            {renderInput('faturamento_mensal', 'Faturamento Mensal Aproximado', 'text', undefined, 'Ex: R$ 50.000, R$ 500.000, R$ 2M+...')}
            {renderInput('orcamento_marketing_mensal', 'Orçamento de Marketing Mensal', 'text', undefined, 'Ex: R$ 5.000, R$ 20.000, R$ 100.000...')}
            {renderInput('diferenciais_competitivos', 'Diferenciais Competitivos Principais', 'textarea', undefined, 'O que torna esta empresa única? Por que um cliente escolheria você?')}
          </div>
        );

      case 'group':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>Camada 1 — Núcleo do Grupo:</strong> Define o DNA compartilhado. Se a empresa é independente, trate-a como "grupo de uma entidade".
              </p>
            </div>
            {renderInput('grupo_identidade', 'Identidade do Grupo (Missão, Visão, Valores)', 'textarea', undefined, 'O que o grupo representa? Qual sua missão, visão e valores compartilhados?')}
            {renderInput('grupo_audiencias_macro', 'Audiências Macro do Grupo', 'textarea', undefined, 'Quais grandes segmentos de audiência o grupo quer alcançar? (Não são personas detalhadas)')}
            {renderInput('grupo_regras_convivencia', 'Regras de Convivência Entre Marcas', 'textarea', undefined, 'O que NÃO pode conflitar? O que PODE ser compartilhado? O que é obrigatoriamente único?')}
            {renderInput('grupo_posicionamento_mae', 'Posicionamento da Marca Mãe / Holding', 'textarea', undefined, 'Como a holding/marca mãe se posiciona no mercado?')}
          </div>
        );

      case 'diagnosis':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Módulo 1 — Diagnóstico:</strong> Mapeie a situação atual do mercado, concorrentes e maturidade digital.
              </p>
            </div>
            {renderInput('concorrentes_principais', 'Principais Concorrentes (3-5)', 'textarea', undefined, 'Liste os principais concorrentes com posicionamento, pontos fortes e fracos de cada um. Formato: Nome | Posicionamento | Forte | Fraco')}
            {renderInput('maturidade_digital', 'Maturidade Digital', 'select', ['Iniciante (sem presença digital)', 'Intermediário (site + redes básicas)', 'Avançado (conteúdo + paid media)', 'Sofisticado (automação + dados)'])}
            {renderInput('presenca_digital_atual', 'Presença Digital Atual', 'textarea', undefined, 'Descreva: site, redes sociais, conteúdo, mídia paga, email marketing, etc.')}
            {renderInput('gaps_marketing', 'Gaps de Marketing Identificados', 'textarea', undefined, 'O que falta hoje? Onde a empresa está perdendo oportunidades?')}
          </div>
        );

      case 'okrs':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Módulo 2 — OKRs:</strong> Defina 3-5 objetivos com resultados-chave mensuráveis. Cada OKR deve se alinhar explicitamente ao grupo.
              </p>
            </div>
            {renderInput('okrs_principais', 'OKRs de Marketing (3-5 objetivos)', 'textarea', undefined, 'Formato: Objetivo 1: [descrição] → KR1: [meta mensurável] → KR2: [meta mensurável] → KR3: [meta mensurável]\nObjetivo 2: ...')}
            {renderInput('alinhamento_grupo', 'Alinhamento com OKR do Grupo', 'textarea', undefined, 'Como os OKRs de marketing desta empresa conectam aos objetivos estratégicos do grupo/holding?')}
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Módulo 3 — Público-Alvo:</strong> Detalhe os clusters de público. Não basta "pessoa 25-45". Mapeie dores, desejos e onde consomem informação.
              </p>
            </div>
            {renderInput('clusters_publico', 'Clusters de Público-Alvo', 'textarea', undefined, 'Para cada cluster, descreva:\n- Nome do cluster\n- Demographics (idade, gênero, renda, localização)\n- Psychographics (valores, interesses, comportamento)\n- Pain Points (dores)\n- Desired Outcomes (desejos)\n- Watering Holes (onde consome informação)\n- Buying Triggers (o que faz comprar)')}
            {renderInput('tam_sam_som', 'TAM / SAM / SOM Estimado', 'textarea', undefined, 'TAM (mercado total): ...\nSAM (mercado endereçável): ...\nSOM (mercado obtível): ...\nMetodologia de cálculo: ...')}
          </div>
        );

      case 'positioning':
        return (
          <div className="space-y-6">
            <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-pink-800">
                <strong>Módulo 4 — Posicionamento:</strong> Defina como a empresa quer ser percebida. UVP, brand personality e diferenciação.
              </p>
            </div>
            {renderInput('uvp', 'Proposta de Valor Única (UVP)', 'textarea', undefined, 'Formato: "Ajudamos [público] a [resultado] através de [método], sem [dor comum]"')}
            {renderInput('brand_personality', 'Brand Personality (Arquétipos)', 'textarea', undefined, 'Quais arquétipos de marca representam a empresa? (Ex: O Herói, O Sábio, O Criador, O Explorador...)\nComo a marca se comunica? O que NUNCA faria?')}
            {renderInput('tom_voz', 'Tom de Voz e Guidelines de Comunicação', 'textarea', undefined, 'Como a marca fala? Formal/informal? Técnico/emotivo? Exemplos de como NÃO falar.')}
          </div>
        );

      case 'channels':
        return (
          <div className="space-y-6">
            <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-cyan-800">
                <strong>Módulo 5 — Canais:</strong> Defina a estratégia de canais por estágio do funil (TOFU/MOFU/BOFU) com budget e KPIs.
              </p>
            </div>
            {renderInput('canais_principais', 'Canais de Marketing', 'textarea', undefined, 'Para cada canal, descreva:\n- Canal (Ex: LinkedIn, Google Ads, Instagram, Blog, YouTube)\n- Objetivo (Awareness, Consideração, Conversão)\n- Formatos de conteúdo\n- Frequência\n- KPIs\n- Investimento mensal estimado\n- % do budget total')}
            {renderInput('budget_alocacao', 'Alocação de Budget (% por canal)', 'textarea', undefined, 'Ex: Google Ads: 30%, LinkedIn: 20%, Conteúdo/SEO: 25%, Eventos: 15%, Ferramentas: 10%\n(Total deve ser 100%)')}
          </div>
        );

      case 'action':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>Módulo 6 — Plano de Ação (90 dias):</strong> Ações imperativas com verbos específicos. Nada de "estudar" ou "analisar". Use "Configurar", "Criar", "Lançar".
              </p>
            </div>
            {renderInput('sprint_1', 'Sprint 1 — Semanas 1-4 (Quick Wins e Fundação)', 'textarea', undefined, 'Liste ações específicas com responsável e métrica de sucesso.\nFormato: [Ação] → Responsável: [Cargo] → Métrica: [KPI]')}
            {renderInput('sprint_2', 'Sprint 2 — Semanas 5-8 (Escala e Otimização)', 'textarea', undefined, 'Ações de escala baseadas nos resultados do Sprint 1.')}
            {renderInput('sprint_3', 'Sprint 3 — Semanas 9-12 (Consolidação e Expansão)', 'textarea', undefined, 'Ações de consolidação e preparação para o próximo ciclo.')}
            {renderInput('prioridades_90_dias', 'Prioridades Absolutas dos 90 dias', 'textarea', undefined, 'Se você só pudesse fazer 3 coisas nos próximos 90 dias, o que teria mais impacto?')}
          </div>
        );

      case 'governance':
        return (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-800">
                <strong>Camada 4 — Governança:</strong> O que separa um template que funciona de um que vira gaveta. Defina revisão, aprovação e consolidação.
              </p>
            </div>
            {renderInput('frequencia_revisao', 'Frequência de Revisão da Estratégia', 'select', ['Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral'])}
            {renderInput('aprovacao_niveis', 'Níveis de Aprovação', 'textarea', undefined, 'Quem aprova em cada nível?\n- Operacional: ?\n- Tático: ?\n- Estratégico: ?')}
            {renderInput('consolidacao_grupo', 'Consolidacao com o Grupo', 'textarea', undefined, 'Como as estratégias individuais se consolidam na visão do grupo? Frequência, participantes, output.')}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Módulos Opcionais (selecione os aplicáveis)</label>
              <div className="flex flex-wrap gap-2">
                {['Comunidade', 'CRM & Automação', 'Influenciadores', 'Expansão Internacional', 'Produtos Digitais'].map(mod => {
                  const selected = (answers.modulos_opcionais || []).includes(mod);
                  return (
                    <Button
                      key={mod}
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = answers.modulos_opcionais || [];
                        updateAnswer('modulos_opcionais', selected ? current.filter((m: string) => m !== mod) : [...current, mod]);
                      }}
                      className={selected ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                    >
                      {mod}
                    </Button>
                  );
                })}
              </div>
            </div>
            {renderInput('observacoes_adicionais', 'Observações Adicionais', 'textarea', undefined, 'Qualquer informação adicional que considere relevante para a estratégia.')}
          </div>
        );

      case 'plf_formula':
        return (
          <div className="space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-rose-800">
                <strong>Launch Formula (PLF):</strong> Estruture os dados específicos do seu lançamento seguindo o framework.
              </p>
            </div>
            {renderInput('plf_tipo_lancamento', 'Tipo de Lançamento', 'select', ['Semente', 'Interno', 'Externo', 'Relâmpago', 'Perpétuo'])}
            {renderInput('plf_promessa', 'Promessa do Lançamento (A Roma)', 'textarea', undefined, 'Qual é a grande promessa/transformação que o lançamento fará?')}
            {renderInput('plf_oferta', 'Estrutura da Oferta e Bônus', 'textarea', undefined, 'Descreva o produto principal, bônus limitados, garantias, etc.')}
            {renderInput('plf_preco', 'Preço / Condições de Pagamento', 'text', undefined, 'Ex: R$ 997 à vista ou 12x de R$ 97')}
            {renderInput('plf_duracao_carrinho', 'Duração do Carrinho Aberto', 'text', undefined, 'Ex: 7 dias (De Segunda a Domingo)')}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {/* Header da etapa */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Revisão & Geração
              </h3>
              <p className="text-sm text-indigo-700">
                Revise seus campos, use a IA em lote para preencher os selecionados e depois gere a estratégia completa.
              </p>
            </div>

            {/* Indicador do Strategic Doc */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
              strategicDocExists
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isGeneratingStrategicDoc
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {strategicDocExists ? (
                <><CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span><strong>Contexto estratégico disponível</strong> — a IA usará o documento do projeto para gerar sugestões precisas.</span></>
              ) : isGeneratingStrategicDoc ? (
                <><Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                <span><strong>Gerando contexto estratégico...</strong> — isso pode levar de 20 a 40 segundos. Você já pode selecionar os campos.</span></>
              ) : (
                <><Zap className="w-4 h-4 flex-shrink-0" />
                <div className="flex items-center justify-between w-full">
                  <span><strong>Contexto estratégico não gerado</strong> — você pode gerar campos com IA mesmo assim, mas com menos precisão.</span>
                  <button
                    onClick={() => {
                      setIsGeneratingStrategicDoc(true);
                      fetch('/api/generate-strategic-doc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId }),
                      })
                        .then(() => checkStrategicDocExists())
                        .then(exists => {
                          if (exists) { setStrategicDocExists(true); setIsGeneratingStrategicDoc(false); }
                        })
                        .catch(() => setIsGeneratingStrategicDoc(false));
                    }}
                    className="ml-3 text-xs underline whitespace-nowrap hover:no-underline"
                  >
                    Tentar novamente
                  </button>
                </div>
                </>
              )}
            </div>

            {/* Painel de Geração em Lote */}
            {!showPreview ? (
              <div className="border border-indigo-200 rounded-lg p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Geração em Lote com IA
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Marque os campos desejados nos steps anteriores com ✨ IA para incluí-los aqui.
                    </p>
                  </div>
                  <Badge variant={selectedAIFields.size > 0 ? 'default' : 'secondary'} className={selectedAIFields.size > 0 ? 'bg-indigo-600' : ''}>
                    {selectedAIFields.size} campo{selectedAIFields.size !== 1 ? 's' : ''} selecionado{selectedAIFields.size !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {selectedAIFields.size > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedAIFields).map(key => (
                      <span key={key} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-200">
                        <Sparkles className="w-2.5 h-2.5" />
                        {FIELD_LABELS[key] || key}
                        <button onClick={() => toggleAIField(key)} className="ml-1 hover:text-red-500 transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleBatchGenerate}
                  disabled={selectedAIFields.size === 0 || isGeneratingBatch}
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGeneratingBatch ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando {selectedAIFields.size} campo{selectedAIFields.size !== 1 ? 's' : ''}...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Gerar campos selecionados com IA</>
                  )}
                </Button>
              </div>
            ) : (
              /* Preview das sugestões */
              <div className="border border-emerald-200 rounded-lg bg-emerald-50/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                  <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Preview das sugestões da IA
                  </h4>
                  <p className="text-xs text-emerald-600">Edite antes de confirmar, se necessário</p>
                </div>
                <div className="p-4 space-y-4">
                  {Object.entries(aiSuggestions).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        {FIELD_LABELS[key] || key}
                      </label>
                      <Textarea
                        value={aiSuggestions[key]}
                        onChange={(e) => setAiSuggestions(prev => ({ ...prev, [key]: e.target.value }))}
                        className="min-h-[80px] text-sm border-emerald-200 focus:border-indigo-400 bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 px-4 pb-4">
                  <Button
                    onClick={handleConfirmSuggestions}
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4" /> Aplicar sugestões
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelPreview}
                    className="gap-2 border-slate-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Sumário dos steps */}
            <div className="grid grid-cols-2 gap-3">
              {WIZARD_STEPS.slice(0, -1).map((step, i) => {
                const stepKeys = getStepKeys(step.id);
                const filled = stepKeys.filter(k => answers[k] && String(answers[k]).trim() !== '').length;
                const total = stepKeys.length;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(i)}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      filled === total ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {filled === total ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{step.title}</p>
                      <p className="text-xs text-slate-500">{filled}/{total} campos preenchidos</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {generatedStrategy && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-semibold">Estratégia já gerada!</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Você pode regenerar a qualquer momento. Os dados serão atualizados.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepKeys = (stepId: string): string[] => {
    const keyMap: Record<string, string[]> = {
      basics: ['setor', 'modelo_negocio', 'fase', 'porte', 'diferenciais_competitivos'],
      group: ['grupo_identidade', 'grupo_audiencias_macro', 'grupo_regras_convivencia'],
      diagnosis: ['concorrentes_principais', 'maturidade_digital', 'gaps_marketing'],
      okrs: ['okrs_principais', 'alinhamento_grupo'],
      audience: ['clusters_publico'],
      positioning: ['uvp', 'brand_personality', 'tom_voz'],
      channels: ['canais_principais', 'budget_alocacao'],
      action: ['sprint_1', 'sprint_2', 'sprint_3'],
      governance: ['frequencia_revisao', 'aprovacao_niveis', 'consolidacao_grupo'],
    };
    return keyMap[stepId] || [];
  };

  // --- PDF REPORT RENDERING ---
  const renderFullReportPDF = () => {
    if (!generatedStrategy) return null;
    const s = generatedStrategy.estrategia_central_marketing;
    if (!s) return null;

    return (
      <div className="space-y-12 bg-white text-slate-900 font-sans">
        {/* Capa */}
        <div className="text-center py-20 bg-indigo-50 rounded-xl mb-12 border border-indigo-100">
          <h1 className="text-4xl font-extrabold text-indigo-900 mb-4">Relatório de Estratégia de Marketing</h1>
          <p className="text-2xl text-slate-700 font-semibold">{s.empresa?.nome || project?.name}</p>
          <div className="mt-8 flex justify-center gap-4 text-sm text-slate-600">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium">{s.empresa?.setor}</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium">{s.empresa?.modelo_negocio}</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium">{s.empresa?.fase}</span>
          </div>
        </div>

        {/* 1. Visão Geral (Núcleo do Grupo) */}
        {s.camada_1_nucleo_grupo?.grupo && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Layers className="w-6 h-6" /> 1. Núcleo do Grupo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Identidade</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Missão:</strong> {s.camada_1_nucleo_grupo.grupo.identidade?.missao}</p>
                  <p className="text-sm"><strong>Visão:</strong> {s.camada_1_nucleo_grupo.grupo.identidade?.visao}</p>
                  <p className="text-sm"><strong>Valores:</strong> {s.camada_1_nucleo_grupo.grupo.identidade?.valores?.join(', ')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Posicionamento Mãe</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">{s.camada_1_nucleo_grupo.grupo.posicionamento_mae}</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Card>
                <CardHeader><CardTitle className="text-base">Audiências Macro</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 text-sm space-y-1">{s.camada_1_nucleo_grupo.grupo.audiencias_macro?.map((a:string, i:number) => <li key={i}>{a}</li>)}</ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Regras de Convivência</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 text-sm space-y-1">{s.camada_1_nucleo_grupo.grupo.regras_convivencia?.map((r:string, i:number) => <li key={i}>{r}</li>)}</ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 2. Diagnóstico */}
        {s.camada_2_modulos_obrigatorios?.diagnostico && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" /> 2. Diagnóstico
            </h2>
            {renderDiagnosis(s.camada_2_modulos_obrigatorios.diagnostico)}
          </div>
        )}

        {/* 3. OKRs */}
        {s.camada_2_modulos_obrigatorios?.okrs && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Target className="w-6 h-6" /> 3. OKRs de Marketing
            </h2>
            {renderOKRs(s.camada_2_modulos_obrigatorios.okrs)}
          </div>
        )}

        {/* 4. Público-Alvo e Gráfico de Mercado */}
        {s.camada_2_modulos_obrigatorios?.publico_alvo && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Users className="w-6 h-6" /> 4. Público-Alvo & Mercado
            </h2>
            
            {/* Gráfico Ilustrativo de Mercado (TAM SAM SOM) */}
            {s.camada_2_modulos_obrigatorios.publico_alvo.mercado_total && (
              <Card className="mb-6 bg-slate-50 border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-center text-lg text-indigo-900">Análise de Mercado (TAM / SAM / SOM)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center justify-center gap-12 py-6">
                  {/* Visual representation */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className="absolute w-full h-full bg-indigo-100/50 rounded-full border-2 border-indigo-300 flex items-start justify-center pt-4">
                      <span className="text-sm font-bold text-indigo-700">TAM</span>
                    </div>
                    <div className="absolute w-48 h-48 bg-blue-100/60 rounded-full border-2 border-blue-300 flex items-start justify-center pt-4">
                      <span className="text-sm font-bold text-blue-700">SAM</span>
                    </div>
                    <div className="absolute w-32 h-32 bg-green-100/70 rounded-full border-2 border-green-300 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-800">SOM</span>
                    </div>
                  </div>
                  
                  {/* Legenda com Dados */}
                  <div className="space-y-4 max-w-md w-full">
                    <div className="bg-white p-3 rounded-lg border-l-4 border-l-indigo-400 shadow-sm">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">TAM (Total Addressable Market)</p>
                      <p className="text-lg font-semibold text-slate-800">{s.camada_2_modulos_obrigatorios.publico_alvo.mercado_total.tam}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border-l-4 border-l-blue-400 shadow-sm">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">SAM (Serviceable Available Market)</p>
                      <p className="text-lg font-semibold text-slate-800">{s.camada_2_modulos_obrigatorios.publico_alvo.mercado_total.sam}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border-l-4 border-l-green-400 shadow-sm">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">SOM (Serviceable Obtainable Market)</p>
                      <p className="text-lg font-semibold text-slate-800">{s.camada_2_modulos_obrigatorios.publico_alvo.mercado_total.som}</p>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-4 px-2">
                      <strong className="text-slate-600">Metodologia:</strong> {s.camada_2_modulos_obrigatorios.publico_alvo.mercado_total.metodologia_calculo}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {renderAudience(s.camada_2_modulos_obrigatorios.publico_alvo)}
          </div>
        )}

        {/* 5. Posicionamento */}
        {s.camada_2_modulos_obrigatorios?.posicionamento && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Megaphone className="w-6 h-6" /> 5. Posicionamento
            </h2>
            {renderPositioning(s.camada_2_modulos_obrigatorios.posicionamento)}
          </div>
        )}

        {/* 6. Canais */}
        {s.camada_2_modulos_obrigatorios?.canais && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Globe className="w-6 h-6" /> 6. Canais de Marketing
            </h2>
            {renderChannels(s.camada_2_modulos_obrigatorios.canais)}
          </div>
        )}

        {/* 7. Plano de Ação */}
        {s.camada_2_modulos_obrigatorios?.plano_acao_90_dias && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Rocket className="w-6 h-6" /> 7. Plano de Ação (90 Dias)
            </h2>
            {renderActionPlan(s.camada_2_modulos_obrigatorios.plano_acao_90_dias)}
          </div>
        )}

        {/* 8. Governança */}
        {s.camada_4_governanca && (
          <div className="space-y-6" style={{ pageBreakBefore: 'always' }}>
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
              <Shield className="w-6 h-6" /> 8. Governança
            </h2>
            {renderGovernance(s.camada_4_governanca)}
          </div>
        )}
      </div>
    );
  };

  // --- RESULTS RENDERING ---
  const renderStrategyResults = () => {
    if (!generatedStrategy) return null;
    const s = generatedStrategy.estrategia_central_marketing;
    if (!s) return <p className="text-slate-500">Estrutura de dados inválida.</p>;

    return (
      <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-slate-100 p-1">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="diagnosis" className="text-xs">Diagnóstico</TabsTrigger>
          <TabsTrigger value="okrs" className="text-xs">OKRs</TabsTrigger>
          <TabsTrigger value="audience" className="text-xs">Público</TabsTrigger>
          <TabsTrigger value="positioning" className="text-xs">Posicionamento</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs">Canais</TabsTrigger>
          <TabsTrigger value="action" className="text-xs">Plano de Ação</TabsTrigger>
          <TabsTrigger value="governance" className="text-xs">Governança</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs">JSON</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Building className="w-5 h-5" /> {s.empresa?.nome || project?.name}
              </CardTitle>
              <CardDescription>
                {s.empresa?.setor} • {s.empresa?.modelo_negocio} • {s.empresa?.fase}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-600 font-bold uppercase">Versão</p>
                  <p className="text-xl font-bold text-indigo-900">{s.versao || '1.0'}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-bold uppercase">Camadas</p>
                  <p className="text-xl font-bold text-green-900">4</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-bold uppercase">Módulos</p>
                  <p className="text-xl font-bold text-amber-900">6</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-bold uppercase">OKRs</p>
                  <p className="text-xl font-bold text-purple-900">{s.camada_2_modulos_obrigatorios?.okrs?.length || 0}</p>
                </div>
              </div>

              {/* Núcleo do Grupo */}
              {s.camada_1_nucleo_grupo?.grupo && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" /> Núcleo do Grupo
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-purple-900">
                      <strong>Missão:</strong> {s.camada_1_nucleo_grupo.grupo.identidade?.missao || 'N/A'}
                    </p>
                    <p className="text-sm text-purple-900">
                      <strong>Posicionamento:</strong> {s.camada_1_nucleo_grupo.grupo.posicionamento_mae || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnosis */}
        <TabsContent value="diagnosis" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.diagnostico && renderDiagnosis(s.camada_2_modulos_obrigatorios.diagnostico)}
        </TabsContent>

        {/* OKRs */}
        <TabsContent value="okrs" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.okrs && renderOKRs(s.camada_2_modulos_obrigatorios.okrs)}
        </TabsContent>

        {/* Audience */}
        <TabsContent value="audience" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.publico_alvo && renderAudience(s.camada_2_modulos_obrigatorios.publico_alvo)}
        </TabsContent>

        {/* Positioning */}
        <TabsContent value="positioning" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.posicionamento && renderPositioning(s.camada_2_modulos_obrigatorios.posicionamento)}
        </TabsContent>

        {/* Channels */}
        <TabsContent value="channels" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.canais && renderChannels(s.camada_2_modulos_obrigatorios.canais)}
        </TabsContent>

        {/* Action Plan */}
        <TabsContent value="action" className="space-y-6">
          {s.camada_2_modulos_obrigatorios?.plano_acao_90_dias && renderActionPlan(s.camada_2_modulos_obrigatorios.plano_acao_90_dias)}
        </TabsContent>

        {/* Governance */}
        <TabsContent value="governance" className="space-y-6">
          {s.camada_4_governanca && renderGovernance(s.camada_4_governanca)}
        </TabsContent>

        {/* Raw JSON */}
        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">JSON Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[600px]">
                {JSON.stringify(generatedStrategy, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  const renderDiagnosis = (d: any) => (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Situação do Mercado</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-700">{d.situacao_atual_mercado}</p></CardContent>
      </Card>
      {d.analise_competitiva?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Análise Competitiva</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {d.analise_competitiva.map((c: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-slate-800">{c.concorrente}</h5>
                    <Badge variant={c.ameaca_nivel === 'high' ? 'destructive' : c.ameaca_nivel === 'medium' ? 'default' : 'secondary'}>
                      {c.ameaca_nivel}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1"><strong>Posicionamento:</strong> {c.posicionamento}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs font-bold text-green-700">Fortes:</p>
                      <ul className="text-xs text-green-800">{c.pontos_fortes?.map((p: string, j: number) => <li key={j}>• {p}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700">Fracos:</p>
                      <ul className="text-xs text-red-800">{c.pontos_fracos?.map((p: string, j: number) => <li key={j}>• {p}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {d.maturidade_digital && (
        <Card>
          <CardHeader><CardTitle className="text-base">Maturidade Digital</CardTitle></CardHeader>
          <CardContent>
            <Badge className="mb-2">{d.maturidade_digital.nivel}</Badge>
            <p className="text-sm text-slate-700">{d.maturidade_digital.justificativa}</p>
          </CardContent>
        </Card>
      )}
      {d.gaps_marketing?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Gaps de Marketing</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {d.gaps_marketing.map((g: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                  <Badge variant={g.impacto === 'high' ? 'destructive' : 'default'} className="mt-0.5">{g.impacto}</Badge>
                  <p className="text-sm text-red-900">{g.gap}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderOKRs = (okrs: any[]) => (
    <div className="space-y-4">
      {okrs.map((okr: any, i: number) => (
        <Card key={i} className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" /> {okr.objetivo}
            </CardTitle>
            {okr.alinhamento_okr_grupo && (
              <CardDescription className="bg-green-50 p-2 rounded text-xs">
                <strong>Alinhamento com Grupo:</strong> {okr.alinhamento_okr_grupo}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {okr.key_results?.map((kr: any, j: number) => (
                <div key={j} className="flex items-start gap-3 p-2 bg-slate-50 rounded">
                  <Badge variant="outline" className="mt-0.5">KR{j + 1}</Badge>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{kr.kr}</p>
                    <p className="text-xs text-slate-600">Meta: {kr.meta} | Baseline: {kr.baseline} | Timeline: {kr.timeline}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span><strong>Responsável:</strong> {okr.responsavel_sugerido}</span>
              <span><strong>Confiança:</strong> <Badge variant="outline">{okr.confianca}</Badge></span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAudience = (audience: any) => (
    <div className="space-y-4">
      {audience.clusters?.map((cluster: any, i: number) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> {cluster.nome_cluster}
              <Badge variant="secondary">{cluster.tamanho_estimado}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Demographics</h5>
                <div className="text-xs text-slate-700 space-y-0.5">
                  {cluster.demographics && Object.entries(cluster.demographics).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {String(v)}</p>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Psychographics</h5>
                <div className="text-xs text-slate-700 space-y-0.5">
                  {cluster.psychographics && Object.entries(cluster.psychographics).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {Array.isArray(v) ? (v as string[]).join(', ') : String(v)}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 p-2 rounded">
                <h5 className="text-xs font-bold text-red-700 mb-1">Pain Points</h5>
                <ul className="text-xs text-red-900">{cluster.pain_points?.map((p: string, j: number) => <li key={j}>• {p}</li>)}</ul>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <h5 className="text-xs font-bold text-green-700 mb-1">Desired Outcomes</h5>
                <ul className="text-xs text-green-900">{cluster.desired_outcomes?.map((o: string, j: number) => <li key={j}>• {o}</li>)}</ul>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <h5 className="text-xs font-bold text-blue-700 mb-1">Watering Holes</h5>
                <ul className="text-xs text-blue-900">{cluster.watering_holes?.map((w: string, j: number) => <li key={j}>• {w}</li>)}</ul>
              </div>
            </div>
            {cluster.mapa_empatia && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <h5 className="text-xs font-bold text-slate-600 mb-2">Mapa de Empatia</h5>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                  <p><strong>Pensa:</strong> {cluster.mapa_empatia.pensa}</p>
                  <p><strong>Sente:</strong> {cluster.mapa_empatia.sente}</p>
                  <p><strong>Vê:</strong> {cluster.mapa_empatia.ve}</p>
                  <p><strong>Ouve:</strong> {cluster.mapa_empatia.ouve}</p>
                  <p><strong>Diz/Faz:</strong> {cluster.mapa_empatia.diz_faz}</p>
                  <p><strong>Dor:</strong> {cluster.mapa_empatia.dor_principal}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {audience.mercado_total && (
        <Card>
          <CardHeader><CardTitle className="text-base">Mercado Total</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600 font-bold">TAM</p>
                <p className="text-sm font-bold text-indigo-900">{audience.mercado_total.tam}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-bold">SAM</p>
                <p className="text-sm font-bold text-blue-900">{audience.mercado_total.sam}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-bold">SOM</p>
                <p className="text-sm font-bold text-green-900">{audience.mercado_total.som}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2"><strong>Metodologia:</strong> {audience.mercado_total.metodologia_calculo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPositioning = (p: any) => (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader><CardTitle className="text-base">Declaração de Posicionamento</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-700 italic">"{p.declaracao}"</p></CardContent>
      </Card>
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader><CardTitle className="text-base">Proposta de Valor Única (UVP)</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-slate-700 font-medium">{p.uvp}</p></CardContent>
      </Card>
      {p.matriz_posicionamento && (
        <Card>
          <CardHeader><CardTitle className="text-base">Matriz de Posicionamento</CardTitle></CardHeader>
          <CardContent>
            <div className="relative h-64 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 -rotate-90">Valor Percebido</div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">Preço</div>
              {/* Company dot */}
              <div
                className="absolute w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg z-10"
                style={{ left: `${(p.matriz_posicionamento.posicionamento_empresa?.x || 0.5) * 100}%`, bottom: `${(p.matriz_posicionamento.posicionamento_empresa?.y || 0.5) * 100}%` }}
                title="Sua empresa"
              />
              {/* Competitor dots */}
              {p.matriz_posicionamento.concorrentes?.map((c: any, i: number) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-slate-400 rounded-full border-2 border-white"
                  style={{ left: `${(c.x || 0.5) * 100}%`, bottom: `${(c.y || 0.5) * 100}%` }}
                  title={c.nome}
                />
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-600 rounded-full inline-block" /> Sua Empresa</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-400 rounded-full inline-block" /> Concorrentes</span>
            </div>
          </CardContent>
        </Card>
      )}
      {p.brand_personality && (
        <Card>
          <CardHeader><CardTitle className="text-base">Brand Personality</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><strong>Arquétipos:</strong> {p.brand_personality.arquetipos?.join(', ')}</p>
            <p className="text-sm"><strong>Tom de Voz:</strong> {p.brand_personality.tom_voz}</p>
            {p.brand_personality.guidelines_comunicacao && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Guidelines</p>
                <ul className="text-xs text-slate-700">{p.brand_personality.guidelines_comunicacao.map((g: string, i: number) => <li key={i}>• {g}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderChannels = (channels: any[]) => (
    <div className="space-y-4">
      {channels.map((ch: any, i: number) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800">{ch.canal}</h4>
              <div className="flex gap-2">
                <Badge variant="secondary">{ch.funil_stage}</Badge>
                <Badge variant={ch.prioridade === 'high' ? 'default' : 'outline'}>{ch.prioridade}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-2">{ch.objetivo}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><strong>Formatos:</strong> {ch.formatos?.join(', ')}</div>
              <div><strong>Frequência:</strong> {ch.frequencia}</div>
              <div><strong>Investimento:</strong> {ch.investimento_mensal_estimado}</div>
              <div><strong>Budget:</strong> {ch.percentual_budget}</div>
            </div>
            <div className="mt-2"><strong className="text-xs text-slate-500">KPIs:</strong> <span className="text-xs text-slate-700">{ch.kpis?.join(', ')}</span></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderActionPlan = (plan: any) => (
    <div className="space-y-4">
      {['sprint_1_semanas_1_4', 'sprint_2_semanas_5_8', 'sprint_3_semanas_9_12'].map((sprintKey, idx) => {
        const sprint = plan[sprintKey];
        if (!sprint) return null;
        const colors = ['bg-green-50 border-green-200', 'bg-amber-50 border-amber-200', 'bg-blue-50 border-blue-200'];
        const textColors = ['text-green-900', 'text-amber-900', 'text-blue-900'];
        return (
          <Card key={sprintKey} className={`border-l-4 ${colors[idx].split(' ')[1]}`}>
            <CardHeader>
              <CardTitle className={`text-base ${textColors[idx]}`}>
                Sprint {idx + 1} — {sprint.foco}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sprint.acoes?.map((acao: any, j: number) => (
                  <div key={j} className="flex items-start gap-2 p-2 bg-white rounded border border-slate-100">
                    <Rocket className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {typeof acao === 'string' ? acao : acao.acao}
                      </p>
                      {typeof acao === 'object' && (
                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                          {acao.responsavel && <span>👤 {acao.responsavel}</span>}
                          {acao.metrica_sucesso && <span>📊 {acao.metrica_sucesso}</span>}
                          {acao.esforco && <span>⚡ {acao.esforco}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderGovernance = (g: any) => (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Frequência de Revisão</CardTitle></CardHeader>
        <CardContent><Badge className="text-sm">{g.frequencia_revisao}</Badge></CardContent>
      </Card>
      {g.aprovacao_niveis && (
        <Card>
          <CardHeader><CardTitle className="text-base">Níveis de Aprovação</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(g.aprovacao_niveis).map(([nivel, responsavel]) => (
                <div key={nivel} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700 capitalize">{nivel}:</span>
                  <span className="text-sm text-slate-600">{String(responsavel)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {g.consolidacao_grupo && (
        <Card>
          <CardHeader><CardTitle className="text-base">Consolidação com o Grupo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm"><strong>Frequência:</strong> {g.consolidacao_grupo.frequencia}</p>
            <p className="text-sm"><strong>Processo:</strong> {g.consolidacao_grupo.processo}</p>
            <p className="text-sm"><strong>Output:</strong> {g.consolidacao_grupo.output}</p>
          </CardContent>
        </Card>
      )}
      {g.ciclo_revisao && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ciclo de Revisão</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(g.ciclo_revisao).map(([freq, desc]) => (
                <div key={freq} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                  <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 capitalize">{freq}</p>
                    <p className="text-xs text-slate-600">{String(desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {g.dashboard_kpis?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Dashboard KPIs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {g.dashboard_kpis.map((kpi: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-800">{kpi.nome}</span>
                  <Badge variant="outline" className="text-xs">{kpi.frequencia_medicao}</Badge>
                  <span className="text-xs text-slate-500 ml-auto">{kpi.responsavel}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)} className="gap-2 text-slate-500 hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Projeto
          </Button>

          {/* Indicador de Auto-Save */}
          {autoSaveStatus !== 'idle' && (
            <span className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
              autoSaveStatus === 'saving' ? 'text-slate-400' :
              autoSaveStatus === 'saved'  ? 'text-emerald-600' :
                                            'text-red-500'
            }`}>
              {autoSaveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {autoSaveStatus === 'saved'  && <CheckCircle className="w-3 h-3" />}
              {autoSaveStatus === 'saving' ? 'Salvando...' : autoSaveStatus === 'saved' ? 'Salvo' : 'Erro ao salvar'}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-indigo-600" />
          Estratégia Central de Marketing
        </h1>
        <p className="text-slate-500 mt-1">{project?.name}</p>
      </div>

      {/* Wizard or Results */}
      {!generatedStrategy ? (
        <>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {wizardSteps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(i)}
                    className={`flex flex-col items-center gap-1 transition-all ${i === currentStep ? 'opacity-100 scale-110' : i < currentStep ? 'opacity-70' : 'opacity-40'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${i === currentStep ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : i < currentStep ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                      {i < currentStep ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-semibold hidden md:block ${i === currentStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = wizardSteps[currentStep].icon; return <Icon className="w-5 h-5 text-indigo-600" />; })()}
                {wizardSteps[currentStep].title}
              </CardTitle>
              <CardDescription>{wizardSteps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  setAutoSaveStatus('saving');
                  const { error } = await supabase
                    .from('marketing_strategies')
                    .upsert(
                      { project_id: projectId, wizard_answers: answers, updated_at: new Date().toISOString() },
                      { onConflict: 'project_id' }
                    );
                  setAutoSaveStatus(error ? 'error' : 'saved');
                  setTimeout(() => setAutoSaveStatus('idle'), 3000);
                }}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Salvar Dados
              </Button>

              {currentStep === wizardSteps.length - 1 ? (
                <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2 bg-indigo-600 hover:bg-indigo-700 px-8">
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando Estratégia...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Gerar Estratégia Central de Marketing</>
                  )}
                </Button>
              ) : (
                <Button onClick={nextStep} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  Próximo <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

        </>
      ) : (
        <>
          {/* Results View */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={() => setGeneratedStrategy(null)} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Editar Respostas
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" /> Exportar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="gap-2">
              <Download className="w-4 h-4" /> Exportar MD
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4" /> Gerar Relatório de Marketing Estratégico em PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}`)} className="gap-2">
              <FileText className="w-4 h-4" /> Ver no Dashboard
            </Button>
          </div>

          <div id="strategy-results">
            {renderStrategyResults()}
          </div>
          
          {/* Off-screen PDF container */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div id="pdf-export-content" style={{ width: '1200px', padding: '40px', backgroundColor: 'white' }}>
              {renderFullReportPDF()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
