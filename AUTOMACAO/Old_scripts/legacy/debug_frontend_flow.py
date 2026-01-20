#!/usr/bin/env python3
"""
Debug - Replicar exatamente o processo do frontend
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

def test_exact_frontend_flow():
    """Replicar exatamente o que o frontend faz"""
    
    print("\n🧪 TESTE - REPLICANDO EXATAMENTE O FRONTEND")
    
    # Dados exatos que o frontend está enviando (com limitação de 8 chars)
    empresaData = {
        'codigo': 'TESTELMO',  # 8 chars (usando exatamente como frontend)
        'nome': 'Testelmo',    # 8 chars  
        'descricao': 'Teste l',  # 8 chars
        'industria': 'tecnolo',  # 8 chars
        'pais': 'BR',           # 2 chars
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'
    }
    
    print(f"📋 Dados para inserir: {empresaData}")
    
    try:
        # PASSO 1: Insert inicial (como faz o hook useCreateEmpresa)
        print("1️⃣ Inserindo empresa...")
        result = supabase.table('empresas').insert(empresaData).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print(f"   ✅ Empresa inserida! ID: {empresa_id}")
            
            # PASSO 2: Update de status (como faz o onboarding-wizard)  
            print("2️⃣ Atualizando status para 'ativa'...")
            update_result = supabase.table('empresas').update({
                'status': 'ativa'
            }).eq('id', empresa_id).execute()
            
            if update_result.data:
                print("   ✅ Status atualizado com sucesso!")
            else:
                print(f"   ❌ Falha no update: {update_result}")
            
            # PASSO 3: Cleanup
            print("3️⃣ Limpando dados de teste...")
            delete_result = supabase.table('empresas').delete().eq('id', empresa_id).execute()
            print("   🗑️ Limpeza concluída")
            
            return True
            
        else:
            print(f"   ❌ Falha na inserção: {result}")
            return False
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ ERRO: {error_msg}")
        
        if "character varying(10)" in error_msg:
            print("🎯 ENCONTROU O PROBLEMA! Erro de limitação de 10 caracteres")
            print(f"📍 Dados que causaram o erro: {empresaData}")
            
            # Verificar qual operação específica causou o erro
            if "insert" in error_msg.lower():
                print("🔍 Erro ocorreu durante INSERT")
            elif "update" in error_msg.lower():
                print("🔍 Erro ocorreu durante UPDATE")
            else:
                print("🔍 Erro em operação desconhecida")
                
        return False

def test_with_long_fields():
    """Teste com campos longos para identificar qual está limitado"""
    
    print("\n🧪 TESTE - CAMPOS LONGOS PARA IDENTIFICAR LIMITAÇÃO")
    
    # Cada campo propositalmente longo para identificar qual tem limitação
    test_data = {
        'codigo': 'VERYLONGCODE123',     # 15 chars
        'nome': 'Very Long Company Name',  # 19 chars  
        'descricao': 'Uma descrição muito longa para testar limitações',  # 50 chars
        'industria': 'tecnologia_avancada',  # 17 chars
        'pais': 'BRAZIL',  # 6 chars
        'idiomas': ['pt'],
        'total_personas': 20,
        'status': 'processando'  # 11 chars
    }
    
    print(f"📋 Testando com campos longos...")
    for field, value in test_data.items():
        if isinstance(value, str):
            print(f"   {field}: '{value}' ({len(value)} chars)")
    
    try:
        result = supabase.table('empresas').insert(test_data).execute()
        
        if result.data:
            empresa_id = result.data[0]['id']
            print(f"✅ Inserção com campos longos FUNCIONOU! ID: {empresa_id}")
            
            # Cleanup
            supabase.table('empresas').delete().eq('id', empresa_id).execute()
            print("🗑️ Limpeza concluída")
            return True
        else:
            print(f"❌ Falha: {result}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO com campos longos: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO TESTES DE DEBUG")
    
    # Teste 1: Replicar exatamente o frontend  
    success1 = test_exact_frontend_flow()
    
    # Teste 2: Campos longos
    success2 = test_with_long_fields()
    
    print(f"\n📊 RESULTADOS:")
    print(f"   Frontend Flow: {'✅ OK' if success1 else '❌ FALHA'}")
    print(f"   Campos Longos: {'✅ OK' if success2 else '❌ FALHA'}")
    
    if success1 and success2:
        print("\n🤔 CONCLUSÃO: Problema pode estar em:")
        print("   1. Trigger específico do frontend")
        print("   2. Operação em tabela relacionada") 
        print("   3. Constraint RLS específica")
        print("   4. Configuração do cliente Supabase JS vs Python")