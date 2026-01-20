#!/usr/bin/env node
/**
 * 🎯 SCRIPT 04 - ESPECIFICAÇÕES TÉCNICAS (QUARTA ETAPA)
 * =====================================================
 * 
 * Geração de especificações técnicas detalhadas para sistemas e ferramentas
 * baseada na análise de competências e avatares das personas.
 * REQUER: Scripts 01, 02 e 03 executados com sucesso
 * 
 * Funcionalidades:
 * - Análise de competências e ferramentas das personas
 * - Geração de specs técnicas por categoria de sistema
 * - Mapeamento de requisitos de infraestrutura
 * - Documentação de APIs e integrações necessárias
 * - Output estruturado para implementação
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🎯 SCRIPT 04 - ESPECIFICAÇÕES TÉCNICAS (ETAPA 4/6)');
console.log('================================================');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

// Templates de especificações técnicas por categoria
const techSpecsTemplates = {
  crm_sistemas: {
    categoria: "CRM e Gestão de Relacionamento",
    ferramentas: ["HubSpot", "Salesforce", "Pipedrive", "Zoho CRM"],
    especificacoes: {
      integracao_api: {
        tipo: "REST API",
        autenticacao: "OAuth 2.0 / API Key",
        rate_limits: "1000-5000 requests/hour",
        webhooks: true,
        formatos_dados: ["JSON", "XML"]
      },
      requisitos_sistema: {
        cloud_native: true,
        backup_frequencia: "diário",
        uptime_garantido: "99.9%",
        seguranca: ["SSL/TLS", "2FA", "GDPR Compliance"]
      },
      funcionalidades_core: [
        "Gestão de Contatos",
        "Pipeline de Vendas",
        "Automação de Marketing",
        "Relatórios e Analytics",
        "Integração Email"
      ]
    }
  },
  ferramentas_desenvolvimento: {
    categoria: "Desenvolvimento de Software",
    ferramentas: ["Git", "Docker", "Kubernetes", "CI/CD", "AWS/Azure"],
    especificacoes: {
      infraestrutura: {
        containerizacao: "Docker",
        orquestracao: "Kubernetes",
        cloud_provider: ["AWS", "Azure", "GCP"],
        monitoramento: ["Prometheus", "Grafana", "New Relic"]
      },
      pipeline_ci_cd: {
        versionamento: "Git Flow",
        testes_automatizados: true,
        deploy_strategy: "Blue-Green",
        rollback_capability: true
      },
      seguranca: {
        vulnerability_scanning: true,
        secrets_management: "Vault/AWS Secrets",
        compliance: ["SOC 2", "ISO 27001"],
        access_control: "RBAC"
      }
    }
  },
  analytics_bi: {
    categoria: "Business Intelligence e Analytics",
    ferramentas: ["Power BI", "Tableau", "Looker", "Google Analytics"],
    especificacoes: {
      data_sources: {
        conectores_nativos: ["SQL", "REST API", "CSV", "Excel"],
        real_time_streaming: true,
        batch_processing: true,
        data_warehouse: ["Snowflake", "BigQuery", "Redshift"]
      },
      visualizacao: {
        dashboards_interativos: true,
        mobile_responsivo: true,
        export_formats: ["PDF", "Excel", "PNG"],
        sharing_capabilities: true
      },
      performance: {
        query_optimization: true,
        caching_strategy: "Redis/Memcached",
        load_balancing: true,
        scalability: "Auto-scaling"
      }
    }
  },
  hr_systems: {
    categoria: "Sistemas de Recursos Humanos",
    ferramentas: ["BambooHR", "Workday", "ADP", "SuccessFactors"],
    especificacoes: {
      modulos_core: [
        "Employee Database",
        "Payroll Management",
        "Performance Reviews",
        "Recruiting & Onboarding",
        "Time & Attendance"
      ],
      integracao: {
        hris_sync: true,
        payroll_integration: true,
        benefits_admin: true,
        sso_support: "SAML/OAuth"
      },
      compliance: {
        data_privacy: "GDPR/CCPA",
        audit_trails: true,
        security_certifications: ["SOC 2", "HIPAA"],
        retention_policies: true
      }
    }
  }
};

async function generateTechSpecsForEmpresa(empresa, personasCompetencias) {
  try {
    console.log(`  🔧 Gerando especificações técnicas para: ${empresa.nome}`);
    
    // Consolidar todas as ferramentas e tecnologias das personas
    const todasFerramentas = new Set();
    const categorias = new Set();
    
    personasCompetencias.forEach(pc => {
      if (pc.competencias && pc.ferramentas_tecnologias) {
        const ferramentas = JSON.parse(pc.ferramentas_tecnologias);
        
        [...(ferramentas.especialista || []), 
         ...(ferramentas.intermediario || []), 
         ...(ferramentas.basico || [])].forEach(f => todasFerramentas.add(f));
         
        if (ferramentas.categoria) {
          categorias.add(ferramentas.categoria);
        }
      }
    });

    // Preparar contexto para LLM
    const empresaContext = {
      nome: empresa.nome,
      industria: empresa.industria || empresa.industry,
      tamanho: empresa.total_personas,
      ferramentas_utilizadas: Array.from(todasFerramentas),
      categorias_presentes: Array.from(categorias),
      personas_count: personasCompetencias.length
    };

    // Prompt para análise LLM de especificações técnicas
    const prompt = `
Analise o contexto empresarial e gere especificações técnicas detalhadas:

CONTEXTO DA EMPRESA:
${JSON.stringify(empresaContext, null, 2)}

TEMPLATES DE REFERÊNCIA:
${JSON.stringify(techSpecsTemplates, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO no seguinte formato:

{
  "empresa_info": {
    "nome": "${empresa.nome}",
    "industria": "${empresa.industria || empresa.industry}",
    "perfil_tecnologico": "startup/enterprise/mid-size"
  },
  "arquitetura_recomendada": {
    "stack_principal": {
      "frontend": ["React", "Next.js", "TypeScript"],
      "backend": ["Node.js", "Python", "Java"],
      "database": ["PostgreSQL", "MongoDB", "Redis"],
      "cloud": ["AWS", "Azure", "GCP"]
    },
    "microservices": true,
    "containerizacao": "Docker + Kubernetes",
    "api_gateway": "Kong/AWS API Gateway"
  },
  "especificacoes_por_categoria": {
    "desenvolvimento": {
      "linguagens": ["JavaScript", "TypeScript", "Python"],
      "frameworks": ["React", "Node.js", "Express"],
      "ferramentas": ["Git", "Docker", "VS Code"],
      "requisitos_performance": {
        "response_time": "< 200ms",
        "throughput": "1000 RPS",
        "availability": "99.9%"
      }
    },
    "dados_analytics": {
      "data_warehouse": "Snowflake/BigQuery",
      "etl_tools": ["Airflow", "dbt", "Fivetran"],
      "visualization": ["Power BI", "Tableau"],
      "real_time": "Kafka + Spark Streaming"
    },
    "seguranca": {
      "autenticacao": "OAuth 2.0 + JWT",
      "autorizacao": "RBAC",
      "encryption": "AES-256",
      "compliance": ["GDPR", "SOC 2"]
    }
  },
  "integracao_sistemas": {
    "apis_externas": ["CRM", "ERP", "Payment Gateway"],
    "webhooks": true,
    "event_driven": true,
    "message_queue": "RabbitMQ/AWS SQS"
  },
  "infraestrutura": {
    "hosting": "Cloud Native",
    "cdn": "CloudFlare/AWS CloudFront",
    "monitoring": ["Prometheus", "Grafana", "New Relic"],
    "logging": "ELK Stack",
    "backup_strategy": "3-2-1 Rule"
  },
  "custos_estimados": {
    "setup_inicial": "$10,000 - $50,000",
    "operacional_mensal": "$2,000 - $10,000",
    "escalabilidade": "Linear com uso",
    "roi_esperado": "6-12 meses"
  },
  "roadmap_implementacao": {
    "fase_1": ["Setup básico", "Core features"],
    "fase_2": ["Integrações", "Analytics"],
    "fase_3": ["AI/ML", "Advanced features"],
    "timeline_total": "6-12 meses"
  },
  "riscos_mitigacao": [
    {
      "risco": "Vendor Lock-in",
      "mitigacao": "Multi-cloud strategy"
    },
    {
      "risco": "Data Loss", 
      "mitigacao": "Backup automatizado"
    }
  ]
}

REGRAS IMPORTANTES:
1. Base as especificações nas ferramentas realmente utilizadas pela empresa
2. Considere o tamanho e perfil da empresa (${empresa.total_personas} pessoas)
3. Seja realista nos custos e timelines
4. Priorize escalabilidade e manutenibilidade
5. Inclua considerações de segurança e compliance
6. Responda APENAS com JSON válido, sem texto adicional
`;

    let techSpecsData;
    
    // Tentar Google AI primeiro
    try {
      const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse do JSON retornado
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      techSpecsData = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Especificações técnicas geradas com Google AI');

    } catch (googleError) {
      console.log('    ⚠️ Google AI falhou, tentando OpenAI...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 3000,
        });
        const rawText = completion.choices[0].message.content;
        
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        techSpecsData = JSON.parse(jsonMatch[0]);
        console.log('    ✅ Especificações técnicas geradas com OpenAI');

      } catch (openaiError) {
        console.log('    ❌ Ambos LLMs falharam, usando especificações padrão');
        
        // Fallback baseado no perfil da empresa
        const categoriaEmpresa = categorias.has('tecnologia') ? 'tech_company' : 'traditional_company';
        
        techSpecsData = {
          empresa_info: {
            nome: empresa.nome,
            industria: empresa.industria || empresa.industry,
            perfil_tecnologico: empresa.total_personas > 50 ? 'enterprise' : 'mid-size'
          },
          arquitetura_recomendada: {
            stack_principal: {
              frontend: ["React", "Next.js", "TypeScript"],
              backend: ["Node.js", "Express", "PostgreSQL"],
              database: ["PostgreSQL", "Redis"],
              cloud: ["AWS", "Vercel"]
            },
            microservices: empresa.total_personas > 20,
            containerizacao: "Docker",
            api_gateway: "Nginx"
          },
          especificacoes_por_categoria: Object.keys(techSpecsTemplates).reduce((acc, key) => {
            if (categorias.has(key.split('_')[0])) {
              acc[key] = techSpecsTemplates[key].especificacoes;
            }
            return acc;
          }, {}),
          integracao_sistemas: {
            apis_externas: Array.from(todasFerramentas).slice(0, 5),
            webhooks: true,
            event_driven: false,
            message_queue: "Simple Queue"
          },
          infraestrutura: {
            hosting: "Cloud Shared",
            cdn: "Basic CDN",
            monitoring: ["Basic Metrics"],
            logging: "File-based",
            backup_strategy: "Daily automated"
          },
          custos_estimados: {
            setup_inicial: "$5,000 - $15,000",
            operacional_mensal: "$500 - $3,000",
            escalabilidade: "Manual scaling",
            roi_esperado: "6-8 meses"
          },
          roadmap_implementacao: {
            fase_1: ["MVP", "Core team setup"],
            fase_2: ["Basic integrations", "User training"],
            fase_3: ["Optimization", "Advanced features"],
            timeline_total: "4-8 meses"
          },
          riscos_mitigacao: [
            {
              risco: "Budget overrun",
              mitigacao: "Phased implementation"
            },
            {
              risco: "User adoption",
              mitigacao: "Training and support"
            }
          ]
        };
      }
    }

    return techSpecsData;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar especificações técnicas para ${empresa.nome}:`, error.message);
    return null;
  }
}

async function saveTechSpecsToSupabase(empresa, techSpecsData) {
  try {
    // Preparar dados para inserção na tabela empresas_tech_specs
    const techSpecsRecord = {
      empresa_id: empresa.id,
      arquitetura_recomendada: JSON.stringify(techSpecsData.arquitetura_recomendada),
      especificacoes_por_categoria: JSON.stringify(techSpecsData.especificacoes_por_categoria),
      integracao_sistemas: JSON.stringify(techSpecsData.integracao_sistemas),
      infraestrutura: JSON.stringify(techSpecsData.infraestrutura),
      custos_estimados: JSON.stringify(techSpecsData.custos_estimados),
      roadmap_implementacao: JSON.stringify(techSpecsData.roadmap_implementacao),
      riscos_mitigacao: JSON.stringify(techSpecsData.riscos_mitigacao),
      perfil_tecnologico: techSpecsData.empresa_info.perfil_tecnologico,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Inserir ou atualizar especificações técnicas
    const { error } = await supabase
      .from('empresas_tech_specs')
      .upsert(techSpecsRecord, {
        onConflict: 'empresa_id'
      });

    if (error) {
      console.error(`    ❌ Erro ao salvar especificações técnicas:`, error.message);
      return false;
    }

    console.log(`    ✅ Especificações técnicas salvas para: ${empresa.nome}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao salvar especificações técnicas:`, error.message);
    return false;
  }
}

async function generateTechSpecs() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .gt('total_personas', 0)
        .order('total_personas', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    
    // 2. Marcar script como em execução
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          tech_specs: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Verificar se já existe especificação técnica
    const { data: existingTechSpecs } = await supabase
      .from('empresas_tech_specs')
      .select('*')
      .eq('empresa_id', empresa.id)
      .single();

    if (existingTechSpecs) {
      console.log('\n✅ Empresa já possui especificações técnicas!');
      
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            tech_specs: {
              running: false,
              last_result: 'completed',
              last_run: new Date().toISOString()
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    // 4. Buscar personas com competências para análise
    const { data: personasCompetencias, error: competenciasError } = await supabase
      .from('personas_competencias')
      .select(`
        *,
        personas!inner(empresa_id, full_name, role, specialty)
      `)
      .eq('personas.empresa_id', empresa.id);

    if (competenciasError) throw new Error(`Erro ao buscar competências: ${competenciasError.message}`);

    if (!personasCompetencias.length) {
      console.log('\n⚠️ Nenhuma persona com competências analisadas encontrada!');
      console.log('Execute o Script 02 (Competências) primeiro.');
      return;
    }

    console.log(`\n🔧 Gerando especificações técnicas baseadas em ${personasCompetencias.length} personas...`);

    // 5. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'tech_specs', empresa.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. Gerar especificações técnicas
    const techSpecsData = await generateTechSpecsForEmpresa(empresa, personasCompetencias);
    
    if (techSpecsData) {
      const salvou = await saveTechSpecsToSupabase(empresa, techSpecsData);
      
      if (salvou) {
        // Salvar backup local
        const filename = `tech_specs_${empresa.nome.replace(/\s+/g, '_').toLowerCase()}.json`;
        fs.writeFileSync(
          path.join(outputDir, filename),
          JSON.stringify({
            empresa: {
              id: empresa.id,
              nome: empresa.nome,
              industria: empresa.industria || empresa.industry,
              total_personas: empresa.total_personas
            },
            tech_specs: techSpecsData,
            generated_at: new Date().toISOString(),
            baseado_em_personas: personasCompetencias.length
          }, null, 2),
          'utf8'
        );

        // 7. Atualizar status da empresa
        await supabase
          .from('empresas')
          .update({
            scripts_status: {
              ...empresa.scripts_status,
              tech_specs: {
                running: false,
                last_result: 'success',
                last_run: new Date().toISOString(),
                generated: true
              }
            }
          })
          .eq('id', empresa.id);

        console.log('\n📊 RELATÓRIO DE ESPECIFICAÇÕES TÉCNICAS');
        console.log('=======================================');
        console.log(`✅ Especificações geradas para: ${empresa.nome}`);
        console.log(`🔧 Baseado em competências de: ${personasCompetencias.length} personas`);
        console.log(`🗃️ Dados salvos na tabela: empresas_tech_specs`);
        console.log(`📁 Backup local: ${filename}`);
        console.log('\n🎉 SCRIPT 03 - ESPECIFICAÇÕES TÉCNICAS CONCLUÍDO COM SUCESSO!');
      } else {
        throw new Error('Falha ao salvar especificações técnicas');
      }
    } else {
      throw new Error('Falha ao gerar especificações técnicas');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 03:', error);
    
    // Atualizar status de erro
    if (targetEmpresaId) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa?.scripts_status,
            tech_specs: {
              running: false,
              last_result: 'error',
              last_run: new Date().toISOString(),
              error_message: error.message
            }
          }
        })
        .eq('id', targetEmpresaId);
    }
    
    process.exit(1);
  }
}

generateTechSpecs();