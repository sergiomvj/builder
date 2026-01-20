'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Brain, Users, Target, CheckCircle, ExternalLink, Building } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { NoSSR } from '@/components/no-ssr'

interface Persona {
  role: string
  specialty: string
  department: string
  nivel: string
}

interface AnaliseEstrategica {
  analise_empresa: {
    desafios: string[]
    oportunidades: string[]
    necessidades: string[]
  }
  proposta_valor: {
    diferenciais: string[]
    estrategia_principal: string
    foco_atuacao: string
  }
  equipe_recomendada: {
    essenciais: string[]
    opcionais: string[]
    justificativas: Record<string, string>
    prioridades: Record<string, number>
  }
  estrategia_sdr: {
    segmentos_alvo: string[]
    estrategia_prospeccao: string
    especializacoes: Record<string, string>
  }
}

export default function StrategicCompanyGenerator() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [empresaData, setEmpresaData] = useState({
    nome: '',
    industria: '',
    pais: 'Brasil',
    descricao: ''
  })
  const [idiomasRequeridos, setIdiomasRequeridos] = useState<string[]>(['Português', 'Inglês'])
  const [analiseEstrategica, setAnaliseEstrategica] = useState<AnaliseEstrategica | null>(null)
  const [estruturaPersonas, setEstruturaPersonas] = useState<Record<string, Persona>>({})
  const [personasEscolhidas, setPersonasEscolhidas] = useState<string[]>([])
  const [empresaCriada, setEmpresaCriada] = useState<any>(null)

  // 🧠 PASSO 1: Análise estratégica
  const handleAnalyzeCompany = async () => {
    if (!empresaData.nome || !empresaData.industria) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome e indústria são obrigatórios' })
      return
    }

    setLoading(true)
    try {
      console.log('🧠 Iniciando análise estratégica...')
      
      const response = await fetch('/api/generate-strategic-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          companyData: empresaData
        })
      })

      const result = await response.json()
      console.log('📊 Resultado análise:', result)
      
      if (result.success) {
        setAnaliseEstrategica(result.analise_estrategica)
        setEstruturaPersonas(result.estrutura_personas)
        setPersonasEscolhidas(result.analise_estrategica.equipe_recomendada.essenciais)
        setStep(2)
        toast({ title: 'Sucesso!', description: 'Análise estratégica concluída!' })
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Erro na análise' })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao analisar empresa' })
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🎨 PASSO 2: Gerar empresa completa
  const handleGenerateCompany = async () => {
    if (!personasEscolhidas.length) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione pelo menos uma persona' })
      return
    }

    setLoading(true)
    try {
      console.log(`🎨 Gerando empresa com ${personasEscolhidas.length} personas...`)
      
      const response = await fetch('/api/generate-strategic-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          companyData: empresaData,
          analise_estrategica: analiseEstrategica,
          personas_escolhidas: personasEscolhidas,
          idiomas_requeridos: idiomasRequeridos
        })
      })

      const result = await response.json()
      console.log('🎉 Empresa criada:', result)
      
      if (result.success) {
        setEmpresaCriada(result)
        setStep(3)
        toast({ title: 'Sucesso!', description: `Empresa criada com ${result.personas_criadas} personas!` })
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Erro na geração' })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao gerar empresa' })
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle persona selection
  const togglePersona = (personaCode: string) => {
    setPersonasEscolhidas(prev => 
      prev.includes(personaCode)
        ? prev.filter(p => p !== personaCode)
        : [...prev, personaCode]
    )
  }

  // Render persona card
  const renderPersonaCard = (personaCode: string, persona: Persona, isEssential: boolean) => {
    const isSelected = personasEscolhidas.includes(personaCode)
    const justificativa = analiseEstrategica?.equipe_recomendada.justificativas[personaCode]
    const prioridade = analiseEstrategica?.equipe_recomendada.prioridades[personaCode]

    return (
      <Card 
        key={personaCode} 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
        }`}
        onClick={() => togglePersona(personaCode)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">{persona.role}</CardTitle>
                  <CardDescription className="text-xs">{persona.specialty}</CardDescription>
                  <Badge variant="outline" className="text-xs w-fit">
                    {persona.department}
                  </Badge>
                </div>
                <Checkbox checked={isSelected} readOnly className="ml-3" />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {isEssential && (
                  <Badge variant="secondary" className="text-xs">
                    Essencial
                  </Badge>
                )}
                {prioridade && (
                  <Badge variant="outline" className="text-xs">
                    {prioridade}/10
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {justificativa && (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">{justificativa}</p>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <NoSSR fallback={
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-500" />
              <span>Carregando Gerador Estratégico...</span>
            </CardTitle>
            <CardDescription>
              Preparando interface para criação de empresas virtuais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span>Gerador Estratégico de Empresas</span>
          </CardTitle>
          <CardDescription>
            Crie empresas virtuais completas com 15 personas padronizadas e análise LLM estratégica
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stepper */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className={`flex items-center ${stepNum < 3 ? 'flex-1' : ''}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
            </div>
            <span className="ml-2 text-sm font-medium">
              {stepNum === 1 && 'Dados da Empresa'}
              {stepNum === 2 && 'Análise Estratégica'}
              {stepNum === 3 && 'Empresa Criada'}
            </span>
            {stepNum < 3 && <div className="flex-1 h-px bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Dados da empresa */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos da Empresa</CardTitle>
            <CardDescription>
              Informações fundamentais para análise estratégica e geração de personas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: TechSolutions Pro"
                  value={empresaData.nome}
                  onChange={(e) => setEmpresaData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Indústria *</Label>
                <Input
                  id="industry"
                  placeholder="Ex: Tecnologia, Consultoria, E-commerce"
                  value={empresaData.industria}
                  onChange={(e) => setEmpresaData(prev => ({ ...prev, industria: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  placeholder="Ex: Brasil, Estados Unidos"
                  value={empresaData.pais}
                  onChange={(e) => setEmpresaData(prev => ({ ...prev, pais: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Breve descrição do negócio e proposta de valor..."
                  value={empresaData.descricao}
                  onChange={(e) => setEmpresaData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="h-20"
                />
              </div>
            </div>

            {/* Seção de Idiomas Requeridos */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Idiomas Requeridos para Funcionários</Label>
                <p className="text-sm text-muted-foreground">
                  Selecione os idiomas que os funcionários desta empresa precisam falar
                </p>
                <IdiomasSelector 
                  idiomasSelecionados={idiomasRequeridos}
                  onChange={setIdiomasRequeridos}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  🆕 Novo Sistema de Geração com OpenAI Disponível!
                </h4>
                <p className="text-sm text-purple-700 mb-2">
                  Agora você pode usar nosso novo sistema que gera estruturas organizacionais com 
                  <strong> cargos 100% específicos</strong> do seu nicho usando OpenAI GPT-4.
                </p>
                <p className="text-xs text-purple-600">
                  💡 O botão abaixo usa o sistema legado. Para o novo sistema, use a página de empresas.
                </p>
              </div>

              <Button 
                onClick={handleAnalyzeCompany}
                disabled={loading || !empresaData.nome || !empresaData.industria}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando estrategicamente...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analisar Estrategicamente (Sistema Legacy)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Análise estratégica */}
      {step === 2 && analiseEstrategica && (
        <div className="space-y-6">
          {/* Proposta de Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-500" />
                <span>Proposta de Valor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Estratégia Principal</h4>
                <p className="text-sm text-muted-foreground">
                  {analiseEstrategica.proposta_valor.estrategia_principal}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Diferenciais Competitivos</h4>
                <div className="flex flex-wrap gap-2">
                  {analiseEstrategica.proposta_valor.diferenciais.map((diff, i) => (
                    <Badge key={i} variant="secondary">{diff}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Foco de Atuação</h4>
                <p className="text-sm text-muted-foreground">
                  {analiseEstrategica.proposta_valor.foco_atuacao}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estratégia SDR */}
          <Card>
            <CardHeader>
              <CardTitle>Estratégia SDR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Segmentos-Alvo</h4>
                <div className="flex flex-wrap gap-2">
                  {analiseEstrategica.estrategia_sdr.segmentos_alvo.map((segmento, i) => (
                    <Badge key={i} variant="outline">{segmento}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Estratégia de Prospecção</h4>
                <p className="text-sm text-muted-foreground">
                  {analiseEstrategica.estrategia_sdr.estrategia_prospeccao}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Personas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span>Equipe Estratégica</span>
                <Badge variant="secondary">{personasEscolhidas.length}/15 selecionadas</Badge>
              </CardTitle>
              <CardDescription>
                Selecione as personas que compõem sua empresa. Personas essenciais já estão pré-selecionadas baseadas na análise estratégica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personas Essenciais */}
                <div>
                  <h4 className="font-medium mb-3 text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Personas Essenciais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analiseEstrategica.equipe_recomendada.essenciais.map(personaCode => (
                      renderPersonaCard(personaCode, estruturaPersonas[personaCode], true)
                    ))}
                  </div>
                </div>

                {/* Personas Opcionais */}
                <div>
                  <h4 className="font-medium mb-3 text-blue-600">Personas Opcionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analiseEstrategica.equipe_recomendada.opcionais.map(personaCode => (
                      renderPersonaCard(personaCode, estruturaPersonas[personaCode], false)
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">
                      {personasEscolhidas.length} personas selecionadas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cada persona terá biografia personalizada gerada por LLM
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateCompany}
                  disabled={loading || !personasEscolhidas.length}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando empresa e biografias...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Gerar Empresa com {personasEscolhidas.length} Personas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Empresa criada */}
      {step === 3 && empresaCriada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Empresa Criada com Sucesso!</span>
            </CardTitle>
            <CardDescription>
              Sua empresa virtual está pronta com personas completas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo da Empresa */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                {empresaData.nome} ({empresaCriada.empresa_codigo})
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Indústria:</span>
                  <span className="ml-2 font-medium">{empresaData.industria}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">País:</span>
                  <span className="ml-2 font-medium">{empresaData.pais}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Personas:</span>
                  <span className="ml-2 font-medium">{empresaCriada.personas_criadas}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <span className="ml-2 font-medium text-xs">{empresaCriada.empresa_id}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="default"
                onClick={() => router.push(empresaCriada.url_empresa)}
                className="flex-1"
              >
                <Building className="w-4 h-4 mr-2" />
                Ver Detalhes da Empresa
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push(empresaCriada.url_personas)}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Personas Criadas
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Criar Nova Empresa */}
            <div className="pt-4 border-t">
              <Button 
                variant="ghost"
                onClick={() => {
                  setStep(1)
                  setEmpresaData({ nome: '', industria: '', pais: 'Brasil', descricao: '' })
                  setIdiomasRequeridos(['Português', 'Inglês'])
                  setAnaliseEstrategica(null)
                  setPersonasEscolhidas([])
                  setEmpresaCriada(null)
                }}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                Criar Nova Empresa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </NoSSR>
  )
}

// 🌍 COMPONENTE DE SELEÇÃO DE IDIOMAS
interface IdiomasSelectorProps {
  idiomasSelecionados: string[]
  onChange: (idiomas: string[]) => void
}

function IdiomasSelector({ idiomasSelecionados, onChange }: IdiomasSelectorProps) {
  const idiomasDisponiveis = [
    'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 
    'Italiano', 'Mandarim', 'Japonês', 'Coreano', 'Árabe', 
    'Russo', 'Hindi', 'Holandês', 'Sueco', 'Norueguês'
  ]

  const toggleIdioma = (idioma: string) => {
    if (idiomasSelecionados.includes(idioma)) {
      onChange(idiomasSelecionados.filter(i => i !== idioma))
    } else {
      onChange([...idiomasSelecionados, idioma])
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {idiomasDisponiveis.map((idioma) => {
          const isSelected = idiomasSelecionados.includes(idioma)
          return (
            <Button
              key={idioma}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleIdioma(idioma)}
              className={`justify-start ${isSelected ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            >
              <CheckCircle className={`w-3 h-3 mr-2 ${isSelected ? 'text-white' : 'text-transparent'}`} />
              {idioma}
            </Button>
          )
        })}
      </div>
      
      {idiomasSelecionados.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Idiomas Selecionados:</Label>
          <div className="flex flex-wrap gap-1">
            {idiomasSelecionados.map((idioma) => (
              <Badge key={idioma} variant="secondary" className="text-xs">
                {idioma}
                <button
                  onClick={() => toggleIdioma(idioma)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}