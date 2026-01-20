#!/usr/bin/env python3
"""
Teste para capturar o erro exato do frontend com dados reais
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Usar mesmas credenciais que frontend (ANON KEY)
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def test_realistic_data():
    """Testar com dados realistas que um usuário digitaria"""
    
    realistic_data = [
        {
            'codigo': 'TECH2025',
            'nome': 'TechCorp Solutions',
            'descricao': 'Empresa de tecnologia especializada em soluções inovadoras',
            'industria': 'tecnologia',
            'pais': 'BR',
            'idiomas': ['pt'],
            'total_personas': 20,
            'status': 'processando'
        },
        {
            'codigo': 'FINANC001', 
            'nome': 'Banco Digital Moderno LTDA',
            'descricao': 'Instituição financeira digital com foco em inovação e excelência no atendimento ao cliente',
            'industria': 'financeiro',
            'pais': 'BR', 
            'idiomas': ['pt', 'en'],
            'total_personas': 25,
            'status': 'processando'
        },
        {
            'codigo': 'HEALTHPLUS',
            'nome': 'HealthPlus Medical Services International Corporation',
            'descricao': 'Rede internacional de serviços médicos especializados com atendimento humanizado e tecnologia de ponta',
            'industria': 'saude',
            'pais': 'US',
            'idiomas': ['en', 'pt', 'es'],
            'total_personas': 30,
            'status': 'processando'
        }
    ]
    
    for i, data in enumerate(realistic_data, 1):
        print(f"\n🧪 TESTE {i} - {data['nome']}")
        print(f"   📏 Tamanhos: codigo={len(data['codigo'])}, nome={len(data['nome'])}, desc={len(data['descricao'])}")
        
        try:
            result = supabase.table('empresas').insert(data).execute()
            
            if result.data:
                empresa_id = result.data[0]['id']
                print(f"   ✅ SUCESSO! ID: {empresa_id}")
                
                # Update status como faz o frontend
                update_result = supabase.table('empresas').update({
                    'status': 'ativa'
                }).eq('id', empresa_id).execute()
                
                if update_result.data:
                    print("   ✅ Update status: OK")
                
                # Cleanup
                supabase.table('empresas').delete().eq('id', empresa_id).execute()
                print("   🗑️ Cleanup: OK")
            else:
                print(f"   ❌ Falha na inserção: {result}")
                
        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ ERRO: {error_msg}")
            
            # Análise detalhada do erro
            if "character varying(10)" in error_msg:
                print("   🎯 Confirmado: Limitação de 10 caracteres")
                # Identificar qual campo
                for field, value in data.items():
                    if isinstance(value, str) and len(value) > 10:
                        print(f"   🔍 Campo suspeito: {field} = '{value}' ({len(value)} chars)")
                        
            elif "check constraint" in error_msg:
                print("   🔒 Erro de constraint check")
                if "status" in error_msg:
                    print(f"   📋 Status inválido: '{data['status']}'")
                    
            elif "duplicate key" in error_msg:
                print(f"   🔄 Código duplicado: '{data['codigo']}'")
                
            return False, data, error_msg
    
    return True, None, None

if __name__ == "__main__":
    print("🚀 TESTANDO COM DADOS REALISTAS")
    success, failed_data, error = test_realistic_data()
    
    if success:
        print("\n✅ TODOS OS TESTES PASSARAM!")
        print("🤔 Se backend funciona, problema é específico do frontend JavaScript/React")
    else:
        print(f"\n❌ FALHA IDENTIFICADA:")
        print(f"📊 Dados que falharam: {failed_data}")
        print(f"🔍 Erro: {error}")