'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleExecutionMonitor } from '@/components/SimpleExecutionMonitor'

export default function ToolsPage() {
  const [selectedCompany, setSelectedCompany] = useState<string>('7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')

  const handleExecutionComplete = () => {
    console.log('✅ Execução concluída!')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ferramentas de Automação VCM</h1>
        <Badge className="bg-green-500">Sistema Operacional</Badge>
      </div>

      {/* Company Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleção de Empresa</CardTitle>
          <CardDescription>Escolha a empresa para executar as automações</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7761ddfd-0ecc-4a11-95fd-5ee913a6dd17">
                ARVA Tech Solutions (Teste)
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Execution Monitors */}
      <div className="grid gap-6">
        <SimpleExecutionMonitor
          scriptName="01.5 - Atribuições Contextualizadas"
          apiEndpoint="/api/generate-atribuicoes"
          onExecutionComplete={handleExecutionComplete}
        />
        
        <SimpleExecutionMonitor
          scriptName="02 - Competências Técnicas e Comportamentais"
          apiEndpoint="/api/generate-competencias"
          onExecutionComplete={handleExecutionComplete}
        />
      </div>
    </div>
  )
}