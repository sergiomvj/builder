#!/usr/bin/env python3
"""
Debug - Testar com mesmas credenciais que frontend (ANON KEY)
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Usar MESMAS credenciais que o frontend
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")  # <-- ANON KEY como frontend

print(f"🔍 URL: {SUPABASE_URL}")
print(f"🔍 ANON KEY: {SUPABASE_ANON_KEY[:20]}...")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Variáveis de ambiente FRONTEND não configuradas")
    exit(1)

print("🔍 Conectando ao Supabase com ANON KEY (como frontend)...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def test_with_anon_key():
    """Teste usando ANON KEY exatamente como frontend"""
    
    print("\n🧪 TESTE COM ANON KEY - COMO FRONTEND")
    
    # Dados com limitação de 8 chars (nossa solução ultra-radical)
    empresaData = {
        'codigo': 'TEST8CHR',  # 8 chars exatos
        'nome': 'TestComp',    # 8 chars  
        'descricao': 'Teste em',  # 8 chars
        'industria': 'tecnolog',  # 8 chars
        'pais': 'BR',           # 2 chars
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'
    }
    
    print(f"📋 Dados para inserir (8 chars max): {empresaData}")
    
    try:
        # Inserção como frontend faria
        result = supabase.table('empresas').insert(empresaData).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print(f"   ✅ Inserção com ANON KEY funcionou! ID: {empresa_id}")
            
            # Update como frontend faria
            update_result = supabase.table('empresas').update({
                'status': 'ativa'
            }).eq('id', empresa_id).execute()
            
            if update_result.data:
                print("   ✅ Update com ANON KEY funcionou!")
            
            # Cleanup
            delete_result = supabase.table('empresas').delete().eq('id', empresa_id).execute()
            print("   🗑️ Cleanup concluído")
            return True
            
        else:
            print(f"   ❌ Falha na inserção: {result}")
            return False
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ ERRO COM ANON KEY: {error_msg}")
        
        if "character varying(10)" in error_msg:
            print("🎯 CONFIRMADO: Erro de 10 chars COM ANON KEY!")
            print("🔍 Isso explicaria porque Python (SERVICE ROLE) funciona mas frontend (ANON) falha")
        elif "insufficient_privilege" in error_msg or "permission" in error_msg.lower():
            print("🔒 PROBLEMA DE PERMISSÃO: ANON KEY não tem privilégio para operação")
        
        return False

def test_long_fields_anon():
    """Testar campos longos com ANON KEY"""
    
    print("\n🧪 TESTE CAMPOS LONGOS COM ANON KEY")
    
    test_data = {
        'codigo': 'VERYLONGCODE123',     # 15 chars - vai falhar?
        'nome': 'Very Long Company',     # 18 chars  
        'descricao': 'Descrição longa para testar',  # 30 chars
        'industria': 'tecnologia_avancada',  # 17 chars
        'pais': 'BRASIL',  # 6 chars
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando_empresa'  # 19 chars - suspeito!
    }
    
    print(f"📋 Testando campos longos com ANON KEY...")
    
    try:
        result = supabase.table('empresas').insert(test_data).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print(f"✅ Campos longos + ANON KEY = OK! ID: {empresa_id}")
            
            # Cleanup
            supabase.table('empresas').delete().eq('id', empresa_id).execute()
            return True
        else:
            print(f"❌ Falha: {result}")
            return False
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ ERRO: {error_msg}")
        
        if "character varying(10)" in error_msg:
            print("🎯 ANON KEY + CAMPOS LONGOS = ERRO 10 CHARS!")
            print("🔍 Pode haver trigger/RLS específico para ANON users")
            
        return False

if __name__ == "__main__":
    print("🚀 TESTANDO COM ANON KEY (CREDENCIAIS DO FRONTEND)")
    
    # Teste 1: 8 chars (nossa solução)
    success1 = test_with_anon_key()
    
    # Teste 2: Campos longos  
    success2 = test_long_fields_anon()
    
    print(f"\n📊 RESULTADOS COM ANON KEY:")
    print(f"   8 chars max: {'✅ OK' if success1 else '❌ FALHA'}")
    print(f"   Campos longos: {'✅ OK' if success2 else '❌ FALHA'}")
    
    if success1 and not success2:
        print("\n🎯 CONCLUSÃO: Limitação de 10 chars É ESPECÍFICA para ANON KEY!")
        print("   - SERVICE ROLE: Sem limitação")
        print("   - ANON KEY: Limitado a 10 chars em campos específicos")
        print("   - SOLUÇÃO: Manter limitação de 8 chars FUNCIONARÁ!")