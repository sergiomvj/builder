'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CheckCircle, AlertTriangle, Target, Zap } from 'lucide-react';
import { useEmpresas, useAllPersonas } from '@/lib/supabase-hooks';

export function VisaoGeralPage() {
  const { data: empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { data: personas, isLoading: loadingPersonas } = useAllPersonas();

  // Cálculos das métricas sistêmicas
  const totalEmpresas = empresas?.length || 0;
  const empresasAtivas = empresas?.filter(e => e.status === 'ativa').length || 0;
  const totalPersonas = personas?.length || 0;
  
  // Métricas de completude do fluxo
  const personasComBiografia = personas?.filter((p: any) => p.biografia_completa || p.biografia).length || 0;
  const personasComCompetencias = personas?.filter((p: any) => 
    p.competencias_tecnicas?.length > 0 || p.competencias_comportamentais?.length > 0
  ).length || 0;
  
  const percentualFluxoCompleto = totalPersonas > 0 
    ? Math.round((personasComBiografia / totalPersonas) * 100) 
    : 0;

  const percentualCompetencias = totalPersonas > 0
    ? Math.round((personasComCompetencias / totalPersonas) * 100)
    : 0;

  // Status geral do sistema
  const statusSistema = percentualFluxoCompleto >= 80 ? 'saudavel' : 
                       percentualFluxoCompleto >= 50 ? 'atencao' : 'critico';

  if (loadingEmpresas || loadingPersonas) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header da Visão Geral */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Visão Geral do Sistema VCM
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Acompanhe a saúde do fluxo sistêmico: <strong>Empresas → Funções → Pessoas → Competências → 
          Especificações → Fluxos → RAG → Objetivos → Auditoria</strong>
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total de Empresas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas no Sistema
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpresas}</div>
            <p className="text-xs text-muted-foreground">
              {empresasAtivas} ativas de {totalEmpresas} totais
            </p>
          </CardContent>
        </Card>

        {/* Total de Personas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Personas Criadas
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPersonas}</div>
            <p className="text-xs text-muted-foreground">
              {personasComBiografia} com biografia completa
            </p>
          </CardContent>
        </Card>

        {/* Completude do Fluxo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fluxo Sistêmico
            </CardTitle>
            {statusSistema === 'saudavel' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : statusSistema === 'atencao' ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualFluxoCompleto}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusSistema === 'saudavel' ? 'default' : 
                             statusSistema === 'atencao' ? 'secondary' : 'destructive'}>
                {statusSistema === 'saudavel' ? 'Saudável' : 
                 statusSistema === 'atencao' ? 'Atenção' : 'Crítico'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Competências Mapeadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Competências
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualCompetencias}%</div>
            <p className="text-xs text-muted-foreground">
              Personas com competências mapeadas
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Painel de Diagnóstico do Fluxo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Diagnóstico do Fluxo Sistêmico
          </CardTitle>
          <CardDescription>
            Verificação das 3 perguntas fundamentais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Pergunta 1: Como verificar se o fluxo está correto? */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2">
              1. Como posso verificar se o fluxo está correto?
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Empresas:</span>
                <div className="text-blue-600">{empresasAtivas} ativas</div>
              </div>
              <div>
                <span className="font-medium">Pessoas:</span>
                <div className="text-blue-600">{totalPersonas} criadas</div>
              </div>
              <div>
                <span className="font-medium">Biografias:</span>
                <div className="text-blue-600">{personasComBiografia} completas</div>
              </div>
              <div>
                <span className="font-medium">Competências:</span>
                <div className="text-blue-600">{personasComCompetencias} mapeadas</div>
              </div>
            </div>
          </div>

          {/* Pergunta 2: Como melhorar o fluxo? */}
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h4 className="font-semibold text-yellow-900 mb-2">
              2. Como posso melhorar o fluxo de trabalho?
            </h4>
            <div className="space-y-2 text-sm text-yellow-800">
              {percentualFluxoCompleto < 50 && (
                <div>• Priorizar geração de biografias para personas existentes</div>
              )}
              {percentualCompetencias < 70 && (
                <div>• Executar análise de competências técnicas e comportamentais</div>
              )}
              {totalEmpresas < 3 && (
                <div>• Considerar criação de mais empresas para diversificar cenários</div>
              )}
              <div>• Implementar especificações técnicas para funções críticas</div>
              <div>• Desenvolver base de conhecimento (RAG) por área de atuação</div>
            </div>
          </div>

          {/* Pergunta 3: Os dados são suficientes? */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-semibold text-green-900 mb-2">
              3. Os dados são suficientes para avaliar o fluxo?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Qualidade dos Dados:</span>
                <div className={`${percentualFluxoCompleto >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentualFluxoCompleto >= 70 ? 'Boa' : 'Insuficiente'}
                </div>
              </div>
              <div>
                <span className="font-medium">Cobertura:</span>
                <div className={`${totalPersonas >= 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {totalPersonas >= 10 ? 'Adequada' : 'Limitada'}
                </div>
              </div>
              <div>
                <span className="font-medium">Próximos Passos:</span>
                <div className="text-green-600">
                  {percentualFluxoCompleto >= 80 ? 'Implementar RAG' : 'Completar personas'}
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}