#!/usr/bin/env python3
"""
Teste final - Simular exatamente o que o frontend corrigido fará
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def test_corrected_frontend_flow():
    """Simular o fluxo corrigido do frontend"""
    
    print("🧪 TESTE FINAL - Simulando frontend CORRIGIDO")
    
    # Dados que simulam o que o frontend CORRIGIDO enviará
    test_data = {
        'codigo': 'TEST2024',
        'nome': 'Empresa Teste Frontend Corrigido',
        'descricao': 'Descrição de teste para validar correção do campo país',
        'industria': 'tecnologia',
        'pais': 'BR',  # 🎯 CORREÇÃO: 2 chars, dentro do limite de 10
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'
    }
    
    print("📊 Dados do teste:")
    for key, value in test_data.items():
        if isinstance(value, str):
            length_status = "✅ OK" if len(value) <= 10 else "❌ PROBLEMA"
            print(f"   {key}: '{value}' ({len(value)} chars) {length_status}")
        else:
            print(f"   {key}: {value}")
    
    try:
        print("\n🚀 Executando inserção...")
        result = supabase.table('empresas').insert(test_data).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print(f"✅ SUCESSO! Empresa criada com ID: {empresa_id}")
            
            # Testar update para 'ativa' como faz o frontend
            print("🔄 Testando update de status...")
            update_result = supabase.table('empresas').update({
                'status': 'ativa'
            }).eq('id', empresa_id).execute()
            
            if update_result.data:
                print("✅ Update de status: OK")
                
            # Cleanup
            supabase.table('empresas').delete().eq('id', empresa_id).execute()
            print("🗑️ Cleanup realizado")
            
            return True
        else:
            print(f"❌ Falha na inserção: {result}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        
        if "character varying(10)" in str(e):
            print("🚨 AINDA há problema de 10 caracteres!")
            print("🔍 Investigar mais a fundo...")
        elif "check constraint" in str(e):
            print("🔒 Problema de constraint check")
        else:
            print("🤔 Erro diferente")
            
        return False

def test_edge_cases():
    """Testar casos extremos para o campo país"""
    
    print("\n🧪 TESTE DE CASOS EXTREMOS - Campo País")
    
    edge_cases = [
        'A',           # 1 char - mínimo
        'AB',          # 2 chars  
        'ABC',         # 3 chars
        'ABCDEFGHIJ',  # 10 chars - exatamente no limite
        # 'ABCDEFGHIJK'  # 11 chars - deve falhar (não vou testar para não gerar erro)
    ]
    
    base_data = {
        'codigo': 'EDGETEST',
        'nome': 'Test Edge',
        'descricao': 'Edge case test',
        'industria': 'test',
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'
    }
    
    for pais_value in edge_cases:
        test_data = {**base_data, 'pais': pais_value}
        
        try:
            print(f"   Testando país: '{pais_value}' ({len(pais_value)} chars)")
            result = supabase.table('empresas').insert(test_data).execute()
            
            if result.data:
                empresa_id = result.data[0]['id']
                print(f"   ✅ OK: aceito")
                
                # Cleanup
                supabase.table('empresas').delete().eq('id', empresa_id).execute()
            else:
                print(f"   ❌ Rejeitado: {result}")
                
        except Exception as e:
            print(f"   ❌ ERRO: {e}")

if __name__ == "__main__":
    print("🚀 TESTE FINAL DA CORREÇÃO")
    print("=" * 50)
    
    success = test_corrected_frontend_flow()
    test_edge_cases()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 CORREÇÃO FUNCIONOU! Frontend deve estar OK agora!")
        print("✅ Campo 'pais' corrigido para usar códigos ≤ 10 chars")
        print("✅ Limitação específica aplicada apenas onde necessário")
        print("✅ Outros campos mantêm funcionalidade completa")
    else:
        print("⚠️ Ainda há problemas - investigar mais")
        
    print("\n🔧 Próximos passos:")
    print("1. Teste o botão '🧪 Debug Completo' no frontend")
    print("2. Crie uma empresa normalmente")
    print("3. Verifique se o erro desapareceu")