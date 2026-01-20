'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Activity, CheckCircle, Clock } from 'lucide-react'
import { ExecutionMonitor } from '@/components/ExecutionMonitor'

export default function ToolsPageClean() {
  // Estado simplificado sem dependência externa
  const [empresaSelecionada, setEmpresaSelecionada] = useState({
    id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    nome: 'ARVA Tech Solutions',
    codigo: 'ARVA'
  })

  const scripts = [
    {
      id: 'atribuicoes',
      nome: '01.5 - Atribuições Contextualizadas',
      descricao: 'Gera atribuições específicas para cada cargo via LLM puro',
      apiEndpoint: '/api/generate-atribuicoes',
      status: 'ativo'
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Activity className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de Controle de Execução</h1>
          <p className="text-muted-foreground">Execute scripts com monitoramento em tempo real</p>
        </div>
      </div>

      <Tabs defaultValue="execucao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="execucao">Controle de Execução</TabsTrigger>
          <TabsTrigger value="status">Status do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="execucao" className="space-y-6">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>🎯 Controle de Execução em Tempo Real:</strong> Execute scripts com monitoramento completo de progresso, logs e status.
              Sistema otimizado para o Master Fluxo VCM.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Empresa Selecionada: {empresaSelecionada.nome}</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativa
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Scripts com controle de execução para {empresaSelecionada.nome} (ID: {empresaSelecionada.id})
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {scripts.map((script) => (
                <ExecutionMonitor
                  key={script.id}
                  scriptName={script.nome}
                  apiEndpoint={script.apiEndpoint}
                  onExecutionComplete={() => {
                    console.log(`🎉 Execução do script ${script.nome} concluída!`)
                  }}
                />
              ))}

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">Próximos scripts em desenvolvimento</p>
                  <p className="text-sm text-gray-500 mt-1">
                    02_competencias.js, 03_avatares.js, 04_tech_specs.js, 05_fluxos_sdr.js, 06_rag_knowledge.js
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Online</div>
                <p className="text-xs text-muted-foreground">
                  Servidor operacional
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scripts Disponíveis</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scripts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Com controle de execução
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empresa Ativa</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ARVA</div>
                <p className="text-xs text-muted-foreground">
                  Tech Solutions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Next.js</p>
                  <p className="text-sm text-muted-foreground">14.2.33</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Node.js</p>
                  <p className="text-sm text-muted-foreground">v22.17.0</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">Supabase</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Environment</p>
                  <p className="text-sm text-muted-foreground">Development</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Sistema de controle de execução implementado com monitoramento em tempo real,
                  logs detalhados e interface responsiva. Otimizado para performance com lazy loading
                  e webpack build workers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}