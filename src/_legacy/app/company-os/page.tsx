'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupabaseSingleton } from '@/lib/supabase';
import { 
  Target,
  TrendingUp,
  Workflow,
  Building2,
  Shield,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';

interface Missao {
  id: string;
  missao_operacional: string;
  proposta_valor: string;
  valores: string[];
}

interface ObjetivoEstrategico {
  id: string;
  titulo: string;
  descricao: string;
  metrica_alvo: string;
  prazo: string;
  prioridade: number;
  status: string;
}

interface OKR {
  id: string;
  titulo: string;
  key_result_1: string;
  key_result_2: string;
  key_result_3: string;
  area_responsavel: string;
  progresso_percentual: number;
  prazo: string;
}

interface ValueStreamStage {
  id: string;
  estagio: string;
  descricao: string;
  metricas_chave: any;
  ordem: number;
}

interface BlocoFuncional {
  id: string;
  nome: string;
  objetivo: string;
  kpis: string[];
  personas_ids: string[];
}

const supabase = SupabaseSingleton.getInstance();

export default function CompanyOSPage() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [missao, setMissao] = useState<Missao | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoEstrategico[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [valueStream, setValueStream] = useState<ValueStreamStage[]>([]);
  const [blocos, setBlocos] = useState<BlocoFuncional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyOS();
  }, []);

  async function loadCompanyOS() {
    try {
      setLoading(true);

      // Buscar primeira empresa ativa
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id')
        .eq('status', 'ativa')
        .limit(1);

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError);
      }

      if (!empresas || empresas.length === 0) {
        console.log('Nenhuma empresa encontrada');
        setLoading(false);
        return;
      }

      const empId = empresas[0].id;
      setEmpresaId(empId);

      // Carregar dados em paralelo
      const [
        { data: missaoData },
        { data: objetivosData },
        { data: okrsData },
        { data: valueStreamData },
        { data: blocosData }
      ] = await Promise.all([
        supabase.from('empresas_missao').select('*').eq('empresa_id', empId).single(),
        supabase.from('empresas_objetivos_estrategicos').select('*').eq('empresa_id', empId),
        supabase.from('empresas_okrs').select('*').eq('empresa_id', empId),
        supabase.from('empresas_value_stream').select('*').eq('empresa_id', empId).order('ordem'),
        supabase.from('empresas_blocos_funcionais').select('*').eq('empresa_id', empId)
      ]);

      setMissao(missaoData || null);
      setObjetivos(objetivosData || []);
      setOkrs(okrsData || []);
      setValueStream(valueStreamData || []);
      setBlocos(blocosData || []);

    } catch (error) {
      console.error('Erro ao carregar Company OS:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando Company OS...</p>
        </div>
      </div>
    );
  }

  if (!missao && objetivos.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🏢 Company Operating System</CardTitle>
            <CardDescription>
              Nenhuma fundação de empresa encontrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Execute o Script 00 (Company Foundation Generator) para criar a fundação estratégica da empresa.
            </p>
            <Button>
              <Lightbulb className="mr-2 h-4 w-4" />
              Executar Script 00
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estagiosIcons: { [key: string]: any } = {
    aquisicao: '🎯',
    conversao: '💰',
    entrega: '📦',
    suporte: '🤝',
    retencao: '❤️',
    expansao: '🚀'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏢 Company Operating System</h1>
          <p className="text-gray-600 mt-1">
            Fundação estratégica e estrutura organizacional
          </p>
        </div>
        <Button onClick={loadCompanyOS} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Missão Operacional */}
      {missao && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-600" />
              🎯 Missão Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-gray-900 mb-4">
              {missao.missao_operacional}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">💎 Proposta de Valor</p>
                <p className="text-sm text-gray-600">{missao.proposta_valor}</p>
              </div>
              {missao.valores && missao.valores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">✨ Valores</p>
                  <div className="flex flex-wrap gap-2">
                    {missao.valores.map((valor, i) => (
                      <Badge key={i} variant="secondary">{valor}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objetivos Estratégicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
            🚀 Objetivos Estratégicos ({objetivos.length})
          </CardTitle>
          <CardDescription>
            Metas globais da empresa para os próximos meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objetivos.map((obj) => (
              <div key={obj.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{obj.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1">{obj.descricao}</p>
                  </div>
                  <Badge variant={obj.prioridade === 1 ? 'destructive' : obj.prioridade === 2 ? 'default' : 'secondary'}>
                    P{obj.prioridade}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center text-green-600">
                    <Target className="h-4 w-4 mr-1" />
                    {obj.metrica_alvo}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(obj.prazo).toLocaleDateString('pt-BR')}
                  </div>
                  <Badge variant={obj.status === 'ativo' ? 'default' : 'secondary'}>
                    {obj.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OKRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-purple-600" />
            📈 OKRs Ativos ({okrs.length})
          </CardTitle>
          <CardDescription>
            Objectives and Key Results com ownership definido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {okrs.map((okr) => (
              <div key={okr.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{okr.titulo}</h3>
                  <Badge variant="outline">{okr.progresso_percentual}%</Badge>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{okr.key_result_1}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{okr.key_result_2}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{okr.key_result_3}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-blue-600">
                    <Users className="h-3 w-3 mr-1" />
                    {okr.area_responsavel}
                  </div>
                  <span className="text-gray-500">
                    {new Date(okr.prazo).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${okr.progresso_percentual}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cadeia de Valor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Workflow className="mr-2 h-5 w-5 text-orange-600" />
            🔁 Cadeia de Valor (Value Stream)
          </CardTitle>
          <CardDescription>
            Fluxo completo de criação e entrega de valor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {valueStream.map((stage, index) => (
              <div key={stage.id} className="flex items-center">
                <div className="text-center min-w-[150px]">
                  <div className="text-4xl mb-2">
                    {estagiosIcons[stage.estagio] || '📍'}
                  </div>
                  <h3 className="font-semibold capitalize">{stage.estagio}</h3>
                  <p className="text-xs text-gray-600 mt-1">{stage.descricao}</p>
                  {stage.metricas_chave && (
                    <div className="mt-2 text-xs">
                      {Object.entries(stage.metricas_chave).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="text-gray-500">
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {index < valueStream.length - 1 && (
                  <ArrowRight className="mx-2 h-6 w-6 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocos Funcionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5 text-indigo-600" />
            🏢 Blocos Funcionais ({blocos.length})
          </CardTitle>
          <CardDescription>
            Departamentos estruturados com objetivos e KPIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocos.map((bloco) => (
              <div key={bloco.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{bloco.nome}</h3>
                <p className="text-sm text-gray-600 mb-3">{bloco.objetivo}</p>
                <div className="space-y-1 mb-3">
                  <p className="text-xs font-semibold text-gray-700">KPIs:</p>
                  {bloco.kpis && bloco.kpis.slice(0, 3).map((kpi, i) => (
                    <div key={i} className="text-xs text-gray-600 flex items-center">
                      <span className="mr-1">•</span>
                      {kpi}
                    </div>
                  ))}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  {bloco.personas_ids ? bloco.personas_ids.length : 0} personas
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-green-600" />
              Governança ativa
            </div>
            <div>
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
