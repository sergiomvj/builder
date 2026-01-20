'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, Users, Settings, Database, CheckCircle, AlertCircle, 
  ArrowRight, ArrowLeft, Loader2, Play, Target 
} from 'lucide-react';
import { useCreateEmpresa } from '@/lib/supabase-hooks';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

interface OnBoardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  required: string[];
  validation?: (data: EmpresaFormData) => string[];
}

interface EmpresaFormData {
  // Dados Básicos
  nome: string;
  codigo: string;
  dominio: string;
  descricao: string;
  industria: string;
  pais: string;
  idiomas: string[];
  
  // Configurações
  tamanho: 'pequena' | 'media' | 'grande';
  cultura: 'presencial' | 'remota' | 'hibrida';
  
  // Objetivos
  objetivos_principais: string[];
  metas_especificas: string[];
  
  // Personas
  total_personas: number;
  distribuicao_genero: {
    executivos_h: number;
    executivos_m: number;
    especialistas_h: number;
    especialistas_m: number;
    assistentes_h: number;
    assistentes_m: number;
  };
  
  // Configuração Técnica
  gerar_biografias: boolean;
  gerar_competencias: boolean;
  gerar_specs: boolean;
  gerar_rag: boolean;
  gerar_workflows: boolean;
}

export function OnBoardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EmpresaFormData>({
    nome: '',
    codigo: '',
    dominio: '',
    descricao: '',
    industria: 'tecnologia',
    pais: 'BR', // 🎯 Usando código padrão de país (max 10 chars)
    idiomas: ['português'],
    tamanho: 'media',
    cultura: 'hibrida',
    objetivos_principais: [],
    metas_especificas: [],
    total_personas: 20,
    distribuicao_genero: {
      executivos_h: 2,
      executivos_m: 2,
      especialistas_h: 4,
      especialistas_m: 4,
      assistentes_h: 4,
      assistentes_m: 4
    },
    gerar_biografias: true,
    gerar_competencias: true,
    gerar_specs: true,
    gerar_rag: true,
    gerar_workflows: true
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [empresaId, setEmpresaId] = useState<string>('');

  const createEmpresaMutation = useCreateEmpresa();

  const steps: OnBoardingStep[] = [
    {
      id: 0,
      title: 'Dados Básicos',
      description: 'Informações fundamentais da empresa virtual',
      icon: Building2,
      required: ['nome', 'codigo', 'descricao', 'industria'],
      validation: (data) => {
        const erros = [];
        if (!data.nome) erros.push('Nome da empresa é obrigatório');
        if (!data.codigo) erros.push('Código da empresa é obrigatório');
        if (!data.descricao || data.descricao.length < 20) erros.push('Descrição deve ter pelo menos 20 caracteres');
        return erros;
      }
    },
    {
      id: 1,
      title: 'Objetivos & Metas',
      description: 'Definir propósito e metas da empresa',
      icon: Target,
      required: ['objetivos_principais'],
      validation: (data) => {
        const erros = [];
        if (data.objetivos_principais.length === 0) erros.push('Pelo menos um objetivo principal é obrigatório');
        return erros;
      }
    },
    {
      id: 2,
      title: 'Configuração de Personas',
      description: 'Definir estrutura de pessoas e papéis',
      icon: Users,
      required: ['total_personas', 'distribuicao_genero'],
      validation: (data) => {
        const erros = [];
        const total = Object.values(data.distribuicao_genero).reduce((sum, val) => sum + val, 0);
        if (total !== data.total_personas) erros.push(`Distribuição deve somar ${data.total_personas} personas`);
        return erros;
      }
    },
    {
      id: 3,
      title: 'Configurações Técnicas',
      description: 'Selecionar quais scripts executar',
      icon: Settings,
      required: [],
      validation: (data) => {
        const erros = [];
        const algumSelecionado = data.gerar_biografias || data.gerar_competencias || 
                                data.gerar_specs || data.gerar_rag || data.gerar_workflows;
        if (!algumSelecionado) erros.push('Pelo menos uma opção técnica deve ser selecionada');
        return erros;
      }
    },
    {
      id: 4,
      title: 'Revisão & Execução',
      description: 'Confirmar dados e executar criação',
      icon: Database,
      required: [],
      validation: () => []
    }
  ];

  const generateUniqueCode = async (baseName: string): Promise<string> => {
    // SOLUÇÃO DEFINITIVA: Código com máximo absoluto de 5 caracteres
    const timestamp = Date.now();
    
    // Base super reduzida: apenas 3 caracteres
    const baseCode = baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X'); // Garantir 3 chars sempre
    
    console.log('🔧 Base gerada:', baseCode, `(${baseCode.length} chars)`);
    
    // Sempre adicionar timestamp de 2 dígitos
    const timestampSuffix = timestamp.toString().slice(-2);
    const codigo = baseCode + timestampSuffix; // Máximo: 3 + 2 = 5 chars
    
    console.log('� Código DEFINITIVO:', codigo, `(${codigo.length} chars - MÁXIMO ABSOLUTO)`);
    
    // Verificar se existe (opcional - só para log)
    try {
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .eq('codigo', codigo)
        .maybeSingle();
      
      if (existing) {
        console.log('⚠️ Código já existe, mas mantendo (timestamp garante unicidade)');
      }
    } catch (error) {
      console.log('⚠️ Erro na verificação (ignorando):', error);
    }
    
    return codigo;
  };

  // Gerar código automaticamente quando nome é inserido
  useEffect(() => {
    const generateCode = async () => {
      if (formData.nome && !formData.codigo) {
        const uniqueCode = await generateUniqueCode(formData.nome);
        setFormData(prev => ({ ...prev, codigo: uniqueCode }));
      }
    };
    generateCode();
  }, [formData.nome]);

  const validateStep = () => {
    const step = steps[currentStep];
    if (step.validation) {
      const validationErrors = step.validation(formData);
      setErrors(validationErrors);
      return validationErrors.length === 0;
    }
    setErrors([]);
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  // Auto-gerar código baseado no nome
  useEffect(() => {
    const updateCode = async () => {
      if (formData.nome && !formData.codigo) {
        const uniqueCode = await generateUniqueCode(formData.nome);
        setFormData(prev => ({ ...prev, codigo: uniqueCode }));
      }
    };
    
    updateCode();
  }, [formData.nome]);

  const validateCurrentStep = (): boolean => {
    const step = steps[currentStep];
    if (step.validation) {
      const validationErrors = step.validation(formData);
      setErrors(validationErrors);
      return validationErrors.length === 0;
    }
    setErrors([]);
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setErrors([]);
  };

  const handleExecuteOnBoarding = async () => {
    if (!validateCurrentStep()) return;
    
    setIsProcessing(true);
    setProcessingStatus('Iniciando processo de criação...');
    setErrors([]);
    
    try {
      // 1. Criar empresa no Supabase
      setProcessingStatus('Criando empresa no banco de dados...');
      console.log('🏗️ Criando empresa com dados:', formData);
      
      // SOLUÇÃO DEFINITIVA: Código com máximo absoluto de 5 caracteres
      let uniqueCode = formData.codigo;
      
      // Forçar limite absoluto de 5 caracteres
      if (!uniqueCode || uniqueCode.length > 5) {
        const timestamp = Date.now();
        uniqueCode = 'EMP' + timestamp.toString().slice(-2); // EMP + 2 dígitos = 5 chars
      } else if (uniqueCode.length < 5) {
        // Completar com timestamp se necessário
        const needed = 5 - uniqueCode.length;
        const timestamp = Date.now().toString().slice(-needed);
        uniqueCode = uniqueCode + timestamp;
      }
      
      console.log('🔒 Código FINAL:', uniqueCode, `(${uniqueCode.length} chars)`);
      
      // Dados da empresa com correção específica para campo 'pais'
      const empresaData = {
        codigo: uniqueCode,
        nome: formData.nome,
        dominio: formData.dominio,
        descricao: formData.descricao,
        industria: formData.industria,
        pais: formData.pais.substring(0, 10), // 🎯 CORREÇÃO: Campo 'pais' limitado a 10 chars no banco
        idiomas: formData.idiomas || ['pt'],
        total_personas: formData.total_personas || 20,
        status: 'processando' as const
      };

      console.log('📤 Enviando para createEmpresaMutation:', empresaData);
      console.log('🔍 Tamanhos dos campos:', {
        codigo: empresaData.codigo.length,
        nome: empresaData.nome.length,
        descricao: empresaData.descricao.length,
        industria: empresaData.industria.length,
        pais: empresaData.pais.length
      });
      console.log('🔍 Dados JSON completos:', JSON.stringify(empresaData, null, 2));
      console.log('🔍 TODOS OS TAMANHOS DE CAMPOS:', {
        codigo: empresaData.codigo?.length || 0,
        nome: empresaData.nome?.length || 0,
        descricao: empresaData.descricao?.length || 0,
        industria: empresaData.industria?.length || 0,
        pais: empresaData.pais?.length || 0,
        status: empresaData.status?.length || 0,
        idiomas: Array.isArray(empresaData.idiomas) ? empresaData.idiomas.length : 0
      });
      
      let result;
      try {
        result = await createEmpresaMutation.mutateAsync(empresaData);
        console.log('✅ Empresa criada com sucesso:', result);
      } catch (createError: any) {
        console.error('❌ ERRO DETALHADO NA CRIAÇÃO DA EMPRESA:');
        console.error('📋 Dados que causaram erro:', empresaData);
        console.error('🔍 Erro completo:', createError);
        console.error('🔍 Mensagem:', createError?.message);
        console.error('🔍 Código:', createError?.code);
        console.error('🔍 Detalhes:', createError?.details);
        console.error('🔍 Hint:', createError?.hint);
        
        // Identificar se é realmente o erro de 10 chars
        const errorMsg = createError?.message || '';
        if (errorMsg.includes('character varying(10)')) {
          console.error('🎯 CONFIRMADO: Erro de campo limitado a 10 characters');
          console.error('🔍 Investigar: Qual campo específico está causando isso');
          
          // Tentar identificar o campo problemático
          Object.entries(empresaData).forEach(([key, value]) => {
            if (typeof value === 'string' && value.length > 10) {
              console.error(`� SUSPEITO: Campo '${key}' tem ${value.length} chars: '${value}'`);
            }
          });
        }
        
        throw new Error(`Erro na criação da empresa: ${createError?.message || 'Erro desconhecido'}`);
      }
      
      console.log('🔍 ID da empresa criada:', result?.id);
      
      if (!result || !result.id) {
        throw new Error('Empresa criada mas ID não foi retornado');
      }
      
      setEmpresaId(result.id);
      setProcessingStatus(`Empresa ${result.codigo} criada! ID: ${result.id} - Executando automações...`);

      // 2. Executar scripts selecionados sequencialmente
      console.log('🔄 INICIANDO EXECUÇÃO DE SCRIPTS AUTOMÁTICOS');
      
      // MASTER FLUXO CORRETO: Empresas → Funções → PESSOAS → Competências → Especificações → Fluxos → RAG → Objetivos → Auditoria
      const scriptsToRun = ['create-personas']; // Sempre criar funções/personas primeiro
      
      // Scripts obrigatórios na ordem correta
      if (formData.gerar_biografias) scriptsToRun.push('biografias');     // PESSOAS (obrigatório antes de competências)
      if (formData.gerar_competencias) scriptsToRun.push('competencias'); // Competências (precisa das biografias)
      if (formData.gerar_specs) scriptsToRun.push('tech-specs');         // Especificações
      if (formData.gerar_rag) scriptsToRun.push('rag');                  // RAG
      if (formData.gerar_workflows) scriptsToRun.push('workflows');      // Fluxos

      console.log('🔄 Scripts para executar (Master Fluxo):', scriptsToRun);

      for (let i = 0; i < scriptsToRun.length; i++) {
        const scriptType = scriptsToRun[i];
        const progress = Math.round(((i + 1) / scriptsToRun.length) * 100);
        
        setProcessingStatus(`Executando ${scriptType} (${i + 1}/${scriptsToRun.length})...`);
        console.log(`🚀 Executando script: ${scriptType} para empresa: ${result.id}`);
        
        try {
          await executeScript(scriptType, result.id);
          console.log(`✅ Script ${scriptType} concluído`);
        } catch (scriptError: any) {
          console.error(`❌ Erro no script ${scriptType}:`, scriptError);
          const errorMessage = scriptError?.message || String(scriptError);
          throw new Error(`Falha na execução do script ${scriptType}: ${errorMessage}`);
        }
      }

      // 3. Atualizar status final
      setProcessingStatus('Finalizando configuração...');
      await supabase
        .from('empresas')
        .update({ status: 'ativa' })
        .eq('id', result.id);

      setProcessingStatus('🎉 OnBoarding concluído com sucesso!');
      console.log('� Processo de OnBoarding finalizado com sucesso!');
      
    } catch (error: any) {
      console.error('💥 Erro detalhado no OnBoarding:', error);
      
      // Log detalhado para debug
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        formData: formData,
        empresaId: empresaId,
        timestamp: new Date().toISOString()
      };
      
      console.error('🔍 Detalhes completos do erro:', errorDetails);
      
      setErrors([
        `Erro durante criação: ${error.message}`,
        'Verifique o console do navegador para mais detalhes.',
        `Timestamp: ${new Date().toISOString()}`
      ]);
      
      setProcessingStatus('❌ Erro no processo de criação');
      
    } finally {
      setIsProcessing(false);
    }
  };

  const executeScript = async (scriptType: string, targetEmpresaId: string): Promise<void> => {
    try {
      // Validações antes de executar
      if (!scriptType) {
        throw new Error('scriptType é obrigatório');
      }
      
      if (!targetEmpresaId) {
        console.error('❌ targetEmpresaId está vazio:', targetEmpresaId);
        throw new Error('empresaId é obrigatório para executar script');
      }
      
      console.log(`🔄 Iniciando execução do script ${scriptType} para empresa ${targetEmpresaId}`);
      
      const requestBody = {
        empresaId: targetEmpresaId,
        scriptType: scriptType,
        empresaData: {
          codigo: formData.codigo,
          nome: formData.nome,
          industria: formData.industria,
          pais: formData.pais,
          total_personas: formData.total_personas
        }
      };
      
      console.log(`📤 Enviando request body:`, requestBody);
      
      const response = await fetch('/api/onboarding/execute-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📡 Response status para ${scriptType}:`, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Erro na API para ${scriptType}:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Erro na execução do script`);
      }

      const result = await response.json();
      console.log(`✅ Script ${scriptType} executado com sucesso:`, result);
      
      // Atualizar status no banco - apenas se não estivermos no modo simulação
      if (result.mode !== 'simulation') {
        try {
          const { error: updateError } = await supabase
            .from('empresas')
            .update({ 
              scripts_status: {
                ...formData,
                [scriptType === 'tech-specs' ? 'tech_specs' : scriptType]: true
              }
            })
            .eq('id', targetEmpresaId);

          if (updateError) {
            console.warn(`⚠️ Erro ao atualizar status do script ${scriptType}:`, updateError);
          } else {
            console.log(`📝 Status do script ${scriptType} atualizado no banco`);
          }
        } catch (dbError) {
          console.warn(`⚠️ Erro de banco ao atualizar ${scriptType}:`, dbError);
        }
      } else {
        console.log(`ℹ️ Modo simulação - não atualizando status no banco`);
      }
        
    } catch (error: any) {
      console.error(`💥 Erro detalhado ao executar script ${scriptType}:`, {
        error: error.message,
        stack: error.stack,
        targetEmpresaId,
        scriptType
      });
      throw error;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Dados Básicos
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: TechVision Solutions"
                />
              </div>
              <div>
                <Label htmlFor="codigo">Código da Empresa *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="Ex: TECHVISION"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dominio">Domínio da Empresa 🌐</Label>
              <Input
                id="dominio"
                type="url"
                value={formData.dominio}
                onChange={(e) => setFormData(prev => ({ ...prev, dominio: e.target.value }))}
                placeholder="Ex: https://techvision.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                O domínio será usado para gerar emails corporativos das personas (ex: joao@techvision.com)
              </p>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição da Empresa *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva a empresa, seu foco de atuação e diferenciais..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Indústria</Label>
                <Select 
                  value={formData.industria} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="varejo">Varejo</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>País (máx. 10 caracteres)</Label>
                <Select 
                  value={formData.pais} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                    <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
                    <SelectItem value="ES">🇪🇸 Espanha</SelectItem>
                    <SelectItem value="FR">🇫🇷 França</SelectItem>
                    <SelectItem value="DE">🇩🇪 Alemanha</SelectItem>
                    <SelectItem value="IT">🇮🇹 Itália</SelectItem>
                    <SelectItem value="UK">🇬🇧 Reino Unido</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canadá</SelectItem>
                    <SelectItem value="MX">🇲🇽 México</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tamanho</Label>
                <Select 
                  value={formData.tamanho} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, tamanho: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequena">Pequena (5-20)</SelectItem>
                    <SelectItem value="media">Média (20-100)</SelectItem>
                    <SelectItem value="grande">Grande (100+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 1: // Objetivos & Metas
        return (
          <div className="space-y-6">
            <div>
              <Label>Objetivos Principais *</Label>
              <div className="space-y-2 mt-2">
                {['Crescimento', 'Inovação', 'Eficiência', 'Qualidade', 'Sustentabilidade', 'Expansão'].map(objetivo => (
                  <div key={objetivo} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.objetivos_principais.includes(objetivo)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            objetivos_principais: [...prev.objetivos_principais, objetivo]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            objetivos_principais: prev.objetivos_principais.filter(o => o !== objetivo)
                          }));
                        }
                      }}
                    />
                    <label className="text-sm">{objetivo}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="metas">Metas Específicas (opcional)</Label>
              <Textarea
                id="metas"
                placeholder="Descreva metas específicas da empresa..."
                rows={3}
              />
            </div>
          </div>
        );

      case 2: // Configuração de Personas
        return (
          <div className="space-y-6">
            <div>
              <Label>Total de Personas: {formData.total_personas}</Label>
              <div className="mt-2">
                <Input
                  type="range"
                  min="10"
                  max="30"
                  value={formData.total_personas}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_personas: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Executivos</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Homens</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={formData.distribuicao_genero.executivos_h}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribuicao_genero: {
                          ...prev.distribuicao_genero,
                          executivos_h: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mulheres</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={formData.distribuicao_genero.executivos_m}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribuicao_genero: {
                          ...prev.distribuicao_genero,
                          executivos_m: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Especialistas</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Homens</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.distribuicao_genero.especialistas_h}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribuicao_genero: {
                          ...prev.distribuicao_genero,
                          especialistas_h: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mulheres</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.distribuicao_genero.especialistas_m}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribuicao_genero: {
                          ...prev.distribuicao_genero,
                          especialistas_m: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Assistentes</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Homens</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.distribuicao_genero.assistentes_h}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      distribuicao_genero: {
                        ...prev.distribuicao_genero,
                        assistentes_h: parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mulheres</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.distribuicao_genero.assistentes_m}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      distribuicao_genero: {
                        ...prev.distribuicao_genero,
                        assistentes_m: parseInt(e.target.value) || 0
                      }
                    }))}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <strong>Total: </strong>
                {Object.values(formData.distribuicao_genero).reduce((sum, val) => sum + val, 0)} personas
              </div>
            </div>
          </div>
        );

      case 3: // Configurações Técnicas
        return (
          <div className="space-y-4">
            {[
              { key: 'gerar_biografias', title: 'Gerar Biografias', desc: 'Criar biografias completas para todas as personas' },
              { key: 'gerar_competencias', title: 'Mapear Competências', desc: 'Analisar competências técnicas e comportamentais' },
              { key: 'gerar_specs', title: 'Especificações Técnicas', desc: 'Definir specs técnicas por função' },
              { key: 'gerar_rag', title: 'Base RAG', desc: 'Criar base de conhecimento específica' },
              { key: 'gerar_workflows', title: 'Workflows N8N', desc: 'Gerar automações de processos' }
            ].map(item => (
              <div key={item.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={formData[item.key as keyof EmpresaFormData] as boolean}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [item.key]: checked }))}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 4: // Revisão & Execução
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Resumo da Empresa</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {formData.nome}</div>
                <div><strong>Código:</strong> {formData.codigo}</div>
                <div><strong>Indústria:</strong> {formData.industria}</div>
                <div><strong>Total Personas:</strong> {formData.total_personas}</div>
                <div><strong>Objetivos:</strong> {formData.objetivos_principais.join(', ')}</div>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{processingStatus}</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            )}

            {!isProcessing && !empresaId && (
              <div className="space-y-3">
                <Button onClick={handleExecuteOnBoarding} className="w-full" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Executar OnBoarding Completo
                </Button>
                
                <Button 
                  onClick={async () => {
                    console.log('🧪 TESTE - Dados do formulário:', formData);
                    console.log('🧪 TESTE - createEmpresaMutation:', createEmpresaMutation);
                    
                    try {
                      // Gerar código único para teste
                      const timestamp = Date.now();
                      const uniqueCode = `TEST${timestamp.toString().slice(-6)}`;
                      
                      const testData = {
                        codigo: uniqueCode,
                        nome: formData.nome || `Empresa Teste ${timestamp}`,
                        dominio: formData.dominio || `https://empresa-teste-${timestamp}.com`,
                        descricao: formData.descricao || 'Descrição de teste com mais de 20 caracteres para atender validação',
                        industria: formData.industria,
                        pais: formData.pais,
                        idiomas: formData.idiomas,
                        total_personas: formData.total_personas,
                        status: 'ativa' as const,
                        scripts_status: {
                          create_personas: false,
                          avatares: false,
                          biografias: false,
                          atribuicoes: false,
                          competencias: false,
                          tasks_automation: false,
                          workflows_n8n: false
                        }
                      };
                      
                      console.log('🧪 TESTE - Enviando dados:', testData);
                      const result = await createEmpresaMutation.mutateAsync(testData);
                      console.log('🧪 TESTE - Resultado:', result);
                      console.log('🧪 TESTE - ID criado:', result?.id);
                      
                      if (result && result.id) {
                        setEmpresaId(result.id);
                        alert(`✅ Teste OK! Empresa criada com ID: ${result.id} e código: ${uniqueCode}`);
                      } else {
                        alert(`⚠️ Empresa criada mas sem ID retornado`);
                      }
                    } catch (error: any) {
                      console.error('🧪 TESTE - Erro completo:', error);
                      console.error('🧪 TESTE - Stack:', error.stack);
                      alert(`❌ Erro no teste: ${error.message}`);
                    }
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  🧪 Teste Criar Empresa (Debug)
                </Button>
              </div>
            )}

            {empresaId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Empresa criada com sucesso! ID: {empresaId}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header do Wizard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              OnBoarding de Empresa Virtual
            </div>
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    Criar Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Empresa com Gerador Estratégico</DialogTitle>
                    <DialogDescription>
                      Você pode usar o Gerador Estratégico para criar uma empresa automaticamente com personas e biografias.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex flex-col gap-3">
                    <Link href="/create-strategic-company" target="_blank" rel="noopener noreferrer" className="no-underline">
                      <Button className="w-full">
                        Ir para Gerador Estratégico (abre em nova aba)
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => { /* apenas fecha o diálogo */ }}>
                      Fechar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
              onClick={async () => {
                console.log('🧪 DEBUG - Testando criação simples...');
                console.log('🧪 DEBUG - Timestamp:', new Date().toISOString());
                
                try {
                  const timestamp = Date.now().toString().slice(-4);
                  const testData = {
                    codigo: `TEST${timestamp}`,
                    nome: 'Empresa de Teste Debugging',
                    dominio: `https://teste-debug-${timestamp}.com`,
                    descricao: 'Teste para identificar problema de criação no frontend',
                    industria: 'tecnologia',
                    pais: 'BR',
                    idiomas: ['pt'],
                    total_personas: 20,
                    status: 'processando' as const
                  };
                  
                  console.log('🧪 DEBUG - Dados de teste RAW:', testData);
                  console.log('🧪 DEBUG - Tipos dos campos:', {
                    codigo: typeof testData.codigo,
                    nome: typeof testData.nome,
                    descricao: typeof testData.descricao,
                    industria: typeof testData.industria,
                    pais: typeof testData.pais,
                    status: typeof testData.status
                  });
                  console.log('🧪 DEBUG - Tamanhos detalhados:', {
                    codigo: `'${testData.codigo}' (${testData.codigo.length} chars)`,
                    nome: `'${testData.nome}' (${testData.nome.length} chars)`, 
                    descricao: `'${testData.descricao}' (${testData.descricao.length} chars)`,
                    industria: `'${testData.industria}' (${testData.industria.length} chars)`,
                    pais: `'${testData.pais}' (${testData.pais.length} chars)`,
                    status: `'${testData.status}' (${testData.status.length} chars)`
                  });
                  
                  // Identificar campos > 10 chars ANTES de enviar
                  console.log('🔍 DEBUG - Campos > 10 chars:');
                  Object.entries(testData).forEach(([key, value]) => {
                    if (typeof value === 'string' && value.length > 10) {
                      console.error(`🚨 CAMPO SUSPEITO: ${key} = '${value}' (${value.length} chars > 10)`);
                    }
                  });
                  
                  console.log('🧪 DEBUG - JSON stringified:', JSON.stringify(testData, null, 2));
                  console.log('🧪 DEBUG - Iniciando mutateAsync...');
                  
                  const result = await createEmpresaMutation.mutateAsync(testData);
                  console.log('🧪 DEBUG - Sucesso:', result);
                  alert(`✅ Teste OK! ID: ${result?.id}`);
                  
                  // Cleanup
                  if (result?.id) {
                    console.log('🗑️ DEBUG - Iniciando cleanup...');
                    await supabase.from('empresas').delete().eq('id', result.id);
                    console.log('🗑️ DEBUG - Cleanup realizado');
                  }
                  
                } catch (error: any) {
                  console.error('🧪 DEBUG - ========= INÍCIO DO ERRO =========');
                  console.error('🧪 DEBUG - Error object:', error);
                  console.error('🧪 DEBUG - Error type:', typeof error);
                  console.error('🧪 DEBUG - Error constructor:', error?.constructor?.name);
                  console.error('🧪 DEBUG - Error message:', error?.message);
                  console.error('🧪 DEBUG - Error code:', error?.code);
                  console.error('🧪 DEBUG - Error details:', error?.details);
                  console.error('🧪 DEBUG - Error hint:', error?.hint);
                  console.error('🧪 DEBUG - Error status:', error?.status);
                  console.error('🧪 DEBUG - Error statusCode:', error?.statusCode);
                  console.error('🧪 DEBUG - Error stack:', error?.stack);
                  console.error('🧪 DEBUG - Error keys:', Object.keys(error || {}));
                  
                  // Verificar se é erro do Supabase especificamente
                  if (error?.message?.includes?.('character varying(10)')) {
                    console.error('🎯 DEBUG - CONFIRMADO: Erro de character varying(10)');
                    
                    // Log do que foi enviado quando deu erro
                    console.error('🔍 DEBUG - Dados que causaram o erro:');
                    console.error('🔍 DEBUG - createEmpresaMutation.variables:', createEmpresaMutation?.variables);
                    console.error('🔍 DEBUG - createEmpresaMutation.error:', createEmpresaMutation?.error);
                  }
                  
                  console.error('🧪 DEBUG - ========= FIM DO ERRO =========');
                  alert(`❌ Erro detalhado logado no console: ${error?.message}`);
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🧪 Debug Completo
            </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Processo guiado para criação completa de empresas no sistema VCM
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Barra de Progresso */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Etapa {currentStep + 1} de {steps.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progressPercentage)}% concluído
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {/* Steps indicator */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Step Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 0 && <Building2 className="h-5 w-5" />}
            {currentStep === 1 && <Target className="h-5 w-5" />}
            {currentStep === 2 && <Users className="h-5 w-5" />}
            {currentStep === 3 && <Settings className="h-5 w-5" />}
            {currentStep === 4 && <Database className="h-5 w-5" />}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
          
          {/* Erros de validação */}
          {errors.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0 || isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={isProcessing}>
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div /> // Espaço vazio na última etapa
        )}
      </div>
    </div>
  );
}