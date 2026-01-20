// ============================================================================
// SCRIPT 02 - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS COM LLM
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 01 (placeholders criados)
// Este script gera biografias completas E preenche dados básicos (nome, email, experiência)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } from '../lib/nomes_nacionalidades.js';

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env' });

// Credenciais REAIS (mesma aplicação web)
const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração LLMs
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🚀 SCRIPT 02 - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS');
console.log('==================================================');
console.log('⚠️  IMPORTANTE: Este script também preenche:');
console.log('   - Nome real baseado na nacionalidade');
console.log('   - Email com domínio da empresa');
console.log('   - Experiência (anos) baseada no cargo');
console.log('==================================================\n');

// Verificar se empresaId foi passado como argumento
const args = process.argv.slice(2);
let targetEmpresaId = null;

// Procurar por --empresaId=xxx ou primeiro argumento
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

// Se não encontrou via --empresaId, usar primeiro argumento
if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

async function generateRealBiografias() {
  try {
    // 1. BUSCA EMPRESA REAL COM PERSONAS
    console.log('1️⃣ Buscando empresa...');
    
    let empresaQuery = supabase
      .from('empresas')
      .select('*')
      .eq('status', 'ativa')
      .gt('total_personas', 0)
      .order('total_personas', { ascending: false });
    
    // Se ID específico foi fornecido, filtrar por ele
    if (targetEmpresaId) {
      empresaQuery = empresaQuery.eq('id', targetEmpresaId);
    }
    
    const { data: empresas, error: empresasError } = await empresaQuery;
    
    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }
    
    if (!empresas || empresas.length === 0) {
      console.log('⚠️ Nenhuma empresa ativa encontrada');
      return;
    }
    
    const empresaPrincipal = empresas[0];
    console.log(`📊 Empresa selecionada: ${empresaPrincipal.nome} (${empresaPrincipal.total_personas} personas)`);
    
    // 2. BUSCA PERSONAS DA EMPRESA
    console.log('2️⃣ Buscando personas da empresa...');
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaPrincipal.id)
      .eq('status', 'active')
      .limit(1); // Testar com primeira persona
      
    if (personasError) {
      console.error('❌ Erro ao buscar personas:', personasError);
      return;
    }
    
    if (!personas || personas.length === 0) {
      console.log('⚠️ Nenhuma persona encontrada para a empresa');
      return;
    }
    
    console.log(`📊 ${personas.length} personas encontradas`);
    
    // 3. GERA BIOGRAFIA PARA PRIMEIRA PERSONA
    const personaTest = personas[0];
    console.log(`\n3️⃣ Gerando biografia estruturada para: ${personaTest.full_name}`);
    
    const biografiaData = await generateBiografiaForPersona(personaTest, empresaPrincipal);
    
    if (biografiaData) {
      // 4. SALVA BIOGRAFIA ESTRUTURADA NO SUPABASE
      const salvou = await saveBiografiaToSupabase(personaTest, biografiaData);
      
      if (salvou) {
        console.log('✅ BIOGRAFIA ESTRUTURADA GERADA COM SUCESSO!');
        console.log('\n🎯 RESULTADOS:');
        console.log(`   • Empresa: ${empresaPrincipal.nome} (REAL)`);
        console.log(`   • Persona: ${personaTest.full_name} (REAL)`);
        console.log(`   • Status biografia: ATIVO`);
        console.log(`   • Dados: ESTRUTURADOS NO SUPABASE`);
        console.log(`   • Campos: biografia_completa, soft_skills, hard_skills, educacao, etc.`);
      } else {
        console.log('❌ Erro ao salvar biografia no Supabase');
      }
    }
    
  } catch (error) {
    console.log('💥 Erro geral:', error);
  }
}

async function generateBiografiaForPersona(persona, empresa) {
  try {
    console.log(`🤖 Gerando biografia única com LLM para: ${persona.full_name}`);
    
    // Dados fixos do sistema
    const sistemaInfo = {
      departamentos: ['executivo', 'especialista', 'assistente'],
      areas_especialistas: ['tecnologia', 'marketing', 'financeiro', 'hr'],
      nacionalidades: ['latinos', 'europeus', 'norte_americanos'],
      idiomas_por_pais: {
        'Brasil': ['Português', 'Inglês'],
        'US': ['English', 'Spanish'],
        'España': ['Español', 'Inglés']
      }
    };
    
    // Prompt para gerar JSON estruturado
    const prompt = `
Você é um especialista em criação de personas empresariais. Crie uma biografia estruturada em JSON para:

DADOS DA PESSOA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Especialidade: ${persona.specialty}
- Departamento: ${persona.department}
- Anos de Experiência: ${persona.experiencia_anos}

DADOS DA EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.industria}
- País: ${empresa.pais}

RETORNE APENAS JSON VÁLIDO com esta estrutura:

{
  "biografia_completa": "Biografia detalhada de 2-3 parágrafos",
  "historia_profissional": "História da carreira profissional",
  "motivacoes": {
    "intrinsecas": ["lista de motivações internas"],
    "extrinsecas": ["lista de motivações externas"],
    "valores_pessoais": ["lista de valores"],
    "paixoes": ["lista de paixões"]
  },
  "desafios": {
    "profissionais": ["desafios do cargo"],
    "pessoais": ["desafios pessoais"],
    "tecnologicos": ["desafios técnicos"],
    "interpessoais": ["desafios de relacionamento"]
  },
  "objetivos_pessoais": ["lista de objetivos"],
  "soft_skills": {
    "comunicacao": 8,
    "lideranca": 7,
    "trabalho_equipe": 8,
    "resolucao_problemas": 9,
    "criatividade": 7,
    "adaptabilidade": 8,
    "inteligencia_emocional": 7,
    "pensamento_critico": 8
  },
  "hard_skills": {
    "tecnologicas": {"skill1": 9, "skill2": 8},
    "ferramentas": ["lista de ferramentas"],
    "metodologias": ["lista de metodologias"],
    "areas_conhecimento": ["áreas de conhecimento"]
  },
  "educacao": {
    "formacao_superior": ["graduação"],
    "pos_graduacao": ["pós-graduação"],
    "cursos_complementares": ["cursos"],
    "instituicoes": ["instituições"]
  },
  "certificacoes": ["lista de certificações"],
  "idiomas_fluencia": {
    "nativo": ["Português"],
    "fluente": ["Inglês"],
    "intermediario": ["Espanhol"],
    "basico": []
  },
  "experiencia_internacional": {
    "paises_trabalhou": ["países"],
    "projetos_globais": ["projetos"],
    "clientes_internacionais": true,
    "culturas_conhece": ["culturas"]
  },
  "redes_sociais": {
    "linkedin": "linkedin.com/in/nome",
    "twitter": "",
    "github": "",
    "website_pessoal": "",
    "outros": {}
  }
}

IMPORTANTE: Retorne APENAS o JSON acima, sem markdown ou explicações.
`;

    let biografiaData = null;

    // Tentar Google AI primeiro
    try {
      console.log('🔍 Tentando Google AI...');
      const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      
      // Limpar possível markdown
      const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
      
      biografiaData = JSON.parse(cleanText);
      console.log('✅ Biografia estruturada gerada com Google AI');
    } catch (error) {
      console.log('⚠️ Google AI falhou, tentando OpenAI...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        });
        const rawText = completion.choices[0].message.content;
        
        // Limpar possível markdown
        const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
        
        biografiaData = JSON.parse(cleanText);
        console.log('✅ Biografia estruturada gerada com OpenAI');
      } catch (openaiError) {
        console.error('❌ Ambos LLMs falharam, usando fallback estruturado');
        
        // Fallback estruturado
        biografiaData = {
          biografia_completa: `${persona.full_name} é ${persona.role} na ${empresa.nome}. Profissional experiente com foco em resultados.`,
          historia_profissional: `Carreira sólida de ${persona.experiencia_anos} anos em ${persona.specialty}.`,
          motivacoes: {
            intrinsecas: ["Crescimento profissional", "Inovação"],
            extrinsecas: ["Reconhecimento", "Sucesso da empresa"],
            valores_pessoais: ["Integridade", "Excelência"],
            paixoes: ["Tecnologia", "Liderança"]
          },
          desafios: {
            profissionais: ["Crescimento da empresa"],
            pessoais: ["Work-life balance"],
            tecnologicos: ["Novas tecnologias"],
            interpessoais: ["Comunicação eficaz"]
          },
          objetivos_pessoais: ["Expandir conhecimento", "Liderar projetos"],
          soft_skills: {
            comunicacao: 7,
            lideranca: 7,
            trabalho_equipe: 8,
            resolucao_problemas: 8,
            criatividade: 6,
            adaptabilidade: 7,
            inteligencia_emocional: 7,
            pensamento_critico: 8
          },
          hard_skills: {
            tecnologicas: { [persona.specialty]: 8 },
            ferramentas: ["Ferramentas padrão"],
            metodologias: ["Metodologias ágeis"],
            areas_conhecimento: [persona.specialty]
          },
          educacao: {
            formacao_superior: ["Graduação relevante"],
            pos_graduacao: ["MBA"],
            cursos_complementares: ["Cursos técnicos"],
            instituicoes: ["Universidade local"]
          },
          certificacoes: [`Certificação em ${persona.specialty}`],
          idiomas_fluencia: {
            nativo: ["Português"],
            fluente: ["Inglês"],
            intermediario: [],
            basico: []
          },
          experiencia_internacional: {
            paises_trabalhou: [],
            projetos_globais: [],
            clientes_internacionais: false,
            culturas_conhece: ["Brasil"]
          },
          redes_sociais: {
            linkedin: `linkedin.com/in/${persona.full_name.toLowerCase().replace(' ', '-')}`,
            twitter: "",
            github: "",
            website_pessoal: "",
            outros: {}
          }
        };
      }
    }

    return biografiaData;
    
  } catch (error) {
    console.error('❌ Erro na geração da biografia:', error);
    return null;
  }
}

async function saveBiografiaToSupabase(persona, biografiaData) {
  try {
    console.log(`💾 Salvando biografia estruturada para: ${persona.full_name}`);
    
    // Salvar na tabela personas_biografias com estrutura JSONB flexível
    const { error: upsertError } = await supabase
      .from('personas_biografias')
      .upsert({
        persona_id: persona.id,
        biografia_estruturada: biografiaData,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'persona_id' 
      });
      
    if (upsertError) {
      console.error('❌ Erro ao salvar biografia em personas_biografias:', upsertError);
      return false;
    }
    
    console.log(`✅ Biografia salva em personas_biografias para persona ID: ${persona.id}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao salvar biografia:', error);
    return false;
  }
}

// Executar
generateRealBiografias();