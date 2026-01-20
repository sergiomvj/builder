#!/usr/bin/env python3
"""
Verificar a estrutura REAL da tabela empresas no Supabase
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("VCM_SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def check_real_table_structure():
    """Verificar estrutura real da tabela empresas"""
    
    try:
        # Query para verificar a estrutura da coluna pais
        query = """
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'empresas' 
        AND table_schema = 'public'
        AND column_name IN ('codigo', 'nome', 'descricao', 'pais', 'industria', 'status')
        ORDER BY ordinal_position;
        """
        
        print("🔍 Executando query de verificação...")
        
        # Tentar via RPC call ou direct SQL
        # Como não temos RPC, vamos usar um método alternativo
        
        # Criar uma empresa de teste para verificar
        test_data = {
            'codigo': 'TESTSCHEMA',
            'nome': 'Test Schema',
            'descricao': 'Test para verificar schema',
            'industria': 'test',
            'pais': 'BR',
            'idiomas': ['pt'],
            'total_personas': 20,
            'status': 'processando'
        }
        
        print("📊 Testando inserção para verificar constraints...")
        result = supabase.table('empresas').insert(test_data).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print("✅ Inserção básica OK")
            
            # Agora testar campo pais com diferentes tamanhos
            pais_tests = ['BR', 'USA', 'CANADA', 'GERMANY', 'UNITED_KINGDOM', 'VERY_LONG_COUNTRY_NAME']
            
            for pais_test in pais_tests:
                try:
                    print(f"\n🧪 Testando país: '{pais_test}' ({len(pais_test)} chars)")
                    
                    update_result = supabase.table('empresas').update({
                        'pais': pais_test
                    }).eq('id', empresa_id).execute()
                    
                    if update_result.data:
                        print(f"   ✅ OK: '{pais_test}' aceito")
                    else:
                        print(f"   ❌ Falhou: {update_result}")
                        
                except Exception as e:
                    error_msg = str(e)
                    print(f"   ❌ ERRO: {error_msg}")
                    
                    if "character varying(10)" in error_msg:
                        print(f"   🎯 CONFIRMADO: Campo 'pais' limitado a 10 chars!")
                        print(f"   📏 Tamanho que falhou: '{pais_test}' = {len(pais_test)} chars")
                        break
            
            # Cleanup
            supabase.table('empresas').delete().eq('id', empresa_id).execute()
            print("\n🗑️ Cleanup realizado")
            
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")

if __name__ == "__main__":
    print("🔍 VERIFICANDO ESTRUTURA REAL DA TABELA 'empresas'")
    print("🎯 Foco especial no campo 'pais' que está limitado a 10 chars")
    check_real_table_structure()