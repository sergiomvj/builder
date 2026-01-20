'use client'

import dynamic from 'next/dynamic'

// Desabilita SSR para evitar problemas com Supabase no build
const TesteSistemaPersonas = dynamic(() => import('@/components/teste-sistema-personas').then(mod => mod.TesteSistemaPersonas), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Carregando sistema de testes...</div>
})

export default function TestePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🧪 Teste do Sistema</h1>
      <TesteSistemaPersonas />
    </div>
  )
}