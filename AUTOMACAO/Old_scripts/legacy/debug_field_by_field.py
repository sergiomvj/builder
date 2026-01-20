#!/usr/bin/env python3
"""
Teste específico para identificar qual campo está limitado a 10 chars
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def test_each_field_individually():
    """Testar cada campo individualmente com valores > 10 chars"""
    
    base_data = {
        'codigo': 'TEST1234',  # 8 chars - seguro
        'nome': 'TestCorp',    # 8 chars - seguro  
        'descricao': 'Descricao',  # 9 chars - seguro
        'industria': 'tech',   # 4 chars - seguro
        'pais': 'BR',         # 2 chars - seguro
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'  # 11 chars - pode ser problema!
    }
    
    # Teste 1: Status longo
    print("🧪 TESTE 1 - Status longo")
    test_data_1 = {**base_data, 'status': 'processando_empresa'}  # 19 chars
    try:
        result = supabase.table('empresas').insert(test_data_1).execute()
        if result.data:
            print("   ✅ Status longo OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ Status longo FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: Status limitado a 10 chars!")
    
    # Teste 2: Código longo  
    print("\n🧪 TESTE 2 - Código longo")
    test_data_2 = {**base_data, 'codigo': 'TESTCODEMUITO123'}  # 15 chars
    try:
        result = supabase.table('empresas').insert(test_data_2).execute()
        if result.data:
            print("   ✅ Código longo OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ Código longo FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: Código limitado a 10 chars!")
    
    # Teste 3: Nome longo
    print("\n🧪 TESTE 3 - Nome longo")  
    test_data_3 = {**base_data, 'nome': 'Empresa Com Nome Muito Longo Para Teste'}  # 40 chars
    try:
        result = supabase.table('empresas').insert(test_data_3).execute()
        if result.data:
            print("   ✅ Nome longo OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ Nome longo FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: Nome limitado a 10 chars!")
    
    # Teste 4: Descrição longa
    print("\n🧪 TESTE 4 - Descrição longa")
    test_data_4 = {**base_data, 'descricao': 'Esta é uma descrição muito longa para testar se há limitação específica no campo descrição da tabela empresas'}  # 120 chars
    try:
        result = supabase.table('empresas').insert(test_data_4).execute()
        if result.data:
            print("   ✅ Descrição longa OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ Descrição longa FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: Descrição limitada a 10 chars!")
            
    # Teste 5: Indústria longa
    print("\n🧪 TESTE 5 - Indústria longa")
    test_data_5 = {**base_data, 'industria': 'tecnologia_avancada_e_inovacao'}  # 30 chars
    try:
        result = supabase.table('empresas').insert(test_data_5).execute()
        if result.data:
            print("   ✅ Indústria longa OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ Indústria longa FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: Indústria limitada a 10 chars!")
    
    # Teste 6: País longo
    print("\n🧪 TESTE 6 - País longo")
    test_data_6 = {**base_data, 'pais': 'UNITED_STATES'}  # 13 chars
    try:
        result = supabase.table('empresas').insert(test_data_6).execute()
        if result.data:
            print("   ✅ País longo OK")
            supabase.table('empresas').delete().eq('id', result.data[0]['id']).execute()
    except Exception as e:
        print(f"   ❌ País longo FALHOU: {e}")
        if "character varying(10)" in str(e):
            print("   🎯 CONFIRMADO: País limitado a 10 chars!")

if __name__ == "__main__":
    print("🔍 TESTANDO CADA CAMPO INDIVIDUALMENTE PARA IDENTIFICAR LIMITAÇÃO")
    test_each_field_individually()
    print("\n🎯 Execute este teste e veja qual campo especificamente está causando o erro!")