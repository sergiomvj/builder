'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_VCM_SUPABASE_URL)!
const supabaseKey =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_VCM_SUPABASE_ANON_KEY)!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Persona {
  id: string
  full_name: string
  role: string
  department: string
  email: string
  specialty?: string
}

interface Competencia {
  id: string
  nome: string
  tipo: string
  persona_id: string
  descricao?: string
}

export function TesteSistemaPersonas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar personas
      const { data: personasData, error: personasError } = await supabase
        .from('personas')
        .select('id, full_name, role, department, email, specialty')
        .order('role')

      if (personasError) {
        throw new Error(`Erro ao carregar personas: ${personasError.message}`)
      }

      // Buscar competências
      const { data: competenciasData, error: competenciasError } = await supabase
        .from('competencias')
        .select('id, nome, tipo, persona_id, descricao')

      if (competenciasError) {
        throw new Error(`Erro ao carregar competências: ${competenciasError.message}`)
      }

      setPersonas(personasData || [])
      setCompetencias(competenciasData || [])

      // Testes
      await executarTestes(personasData || [], competenciasData || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const executarTestes = async (personasData: Persona[], competenciasData: Competencia[]) => {
    const results: any = {}

    // Teste 1: Verificar tipos de personas
    results.temCEO = personasData.some(p => p.role.includes('CEO'))
    results.temHeadVendas = personasData.some(p => p.role.includes('Head de Vendas'))
    results.temCMO = personasData.some(p => p.role.includes('CMO'))
    results.temAssistentes = personasData.some(p => p.role.includes('Assistente'))
    results.temEspecialistas = personasData.some(p => p.role.includes('Especialista'))

    // Teste 2: Contadores
    results.totalPersonas = personasData.length
    results.totalCompetencias = competenciasData.length
    results.competenciasPorPersona = Math.round(competenciasData.length / personasData.length)

    // Teste 3: Departamentos
    const departamentos = Array.from(new Set(personasData.map(p => p.department)))
    results.departamentos = departamentos
    results.totalDepartamentos = departamentos.length

    // Teste 4: Verificar nova estrutura
    try {
      const { data: testNovaEstrutura } = await supabase
        .from('competencias')
        .select('atribuicoes_detalhadas, escopo_sdr_hibrido')
        .limit(1)
      
      results.novaEstrutura = testNovaEstrutura !== null
    } catch {
      results.novaEstrutura = false
    }

    setTestResults(results)
  }

  const getPersonaIcon = (role: string) => {
    if (role.includes('CEO')) return '👑'
    if (role.includes('Head')) return '📊'
    if (role.includes('CMO')) return '📱'
    if (role.includes('Assistente')) return '🤝'
    if (role.includes('Especialista')) return '🎯'
    return '👤'
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'Executivo': return 'bg-purple-100 text-purple-800'
      case 'Comercial': return 'bg-green-100 text-green-800'
      case 'Marketing': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Sistema de Personas Virtuais</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando dados...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Sistema de Personas Virtuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">❌ Erro: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste do Sistema de Personas Virtuais</CardTitle>
          <CardDescription>
            Verificando o estado atual das personas criadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{testResults.totalPersonas}</div>
              <div className="text-sm text-blue-600">Personas</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{testResults.totalCompetencias}</div>
              <div className="text-sm text-green-600">Competências</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{testResults.totalDepartamentos}</div>
              <div className="text-sm text-purple-600">Departamentos</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{testResults.competenciasPorPersona}</div>
              <div className="text-sm text-orange-600">Comp./Persona</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold mb-3">✅ Verificações de Estrutura</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {testResults.temCEO ? '✅' : '❌'} CEO criado
                </div>
                <div className="flex items-center gap-2">
                  {testResults.temHeadVendas ? '✅' : '❌'} Head de Vendas criado
                </div>
                <div className="flex items-center gap-2">
                  {testResults.temCMO ? '✅' : '❌'} CMO criado
                </div>
                <div className="flex items-center gap-2">
                  {testResults.temAssistentes ? '✅' : '❌'} Assistentes criados
                </div>
                <div className="flex items-center gap-2">
                  {testResults.temEspecialistas ? '✅' : '❌'} Especialistas criados
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">🏢 Departamentos</h4>
              <div className="space-y-2">
                {testResults.departamentos?.map((dept: string) => (
                  <Badge key={dept} className={getDepartmentColor(dept)}>
                    {dept}
                  </Badge>
                ))}
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium mb-2">🔧 Nova Estrutura de Atribuições</h5>
                <div className="flex items-center gap-2">
                  {testResults.novaEstrutura ? '✅' : '⚠️'} 
                  {testResults.novaEstrutura ? 'Colunas adicionadas' : 'Aguardando SQL manual'}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={carregarDados} className="mb-4">
            🔄 Recarregar Dados
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>👥 Personas Criadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => {
              const competenciasPersona = competencias.filter(c => c.persona_id === persona.id)
              
              return (
                <Card key={persona.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getPersonaIcon(persona.role)}</span>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{persona.full_name}</CardTitle>
                        <CardDescription>{persona.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className={getDepartmentColor(persona.department)}>
                        {persona.department}
                      </Badge>
                      
                      <div className="text-sm text-gray-600">
                        📧 {persona.email}
                      </div>
                      
                      {persona.specialty && (
                        <div className="text-sm text-gray-600">
                          🎯 {persona.specialty}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        📋 {competenciasPersona.length} competências
                      </div>
                      
                      <div className="space-y-1">
                        {competenciasPersona.slice(0, 3).map(comp => (
                          <Badge key={comp.id} variant="outline" className="text-xs">
                            {comp.nome}
                          </Badge>
                        ))}
                        {competenciasPersona.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{competenciasPersona.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
