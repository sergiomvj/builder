#!/usr/bin/env python3
"""
Script de Teste para o Sistema de Tarefas VCM
Testa toda a funcionalidade do sistema de arbitragem de tarefas
"""

import os
import sys
from pathlib import Path
import json
import uuid
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

class TaskSystemTester:
    def __init__(self):
        """Inicializar o testador do sistema de tarefas"""
        self.connection = None
        self.cursor = None
        
    def connect_database(self):
        """Conectar ao banco de dados Supabase"""
        try:
            # Usar as credenciais do VCM Central
            conn_string = f"postgresql://{os.getenv('VCM_SUPABASE_SERVICE_ROLE_KEY')}@{os.getenv('VCM_SUPABASE_URL').replace('https://', '').replace('http://', '')}:5432/{os.getenv('VCM_SUPABASE_DB_NAME', 'postgres')}"
            
            print("🔌 Conectando ao banco de dados...")
            self.connection = psycopg2.connect(conn_string)
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            print("✅ Conexão estabelecida com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao conectar ao banco: {str(e)}")
            return False
            
    def create_schema(self):
        """Executar o schema de tarefas"""
        try:
            print("📋 Executando schema de tarefas...")
            
            # Ler o arquivo SQL
            schema_path = Path(__file__).parent / "database-schema-tarefas.sql"
            with open(schema_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
                
            # Executar o schema
            self.cursor.execute(sql_content)
            self.connection.commit()
            print("✅ Schema executado com sucesso!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao executar schema: {str(e)}")
            self.connection.rollback()
            return False
            
    def insert_sample_data(self):
        """Inserir dados de exemplo"""
        try:
            print("📝 Inserindo dados de exemplo...")
            
            # Inserir empresa de exemplo
            empresa_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO empresas (id, nome_empresa, criada_em) 
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (empresa_id, "Empresa Teste VCM", datetime.now()))
            
            # Inserir persona de exemplo
            persona_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO personas (id, empresa_id, nome, cargo, criado_em) 
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (persona_id, empresa_id, "João Silva", "CEO", datetime.now()))
            
            # Inserir template de tarefas
            template_id = str(uuid.uuid4())
            template_data = {
                "tasks": [
                    {
                        "title": "Revisar métricas diárias",
                        "description": "Analisar KPIs e métricas de desempenho do dia anterior",
                        "priority": "high",
                        "estimated_duration": 30,
                        "required_subsystems": ["analytics", "bi"],
                        "inputs_from": ["Analytics Manager"],
                        "outputs_to": ["Equipe Executiva"]
                    },
                    {
                        "title": "Reunião de acompanhamento",
                        "description": "Reunião com equipe para alinhamento estratégico",
                        "priority": "medium",
                        "estimated_duration": 60,
                        "required_subsystems": ["email", "calendar"],
                        "inputs_from": ["Toda equipe"],
                        "outputs_to": ["Board de Diretores"]
                    }
                ]
            }
            
            self.cursor.execute("""
                INSERT INTO task_templates (id, position_type, task_type, template_name, template_data, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (template_id, "CEO", "daily", "Tarefas Diárias CEO", json.dumps(template_data), True))
            
            # Inserir template genérico também
            generic_template_id = str(uuid.uuid4())
            generic_template_data = {
                "tasks": [
                    {
                        "title": "Tarefa diária genérica",
                        "description": "Tarefa padrão para qualquer posição",
                        "priority": "medium",
                        "estimated_duration": 45,
                        "required_subsystems": ["email"],
                        "inputs_from": [],
                        "outputs_to": []
                    }
                ]
            }
            
            self.cursor.execute("""
                INSERT INTO task_templates (id, position_type, task_type, template_name, template_data, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (generic_template_id, "Generic", "daily", "Tarefas Diárias Genéricas", json.dumps(generic_template_data), True))
            
            self.connection.commit()
            print("✅ Dados de exemplo inseridos!")
            
            return {
                "empresa_id": empresa_id,
                "persona_id": persona_id,
                "template_id": template_id,
                "generic_template_id": generic_template_id
            }
            
        except Exception as e:
            print(f"❌ Erro ao inserir dados: {str(e)}")
            self.connection.rollback()
            return None
            
    def test_task_arbitration(self, persona_id):
        """Testar a arbitragem de tarefas"""
        try:
            print("🎯 Testando arbitragem de tarefas...")
            
            # Executar função de arbitragem
            self.cursor.execute("SELECT arbitrate_daily_tasks(%s)", (persona_id,))
            result = self.cursor.fetchone()[0]
            
            print(f"📊 Resultado da arbitragem: {result}")
            
            if result.get('success'):
                # Verificar tarefas criadas
                self.cursor.execute("""
                    SELECT task_id, title, description, priority, status
                    FROM persona_tasks 
                    WHERE persona_id = %s
                    ORDER BY created_at DESC
                """, (persona_id,))
                
                tasks = self.cursor.fetchall()
                print(f"✅ {len(tasks)} tarefas criadas com sucesso!")
                
                for task in tasks:
                    print(f"  📋 {task['title']} - {task['priority']} - {task['status']}")
                    
                return True
            else:
                print(f"❌ Falha na arbitragem: {result.get('message')}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar arbitragem: {str(e)}")
            return False
            
    def test_dashboard_view(self):
        """Testar a view do dashboard"""
        try:
            print("📊 Testando view do dashboard...")
            
            self.cursor.execute("SELECT * FROM persona_tasks_dashboard LIMIT 5")
            dashboard_data = self.cursor.fetchall()
            
            print(f"✅ Dashboard view retornou {len(dashboard_data)} registros")
            
            for record in dashboard_data:
                print(f"  📋 {record['title']} - {record['status']} - {record['priority']}")
                
            return True
            
        except Exception as e:
            print(f"❌ Erro ao testar dashboard view: {str(e)}")
            return False
            
    def cleanup_test_data(self):
        """Limpar dados de teste"""
        try:
            print("🧹 Limpando dados de teste...")
            
            self.cursor.execute("DELETE FROM persona_tasks WHERE task_id LIKE 'daily_%'")
            self.cursor.execute("DELETE FROM task_templates WHERE template_name LIKE '%Teste%'")
            self.cursor.execute("DELETE FROM personas WHERE nome = 'João Silva'")
            self.cursor.execute("DELETE FROM empresas WHERE nome_empresa = 'Empresa Teste VCM'")
            
            self.connection.commit()
            print("✅ Dados de teste removidos!")
            
        except Exception as e:
            print(f"❌ Erro ao limpar dados: {str(e)}")
            
    def run_full_test(self):
        """Executar teste completo do sistema"""
        print("🚀 Iniciando teste completo do Sistema de Tarefas VCM")
        print("=" * 60)
        
        # Conectar ao banco
        if not self.connect_database():
            return False
            
        try:
            # Executar schema
            if not self.create_schema():
                return False
                
            # Inserir dados de exemplo
            sample_data = self.insert_sample_data()
            if not sample_data:
                return False
                
            # Testar arbitragem
            if not self.test_task_arbitration(sample_data['persona_id']):
                return False
                
            # Testar dashboard
            if not self.test_dashboard_view():
                return False
                
            print("\n" + "=" * 60)
            print("🎉 TESTE COMPLETO EXECUTADO COM SUCESSO!")
            print("✅ Sistema de Tarefas VCM está funcionando perfeitamente")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro durante o teste: {str(e)}")
            return False
            
        finally:
            # Limpar dados de teste
            self.cleanup_test_data()
            
            # Fechar conexão
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
                
def main():
    """Função principal"""
    tester = TaskSystemTester()
    success = tester.run_full_test()
    
    if success:
        print("\n🏆 Sistema de Tarefas VCM validado com sucesso!")
        print("🎯 Próximos passos:")
        print("  1. Integrar com interface React")
        print("  2. Implementar templates específicos por posição")
        print("  3. Configurar arbitragem automática por schedule")
    else:
        print("\n❌ Teste falhou. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()