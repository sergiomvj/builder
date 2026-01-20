'use client';

import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, BookOpen, Users, Database, Zap, Settings, BarChart3, Bot, FileText, Workflow, Shield } from 'lucide-react';

export default function ManualPage() {
  return (
    <>
      <style jsx>{`
        /* Reset e Base */
        .manual-container {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background-color: #ffffff;
        }

        /* Header */
        .header {
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          color: white;
          padding: 2rem 0;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .header .version {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          display: inline-block;
          margin-top: 1rem;
          font-weight: 600;
        }

        /* Navigation */
        .nav-bar {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links a {
          color: #1e293b;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: #2563eb;
        }

        .back-button {
          background: #2563eb;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
        }

        .back-button:hover {
          background: #1d4ed8;
        }

        /* Main Content */
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
        }

        /* Sidebar */
        .sidebar {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 80px;
        }

        .sidebar h3 {
          color: #2563eb;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar li {
          margin-bottom: 0.5rem;
        }

        .sidebar a {
          color: #64748b;
          text-decoration: none;
          display: block;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .sidebar a:hover {
          background: white;
          color: #2563eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Content */
        .content {
          min-height: 100vh;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .section h2 {
          color: #2563eb;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
        }

        .section h3 {
          color: #1e293b;
          margin: 1.5rem 0 0.75rem 0;
          font-size: 1.25rem;
        }

        .section h4 {
          color: #475569;
          margin: 1rem 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 1.5rem 0;
        }

        .feature-card {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .feature-card .icon {
          color: #2563eb;
          margin-bottom: 1rem;
        }

        .feature-card h4 {
          margin-bottom: 0.5rem;
          color: #1e293b;
        }

        .feature-card p {
          color: #64748b;
          font-size: 0.9rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #22c55e;
          color: #166534;
        }

        .alert-warning {
          background: #fffbeb;
          border: 1px solid #f59e0b;
          color: #92400e;
        }

        .alert-info {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          color: #1e40af;
        }

        .code {
          background: #f1f5f9;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
        }

        .step-list {
          counter-reset: step-counter;
        }

        .step-list li {
          counter-increment: step-counter;
          margin-bottom: 0.75rem;
          position: relative;
          padding-left: 2rem;
        }

        .step-list li::before {
          content: counter(step-counter);
          position: absolute;
          left: 0;
          top: 0;
          background: #2563eb;
          color: white;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.8rem;
        }

        .badge {
          background: #22c55e;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        @media (max-width: 768px) {
          .main-container {
            grid-template-columns: 1fr;
            padding: 1rem;
          }
          
          .header h1 {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="manual-container">
        {/* Header */}
        <header className="header">
          <h1>Manual de Instruções VCM</h1>
          <p className="subtitle">Virtual Company Manager - Guia Completo</p>
          <div className="version">Versão 2.0 - Novembro 2024</div>
        </header>

        {/* Navigation */}
        <nav className="nav-bar">
          <div className="nav-container">
            <Link href="/dashboard" className="back-button">
              <ArrowLeft size={16} />
              Voltar ao Dashboard
            </Link>
            
            <ul className="nav-links">
              <li><a href="#introducao">Introdução</a></li>
              <li><a href="#empresas">Empresas</a></li>
              <li><a href="#personas">Personas</a></li>
              <li><a href="#avatares">Avatares</a></li>
              <li><a href="#subsistemas">Subsistemas</a></li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <div className="main-container">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3>
              <BookOpen size={20} />
              Índice
            </h3>
            <ul>
              <li><a href="#introducao">1. Introdução</a></li>
              <li><a href="#empresas">2. Gestão de Empresas</a></li>
              <li><a href="#equipe-diversa">3. Gerador de Equipe Diversa</a></li>
              <li><a href="#personas">4. Sistema de Personas</a></li>
              <li><a href="#avatares">5. Avatares e Imagens</a></li>
              <li><a href="#subsistemas">6. Subsistemas</a></li>
              <li><a href="#automacao">7. Scripts de Automação</a></li>
              <li><a href="#analytics">8. Analytics</a></li>
              <li><a href="#suporte">9. Suporte</a></li>
            </ul>
          </aside>

          {/* Content */}
          <main className="content">
            {/* Introdução */}
            <section id="introducao" className="section">
              <h2>
                <BookOpen size={24} />
                1. Introdução ao VCM
              </h2>
              
              <p>O Virtual Company Manager é uma plataforma completa para criar e gerenciar empresas virtuais com personas realistas, sistemas integrados e workflows automatizados.</p>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="icon">
                    <Users size={40} style={{margin: '0 auto'}} />
                  </div>
                  <h4>Empresas Virtuais</h4>
                  <p>Crie empresas completas com dados realistas</p>
                </div>
                <div className="feature-card">
                  <div className="icon">
                    <Bot size={40} style={{margin: '0 auto'}} />
                  </div>
                  <h4>Personas IA</h4>
                  <p>Funcionários virtuais com personalidades únicas</p>
                </div>
                <div className="feature-card">
                  <div className="icon">
                    <Workflow size={40} style={{margin: '0 auto'}} />
                  </div>
                  <h4>Automação</h4>
                  <p>Workflows e processos automatizados</p>
                </div>
                <div className="feature-card">
                  <div className="icon">
                    <BarChart3 size={40} style={{margin: '0 auto'}} />
                  </div>
                  <h4>Analytics</h4>
                  <p>Métricas e relatórios em tempo real</p>
                </div>
              </div>
            </section>

            {/* Gestão de Empresas */}
            <section id="empresas" className="section">
              <h2>
                <Users size={24} />
                2. Gestão de Empresas
              </h2>

              <h3>🏢 Como Criar Nova Empresa</h3>
              <ol className="step-list">
                <li>Clique no botão "Nova Empresa" no dashboard</li>
                <li>Preencha os dados básicos da empresa</li>
                <li>Configure setor, mercado e localização</li>
                <li>O sistema automaticamente ativa o <strong>Gerador de Equipe Diversa</strong></li>
                <li>Salve a empresa para finalizar</li>
              </ol>

              <div className="alert alert-info">
                <strong>💡 Novidade:</strong> O Gerador de Equipe Diversa foi integrado ao processo de criação de empresas, 
                garantindo que toda nova empresa tenha uma equipe representativa e diversa desde o início.
              </div>
            </section>

            {/* Gerador de Equipe Diversa */}
            <section id="equipe-diversa" className="section">
              <h2>
                <Users size={24} />
                3. Gerador de Equipe Diversa
                <span className="badge">INTEGRADO</span>
              </h2>

              <p>O sistema de geração de equipes foi integrado ao processo de onboarding e criação de empresas, garantindo diversidade real em todas as organizações virtuais.</p>

              <h3>🌍 Características de Diversidade</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <h4>👥 Tipos Corporais</h4>
                  <p>Magro, Atlético, Médio, Sobrepeso, Obeso, Plus Size</p>
                </div>
                <div className="feature-card">
                  <h4>🎂 Faixas Etárias</h4>
                  <p>Jovens (18-30), Adultos (31-50), Maduros (51+)</p>
                </div>
                <div className="feature-card">
                  <h4>🌈 Etnias</h4>
                  <p>Branca, Negra, Parda, Asiática, Indígena</p>
                </div>
                <div className="feature-card">
                  <h4>💼 Cargos</h4>
                  <p>Executivos, Especialistas, Assistentes</p>
                </div>
              </div>

              <h3>🔄 Integração no Processo</h3>
              <div className="alert alert-success">
                <strong>✅ Automático:</strong> Quando você cria uma nova empresa, o sistema automaticamente:
                <ul style={{marginTop: '0.5rem', paddingLeft: '1rem'}}>
                  <li>Gera uma equipe diversa de 8-12 personas</li>
                  <li>Inclui representatividade real de tipos corporais</li>
                  <li>Equilibra gêneros e idades</li>
                  <li>Distribui cargos hierárquicos adequadamente</li>
                </ul>
              </div>

              <h3>⚙️ Como Funciona</h3>
              <ol className="step-list">
                <li><strong>Detecção Automática:</strong> Sistema identifica criação de nova empresa</li>
                <li><strong>Análise do Setor:</strong> Ajusta perfis conforme área de negócio</li>
                <li><strong>Geração Diversa:</strong> Cria personas com características variadas</li>
                <li><strong>Validação:</strong> Garante representatividade em todos os aspectos</li>
                <li><strong>Integração:</strong> Personas são automaticamente associadas à empresa</li>
              </ol>
            </section>

            {/* Sistema de Personas */}
            <section id="personas" className="section">
              <h2>
                <Bot size={24} />
                4. Sistema de Personas
              </h2>

              <div className="alert alert-success">
                <strong>🎯 Personas Realistas:</strong> O sistema gera personas com diversidade real, 
                incluindo pessoas acima do peso, diferentes idades, cores de pele e características físicas variadas.
              </div>

              <h3>👥 Categorias de Personas</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <h4>🏆 Executivos</h4>
                  <p>CEO, CTO, CFO, Head of Sales</p>
                </div>
                <div className="feature-card">
                  <h4>🔧 Especialistas</h4>
                  <p>Desenvolvedores, Designers, Analistas</p>
                </div>
                <div className="feature-card">
                  <h4>🎯 Assistentes</h4>
                  <p>Júniors, Estagiários, Suporte</p>
                </div>
              </div>

              <h3>✨ Funcionalidades</h3>
              <ul>
                <li>Geração automática com IA</li>
                <li>Edição manual de biografias</li>
                <li>Sistema de competências</li>
                <li>Integração com avatares</li>
                <li>Histórico de atividades</li>
              </ul>
            </section>

            {/* Avatares */}
            <section id="avatares" className="section">
              <h2>
                <FileText size={24} />
                5. Sistema de Avatares
                <span className="badge">FINALIZADO</span>
              </h2>

              <p>Sistema completo para criação e gestão de avatares das personas com três interfaces principais:</p>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="icon">
                    <Zap size={32} style={{margin: '0 auto', color: '#2563eb'}} />
                  </div>
                  <h4>Gerador IA</h4>
                  <p>Crie avatares profissionais usando inteligência artificial</p>
                </div>
                <div className="feature-card">
                  <div className="icon">
                    <Database size={32} style={{margin: '0 auto', color: '#22c55e'}} />
                  </div>
                  <h4>Galeria</h4>
                  <p>Visualize e gerencie todos os avatares salvos</p>
                </div>
                <div className="feature-card">
                  <div className="icon">
                    <FileText size={32} style={{margin: '0 auto', color: '#a855f7'}} />
                  </div>
                  <h4>Upload</h4>
                  <p>Faça upload de imagens personalizadas</p>
                </div>
              </div>

              <h3>🚀 Como Usar</h3>
              <ol className="step-list">
                <li>Acesse "Sistema de Avatares" no dashboard</li>
                <li>Escolha entre Gerador IA, Galeria ou Upload</li>
                <li>Para gerar: selecione empresa, personas e template</li>
                <li>Configure estilo e descrição da cena</li>
                <li>Clique em "Gerar Avatar" - será salvo automaticamente</li>
                <li>Gerencie na Galeria: ative/desative conforme necessário</li>
              </ol>
            </section>

            {/* Subsistemas */}
            <section id="subsistemas" className="section">
              <h2>
                <Settings size={24} />
                6. Subsistemas Integrados
              </h2>

              <p>O VCM inclui 12 subsistemas completos para simular uma empresa real:</p>

              <div className="feature-grid">
                <div className="feature-card"><h4>💰 Financial System</h4></div>
                <div className="feature-card"><h4>👥 CRM</h4></div>
                <div className="feature-card"><h4>📧 Email Marketing</h4></div>
                <div className="feature-card"><h4>🏢 HR Management</h4></div>
                <div className="feature-card"><h4>📊 Project Management</h4></div>
                <div className="feature-card"><h4>📈 Business Intelligence</h4></div>
                <div className="feature-card"><h4>🛒 E-commerce</h4></div>
                <div className="feature-card"><h4>🎧 Customer Support</h4></div>
                <div className="feature-card"><h4>🤖 AI Assistant</h4></div>
                <div className="feature-card"><h4>📚 Knowledge Base</h4></div>
                <div className="feature-card"><h4>📱 Social Media</h4></div>
                <div className="feature-card"><h4>📊 Analytics</h4></div>
              </div>
            </section>

            {/* Scripts de Automação */}
            <section id="automacao" className="section">
              <h2>
                <Workflow size={24} />
                7. Scripts de Automação
              </h2>

              <p>O VCM inclui scripts Python para automação completa do processo:</p>

              <h3>🔄 Cascade de 5 Scripts Sequenciais</h3>
              <ol className="step-list">
                <li><span className="code">01_generate_competencias.py</span> - Análise de competências</li>
                <li><span className="code">02_generate_tech_specs.py</span> - Especificações técnicas</li>
                <li><span className="code">03_generate_rag.py</span> - Base de conhecimento RAG</li>
                <li><span className="code">04_generate_fluxos_analise.py</span> - Análise de fluxos</li>
                <li><span className="code">05_generate_workflows_n8n.py</span> - Workflows N8N</li>
              </ol>

              <div className="alert alert-warning">
                <strong>⚠️ Importante:</strong> Execute os scripts sempre em sequência. 
                Cada script depende dos outputs do anterior.
              </div>
            </section>

            {/* Analytics */}
            <section id="analytics" className="section">
              <h2>
                <BarChart3 size={24} />
                8. Analytics e Monitoramento
              </h2>

              <div className="feature-grid">
                <div className="feature-card">
                  <h4>📊 Métricas</h4>
                  <p>Performance das personas, uso dos subsistemas, status das integrações</p>
                </div>
                <div className="feature-card">
                  <h4>🔍 Monitoramento</h4>
                  <p>Health checks automáticos, alerts em tempo real, histórico</p>
                </div>
              </div>
            </section>

            {/* Suporte */}
            <section id="suporte" className="section">
              <h2>
                <Shield size={24} />
                9. Suporte e Troubleshooting
              </h2>

              <h3>🆘 Problemas Comuns</h3>
              <ul>
                <li><strong>Personas não carregam:</strong> Verifique conexão Supabase</li>
                <li><strong>Scripts falham:</strong> Execute em sequência correta</li>
                <li><strong>Avatares não salvam:</strong> Verifique permissões DB</li>
                <li><strong>Equipe não diversa:</strong> Use o gerador integrado no onboarding</li>
              </ul>

              <h3>🔧 Logs e Debug</h3>
              <ul>
                <li>Console do navegador (F12)</li>
                <li>Logs do servidor Next.js</li>
                <li>Arquivos de log em <span className="code">/logs/</span></li>
                <li>Supabase dashboard para DB</li>
              </ul>

              <div className="alert alert-info">
                <strong>📞 Documentação Completa:</strong> Para problemas técnicos ou dúvidas, 
                consulte a documentação na pasta <span className="code">/Docs</span> do projeto.
              </div>
            </section>

            {/* Footer */}
            <section className="section" style={{textAlign: 'center', marginTop: '3rem'}}>
              <h3>Virtual Company Manager - Versão 2.0</h3>
              <p style={{color: '#64748b', marginBottom: '1.5rem'}}>
                Sistema completo para gerenciamento de empresas virtuais com IA
              </p>
              <Link href="/dashboard" className="back-button">
                <ArrowLeft size={16} />
                Voltar ao Dashboard
              </Link>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}