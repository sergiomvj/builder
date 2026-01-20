'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateEmpresa, useUpdateEmpresa } from '@/lib/supabase-hooks';
import { Empresa } from '@/lib/supabase';
import { X, Save, Loader2, Globe, Users, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  gerarEstruturaOrganizacional, 
  converterParaCargosNecessarios,
  gerarResumoEstrutura,
  type EstruturaOrganizacional 
} from '@/lib/openai-company-structure';

const companySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  industria: z.string().min(1, 'Indústria é obrigatória'),
  dominio: z.string().url('URL inválida').optional().or(z.literal('')),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  status: z.enum(['ativa', 'inativa', 'processando']),
  pais: z.string().min(1, 'País é obrigatório'),
  ceo_gender: z.enum(['masculino', 'feminino']),
  executives_male: z.number().min(0).max(10),
  executives_female: z.number().min(0).max(10),
  assistants_male: z.number().min(0).max(10),
  assistants_female: z.number().min(0).max(10),
  specialists_male: z.number().min(0).max(10),
  specialists_female: z.number().min(0).max(10),
  idiomas: z.array(z.string()).optional(),
  nationalities: z.array(z.object({
    tipo: z.string(),
    percentual: z.number().min(0).max(100)
  })).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Empresa | null;
  onClose: (createdCompany?: Empresa) => void;
}

export function CompanyForm({ company, onClose }: CompanyFormProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    company?.idiomas || ['ingles', 'portugues', 'espanhol']
  );
  
  // Estado para nacionalidades
  const [nacionalidades, setNacionalidades] = useState<Array<{tipo: string, percentual: number}>>(
    company?.nationalities || [
      { tipo: 'americanos', percentual: 40 },
      { tipo: 'brasileiros', percentual: 30 },
      { tipo: 'europeus', percentual: 20 },
      { tipo: 'asiaticos', percentual: 10 }
    ]
  );

  // Estado para nacionalidades individuais geradas
  const [personasNacionalidades, setPersonasNacionalidades] = useState<Array<{
    nacionalidade_especifica: string;
    genero: string;
    idioma_nativo: string;
    idiomas_empresa: string[];
  }>>([]);

  // Handler para geração de nacionalidades individuais via IA
  const handleGerarNacionalidadesIndividuais = async () => {
    // Chamada ao backend para gerar nacionalidades individuais
    try {
      const res = await fetch('/api/personas/generate-nacionalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: company?.id || null,
          cargos: cargosEditaveis,
          nacionalidades,
          idiomas: selectedLanguages
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.personas)) {
        setPersonasNacionalidades(data.personas);
      } else {
        setPersonasNacionalidades([]);
      }
    } catch (err) {
      setPersonasNacionalidades([]);
    }
  };
  
  // Estado para estrutura organizacional gerada pela IA
  const [estruturaIA, setEstruturaIA] = useState<EstruturaOrganizacional | null>(null);
  const [gerandoEstrutura, setGerandoEstrutura] = useState(false);
  const [cargosEditaveis, setCargosEditaveis] = useState<string[]>([]);
  
  const createMutation = useCreateEmpresa();
  const updateMutation = useUpdateEmpresa();
  const { toast } = useToast();

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);
  
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nome: company?.nome || '',
      codigo: company?.codigo || '',
      industria: company?.industria || 'tecnologia',
      dominio: company?.dominio || '',
      descricao: company?.descricao || '',
      status: company?.status || 'ativa',
      pais: 'US', // FIXO: Todas as empresas são americanas (base USA)
      ceo_gender: company?.ceo_gender || 'feminino',
      executives_male: company?.executives_male || 2,
      executives_female: company?.executives_female || 2,
      assistants_male: company?.assistants_male || 2,
      assistants_female: company?.assistants_female || 3,
      specialists_male: company?.specialists_male || 3,
      specialists_female: company?.specialists_female || 3,
      idiomas: company?.idiomas || ['ingles', 'portugues', 'espanhol'], // Idiomas obrigatórios
    }
  });

  const isEditing = !!company;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Função para gerar estrutura organizacional com OpenAI
  const handleGerarEstrutura = async () => {
    const formData = form.getValues();
    if (!formData.nome || !formData.descricao || !formData.industria) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha Nome, Descrição e Indústria antes de gerar a estrutura',
        variant: 'destructive'
      });
      return;
    }

    setGerandoEstrutura(true);
    try {
      // Envia todos os dados do formulário para o LLM
      const estrutura = await gerarEstruturaOrganizacional({
        nome: formData.nome,
        descricao: formData.descricao,
        industria: formData.industria,
        mercado_alvo: formData.mercado_alvo || formData.descricao,
        porte: formData.porte || 'medio',
        pais: formData.pais,
        codigo: formData.codigo,
        dominio: formData.dominio,
        status: formData.status,
        ceo_gender: formData.ceo_gender,
        executives_male: formData.executives_male,
        executives_female: formData.executives_female,
        assistants_male: formData.assistants_male,
        assistants_female: formData.assistants_female,
        specialists_male: formData.specialists_male,
        specialists_female: formData.specialists_female,
        idiomas: formData.idiomas,
        nationalities: formData.nationalities
      });

      setEstruturaIA(estrutura);
      const cargos = converterParaCargosNecessarios(estrutura);
      setCargosEditaveis(cargos);

      toast({
        title: '✨ Estrutura gerada com sucesso!',
        description: `${estrutura.total_posicoes} cargos específicos criados para ${formData.nome} usando OpenRouter LLM`
      });

    } catch (error) {
      console.error('Erro ao gerar estrutura:', error);
      // Mensagem específica para rate limit
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || error.message.includes('Rate') || error.message.includes('limite'));
      toast({
        title: isRateLimit ? '⏱️ Limite de requisições atingido' : 'Erro ao gerar estrutura',
        description: isRateLimit 
          ? 'A OpenAI tem limite de chamadas por minuto. Aguarde 60 segundos e tente novamente.'
          : (error instanceof Error ? error.message : 'Tente novamente'),
        variant: 'destructive',
        duration: isRateLimit ? 10000 : 5000
      });
    } finally {
      setGerandoEstrutura(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      // Validar idiomas obrigatórios
      const idiomasObrigatorios = ['ingles', 'portugues', 'espanhol'];
      const temTodosObrigatorios = idiomasObrigatorios.every(idioma => selectedLanguages.includes(idioma));
      
      if (!temTodosObrigatorios) {
        toast({
          title: 'Erro de validação',
          description: 'Inglês, Português e Espanhol são obrigatórios',
          variant: 'destructive'
        });
        return;
      }
      
      if (selectedLanguages.length < 5) {
        toast({
          title: 'Aviso',
          description: 'Recomendamos pelo menos 5 idiomas para diversidade global',
          variant: 'default'
        });
      }
      
      // Usar cargos gerados pela IA ou fallback para estrutura genérica
      const cargosNecessarios = cargosEditaveis.length > 0 
        ? cargosEditaveis
        : [
            data.ceo_gender === 'masculino' ? 'CEO' : 'CEO',
            ...Array(data.executives_male).fill('Executive'),
            ...Array(data.executives_female).fill('Executive'),
            ...Array(data.assistants_male).fill('Assistant'),
            ...Array(data.assistants_female).fill('Assistant'),
            ...Array(data.specialists_male).fill('Specialist'),
            ...Array(data.specialists_female).fill('Specialist')
          ];

      const companyData = {
        nome: data.nome,
        codigo: data.codigo,
        industria: data.industria,
        dominio: data.dominio || '',
        descricao: data.descricao,
        pais: 'US', // Fixo: Estados Unidos (padrão global)
        status: data.status,
        idiomas: selectedLanguages,
        cargos_necessarios: cargosNecessarios,
        equipe_gerada: false,
        total_personas: cargosNecessarios.length,
        scripts_status: company?.scripts_status || {
          create_personas: false,
          avatares: false,
          biografias: false,
          atribuicoes: false,
          competencias: false,
          tasks_automation: false,
          workflows_n8n: false
        },
        ceo_gender: data.ceo_gender,
        executives_male: data.executives_male,
        executives_female: data.executives_female,
        assistants_male: data.assistants_male,
        assistants_female: data.assistants_female,
        specialists_male: data.specialists_male,
        specialists_female: data.specialists_female,
      };

      if (isEditing && company) {
        const updatedCompany = await updateMutation.mutateAsync({
          id: company.id,
          ...companyData,
        });
        toast({
          title: 'Empresa atualizada com sucesso!',
        });
        onClose(updatedCompany);
      } else {
        // Criar nova empresa
        const createdCompany = await createMutation.mutateAsync(companyData);
        
        toast({
          title: 'Empresa criada com sucesso!',
          description: `Estrutura salva com ${cargosNecessarios.length} cargos. Use o script de automação para gerar as personas.`
        });
        
        // Fechar modal e passar empresa criada
        onClose(createdCompany);
      }
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast({
        title: isEditing ? 'Erro ao atualizar empresa' : 'Erro ao criar empresa',
        description: 'Tente novamente.'
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative z-[1000] w-full max-w-[800px] max-h-[90vh] mx-4 bg-white rounded-lg shadow-2xl border flex flex-col">
        <div className="flex-shrink-0 p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Editar Empresa' : 'Nova Empresa Virtual'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-4">📋 Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
                  <input
                    {...form.register('nome')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: TechVision Solutions"
                  />
                  {form.formState.errors.nome && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.nome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Código Identificador *</label>
                  <input
                    {...form.register('codigo')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: TECH001"
                    disabled={isEditing}
                  />
                  {form.formState.errors.codigo && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.codigo.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Globe size={16} className="text-blue-600" />
                    Domínio da Empresa
                  </label>
                  <input
                    {...form.register('dominio')}
                    type="url"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: https://techvision.com"
                  />
                  {form.formState.errors.dominio && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.dominio.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    O domínio será usado para gerar emails corporativos das personas
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-medium text-green-900 mb-4">📝 Descrição</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição da Empresa *</label>
                <textarea
                  {...form.register('descricao')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descreva o negócio, missão e atividades principais..."
                />
                {form.formState.errors.descricao && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.descricao.message}</p>
                )}
              </div>
            </div>

            {/* 🤖 NOVA SEÇÃO: Geração de Estrutura Organizacional com IA */}
            {!isEditing && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Wand2 size={28} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-purple-900 mb-2">
                      🤖 Gerador de Estrutura Organizacional com IA
                    </h3>
                    <p className="text-sm text-purple-700">
                      O Grok AI (via OpenRouter) analisará seu negócio e criará uma estrutura organizacional completa com 
                      <strong> cargos 100% específicos</strong> do seu nicho de mercado.
                    </p>
                  </div>
                </div>

                {!estruturaIA ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-md border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Como funciona:</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">1.</span>
                          <span>Preencha <strong>Nome, Descrição e Indústria</strong> da empresa acima</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">2.</span>
                          <span>Clique em <strong>"Gerar Estrutura com IA"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">3.</span>
                          <span>A IA criará cargos específicos (ex: "Veterinário Consultor" para agro, não apenas "Especialista")</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">4.</span>
                          <span>Revise e ajuste os cargos se necessário</span>
                        </li>
                      </ul>
                    </div>

                    <Button
                      type="button"
                      onClick={handleGerarEstrutura}
                      disabled={gerandoEstrutura}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg"
                    >
                      {gerandoEstrutura ? (
                        <>
                          <Loader2 size={20} className="animate-spin mr-2" />
                          Analisando seu negócio e gerando estrutura...
                        </>
                      ) : (
                        <>
                          <Wand2 size={20} className="mr-2" />
                          Gerar Estrutura com IA
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-purple-600 text-center">
                      💡 Exemplo: Para "Consultoria de Vacinas Bovinas", a IA criará cargos como 
                      "Veterinário Consultor Sênior", "Especialista em Imunologia Animal", etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h4 className="font-bold text-green-900">Estrutura gerada com sucesso!</h4>
                      </div>
                      
                      <div className="bg-white p-4 rounded border mb-4">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                          {gerarResumoEstrutura(estruturaIA)}
                        </pre>
                      </div>

                      <div className="bg-white p-4 rounded border">
                        <h5 className="font-semibold text-gray-900 mb-3">Cargos Editáveis:</h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {cargosEditaveis.map((cargo, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={cargo}
                                onChange={(e) => {
                                  const novos = [...cargosEditaveis];
                                  novos[index] = e.target.value;
                                  setCargosEditaveis(novos);
                                }}
                                className="flex-1 px-3 py-2 text-sm border rounded"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCargosEditaveis(cargosEditaveis.filter((_, i) => i !== index));
                                }}
                                className="text-red-600"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCargosEditaveis([...cargosEditaveis, 'Novo Cargo'])}
                          className="w-full mt-3"
                        >
                          + Adicionar Cargo
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEstruturaIA(null);
                          setCargosEditaveis([]);
                        }}
                        className="flex-1"
                      >
                        Gerar Novamente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diversidade Automática */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users size={24} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900">🌍 Diversidade Global Automática</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Sistema automático de distribuição de nacionalidades (5+ países)
                  </p>
                </div>
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  AUTOMÁTICO
                </span>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-gray-900">Distribuição Inteligente</p>
                    <p className="text-sm text-gray-600">
                      O sistema distribui automaticamente as {cargosEditaveis.length > 0 ? cargosEditaveis.length : '40'} personas entre
                      pelo menos 5 nacionalidades diferentes (Americanos, Brasileiros, Europeus, Asiáticos, etc.)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold text-gray-900">Pesos Equilibrados</p>
                    <p className="text-sm text-gray-600">
                      Distribuição típica: 30% (principal) + 25% + 20% + 15% + 10% (evita mono-cultura)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🗣️</span>
                  <div>
                    <p className="font-semibold text-gray-900">Idiomas Nativos Corretos</p>
                    <p className="text-sm text-gray-600">
                      Cada persona recebe idiomas apropriados para sua nacionalidade + idiomas da empresa
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Como funciona:</strong> Após criar a empresa, execute o <code className="bg-blue-100 px-1 rounded">Script 02 (Biografias)</code>
                  que automaticamente distribuirá as nacionalidades usando o <code className="bg-blue-100 px-1 rounded">diversity_manager.js</code>
                </p>
              </div>


            </div>

            {/* Configurações */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-lg font-medium text-purple-900 mb-4">⚙️ Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Indústria *</label>
                  <select
                    {...form.register('industria')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="tecnologia">Tecnologia</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="varejo">Varejo</option>
                    <option value="industria">Indústria</option>
                    <option value="consultoria">Consultoria</option>
                    <option value="servicos">Serviços</option>
                    <option value="agropecuaria">Agropecuária</option>
                    <option value="construcao">Construção</option>
                    <option value="transporte">Transporte</option>
                    <option value="energia">Energia</option>
                    <option value="telecomunicacoes">Telecomunicações</option>
                    <option value="entretenimento">Entretenimento</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">País (Base Global) *</label>
                  <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    🇺🇸 Estados Unidos (Padrão Global)
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Todas as empresas têm base nos EUA com equipes multiculturais (5+ nacionalidades)
                  </p>
                  <input type="hidden" {...form.register('pais')} value="US" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    {...form.register('status')}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                    <option value="processando">Processando</option>
                  </select>
                </div>
              </div>

              {/* Idiomas Requeridos */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">🌐 Idiomas Requeridos pelas Personas</label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                  <p className="text-xs text-blue-800">
                    <strong>Padrão Global:</strong> Inglês, Português e Espanhol são <strong>obrigatórios</strong>. 
                    Selecione 2+ idiomas extras para garantir diversidade mínima de 5 idiomas.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'portugues', label: 'Português', flag: '🇧🇷' },
                    { value: 'ingles', label: 'Inglês', flag: '🇺🇸' },
                    { value: 'espanhol', label: 'Espanhol', flag: '🇪🇸' },
                    { value: 'frances', label: 'Francês', flag: '🇫🇷' },
                    { value: 'alemao', label: 'Alemão', flag: '🇩🇪' },
                    { value: 'italiano', label: 'Italiano', flag: '🇮🇹' },
                    { value: 'mandarim', label: 'Mandarim', flag: '🇨🇳' },
                    { value: 'japones', label: 'Japonês', flag: '🇯🇵' },
                    { value: 'coreano', label: 'Coreano', flag: '🇰🇷' },
                    { value: 'russo', label: 'Russo', flag: '🇷🇺' },
                    { value: 'arabe', label: 'Árabe', flag: '🇸🇦' },
                    { value: 'hindi', label: 'Hindi', flag: '🇮🇳' }
                  ].map((idioma) => {
                    const isObrigatorio = ['portugues', 'ingles', 'espanhol'].includes(idioma.value);
                    const isChecked = selectedLanguages.includes(idioma.value);
                    
                    return (
                      <label 
                        key={idioma.value} 
                        className={`flex items-center gap-2 p-2 border rounded-md ${
                          isObrigatorio 
                            ? 'bg-blue-50 border-blue-300 cursor-not-allowed' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={idioma.value}
                          checked={isChecked}
                          disabled={isObrigatorio}
                          onChange={(e) => {
                            if (!isObrigatorio) {
                              if (e.target.checked) {
                                setSelectedLanguages([...selectedLanguages, idioma.value]);
                              } else {
                                setSelectedLanguages(selectedLanguages.filter(lang => lang !== idioma.value));
                              }
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-lg">{idioma.flag}</span>
                        <span className="text-sm">{idioma.label}</span>
                        {isObrigatorio && (
                          <span className="text-xs bg-blue-600 text-white px-1 rounded ml-auto">Obrigatório</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                
                {selectedLanguages.length < 5 && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Recomendado: Selecione pelo menos 5 idiomas para garantir diversidade global (atualmente: {selectedLanguages.length})
                  </p>
                )}
              </div>
            </div>

            {/* Seção de Geração de Equipe Diversa */}
            {!isEditing && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Gerador de Equipe Diversa</h3>
                    <p className="text-sm text-green-600">
                      Crie automaticamente uma equipe realista e diversa para sua empresa
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      AUTOMÁTICO
                    </span>
                  </div>
                </div>

                {/* Removida referência a equipeGenerada - código legacy */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center gap-3">
                      <Wand2 size={20} className="text-blue-600" />
                      <div>
                        <p className="font-medium">Use scripts Node.js para gerar personas</p>
                        <p className="text-sm text-gray-600">
                          node 00_create_personas_from_structure.js --empresaId=ID
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {isLoading 
                  ? (isEditing ? 'Salvando...' : 'Criando...') 
                  : (isEditing ? 'Salvar' : 'Criar Empresa')
                }
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}