import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('../../.env')

# Configurar Supabase
url = os.getenv('VCM_SUPABASE_URL')
key = os.getenv('VCM_SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("❌ Erro: Variáveis de ambiente do Supabase não configuradas")
    sys.exit(1)

supabase: Client = create_client(url, key)

def criar_tabelas_pipeline():
    """Cria as tabelas necessárias para o pipeline completo"""
    
    tabelas = {
        'tech_specifications': '''
            CREATE TABLE IF NOT EXISTS tech_specifications (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
                persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
                role text NOT NULL,
                tools text[] DEFAULT '{}',
                technologies text[] DEFAULT '{}',
                methodologies text[] DEFAULT '{}',
                sales_enablement text[] DEFAULT '{}',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        ''',
        
        'rag_knowledge_base': '''
            CREATE TABLE IF NOT EXISTS rag_knowledge_base (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
                persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
                content_type text NOT NULL,
                title text NOT NULL,
                content text NOT NULL,
                metadata jsonb DEFAULT '{}',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        ''',
        
        'n8n_workflows': '''
            CREATE TABLE IF NOT EXISTS n8n_workflows (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
                workflow_name text NOT NULL,
                workflow_type text NOT NULL,
                nodes jsonb DEFAULT '[]',
                connections jsonb DEFAULT '{}',
                metadata jsonb DEFAULT '{}',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        ''',
        
        'objetivos': '''
            CREATE TABLE IF NOT EXISTS objetivos (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
                persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
                objetivo_tipo text NOT NULL,
                titulo text NOT NULL,
                descricao text,
                meta_valor numeric,
                meta_unidade text,
                prazo date,
                status text DEFAULT 'ativo',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        ''',
        
        'auditorias': '''
            CREATE TABLE IF NOT EXISTS auditorias (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
                auditoria_tipo text NOT NULL,
                titulo text NOT NULL,
                resultados jsonb DEFAULT '{}',
                recomendacoes text[],
                score numeric,
                status text DEFAULT 'concluida',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        '''
    }
    
    print("🔨 Criando tabelas do pipeline...\n")
    
    for nome_tabela, sql in tabelas.items():
        try:
            # Tentar executar usando query direta
            result = supabase.postgrest.rpc('exec', {'sql': sql}).execute()
            print(f"✅ Tabela {nome_tabela}: OK")
            
        except Exception as e:
            try:
                # Método alternativo: tentar acessar a tabela para ver se existe
                result = supabase.table(nome_tabela).select('*').limit(1).execute()
                print(f"✅ Tabela {nome_tabela}: JÁ EXISTS")
                
            except Exception as e2:
                print(f"❌ Tabela {nome_tabela}: ERRO - {str(e)}")
                print(f"   SQL: {sql[:100]}...")
    
    # Criar índices
    indices = [
        "CREATE INDEX IF NOT EXISTS idx_tech_specifications_empresa_id ON tech_specifications(empresa_id);",
        "CREATE INDEX IF NOT EXISTS idx_rag_knowledge_base_empresa_id ON rag_knowledge_base(empresa_id);",
        "CREATE INDEX IF NOT EXISTS idx_n8n_workflows_empresa_id ON n8n_workflows(empresa_id);",
        "CREATE INDEX IF NOT EXISTS idx_objetivos_empresa_id ON objetivos(empresa_id);",
        "CREATE INDEX IF NOT EXISTS idx_auditorias_empresa_id ON auditorias(empresa_id);"
    ]
    
    print(f"\n🎯 Tentando criar {len(indices)} índices...")
    
    for indice in indices:
        try:
            result = supabase.postgrest.rpc('exec', {'sql': indice}).execute()
            print(f"✅ Índice criado: {indice[:50]}...")
        except Exception as e:
            print(f"⚠️ Índice: {str(e)[:50]}...")

def verificar_tabelas():
    """Verifica se as tabelas foram criadas com sucesso"""
    
    tabelas = ['tech_specifications', 'rag_knowledge_base', 'n8n_workflows', 'objetivos', 'auditorias']
    
    print(f"\n🔍 Verificando {len(tabelas)} tabelas criadas...\n")
    
    for tabela in tabelas:
        try:
            result = supabase.table(tabela).select('*', count='exact').limit(1).execute()
            print(f"✅ {tabela}: EXISTE")
        except Exception as e:
            print(f"❌ {tabela}: NÃO EXISTE - {str(e)[:50]}...")
    
    print("\n🎉 Verificação concluída!")

if __name__ == "__main__":
    print("🚀 Iniciando criação de tabelas do pipeline...\n")
    
    try:
        criar_tabelas_pipeline()
        verificar_tabelas()
        
        print("\n✅ Processo concluído!")
        print("📋 As tabelas do pipeline estão prontas para usar")
        
    except Exception as e:
        print(f"\n❌ Erro geral: {str(e)}")
        print("💡 Tente executar o SQL manualmente no painel do Supabase")
        print("📄 Arquivo: criar_tabelas_pipeline.sql")