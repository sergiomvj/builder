#!/usr/bin/env python3
"""
Debug - Verificar constraints e limitações no banco
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("VCM_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("VCM_SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Variáveis de ambiente SUPABASE não configuradas")
    exit(1)

print("🔍 Conectando ao Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

try:
    # Tentar diretamente pela API
    print("\n🧪 TESTANDO INSERÇÃO COM CÓDIGOS LONGOS:")
    
    test_codes = [
        "TEST8CHAR",      # 9 chars
        "TEST10CHARS",    # 11 chars  
        "VERYLONGCODE123" # 15 chars
    ]
    
    for code in test_codes:
        try:
            print(f"   Testando código: {code} ({len(code)} chars)")
            
            # Tentar inserir
            result = supabase.table('empresas').insert({
                'codigo': code,
                'nome': f'Test{code[:4]}',
                'descricao': f'Teste {code[:4]}',
                'industria': 'teste',
                'pais': 'BR'
            }).execute()
            
            if result.data:
                empresa_id = result.data[0]['id']
                print(f"   ✅ Inserido com sucesso! ID: {empresa_id}")
                
                # Deletar imediatamente
                delete_result = supabase.table('empresas').delete().eq('id', empresa_id).execute()
                print(f"   🗑️ Deletado para limpeza")
            else:
                print(f"   ❌ Falha na inserção: {result}")
                
        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ ERRO: {error_msg}")
            if "character varying(10)" in error_msg:
                print(f"   🎯 ENCONTROU O PROBLEMA! Limitação de 10 caracteres em campo específico")
                print(f"   📍 Código que falhou: {code}")
                
                # Tentar identificar qual campo tem a limitação
                test_fields = {
                    'codigo': code[:10] if len(code) > 10 else code,
                    'nome': f'Test{code[:4]}'[:10],
                    'descricao': f'Teste {code[:4]}'[:10], 
                    'industria': 'teste'[:10],
                    'pais': 'BR'[:10]
                }
                
                print(f"   🔧 Tentando com campos limitados a 10 chars: {test_fields}")
                try:
                    limited_result = supabase.table('empresas').insert(test_fields).execute()
                    if limited_result.data:
                        print("   ✅ FUNCIONOU COM LIMITAÇÃO! O problema é campo específico > 10 chars")
                        # Cleanup
                        supabase.table('empresas').delete().eq('id', limited_result.data[0]['id']).execute()
                    else:
                        print("   ❌ Ainda falhou mesmo com limitação")
                except Exception as e2:
                    print(f"   ❌ Erro mesmo com limitação: {e2}")
                
                break
            else:
                print(f"   ⚠️ Erro diferente (não relacionado a character varying): {error_msg}")

except Exception as e:
    print(f"❌ Erro geral: {e}")
    print(f"Tipo do erro: {type(e)}")