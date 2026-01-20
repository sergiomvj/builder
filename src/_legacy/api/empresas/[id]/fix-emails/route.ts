import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Normaliza string removendo acentos
 */
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extrai primeiro e último nome
 */
function extractEmailParts(fullName: string) {
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return {
      firstName: slugify(nameParts[0]),
      lastName: slugify(nameParts[0])
    };
  }
  
  const firstName = slugify(nameParts[0]);
  const lastName = slugify(nameParts[nameParts.length - 1]);
  
  return { firstName, lastName };
}

/**
 * Gera email único
 */
async function generateUniqueEmail(
  fullName: string, 
  dominio: string, 
  empresaId: string, 
  excludeId?: string
): Promise<string> {
  const { firstName, lastName } = extractEmailParts(fullName);
  let email = `${firstName}.${lastName}@${dominio}`;
  let counter = 1;
  
  while (true) {
    const query = supabase
      .from('personas')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('email', email);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code === 'PGRST116') {
      break;
    }
    
    if (!error && data) {
      email = `${firstName}.${lastName}${counter}@${dominio}`;
      counter++;
      
      if (counter > 100) {
        email = `${firstName}.${lastName}.${Date.now()}@${dominio}`;
        break;
      }
    } else {
      break;
    }
  }
  
  return email;
}

/**
 * POST /api/empresas/[id]/fix-emails
 * Corrige emails de todas as personas para usar domínio da empresa
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;

    // 1. Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();
    
    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // 2. Obter domínio
    let dominio = empresa.dominio;
    
    if (!dominio || dominio.trim() === '') {
      dominio = `${slugify(empresa.codigo)}.com`;
      
      // Atualizar empresa
      await supabase
        .from('empresas')
        .update({ dominio })
        .eq('id', empresaId);
    } else {
      dominio = dominio
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .trim();
    }

    // 3. Buscar personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (personasError) {
      return NextResponse.json(
        { error: 'Erro ao buscar personas' },
        { status: 500 }
      );
    }

    if (!personas || personas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma persona para atualizar',
        stats: { total: 0, atualizados: 0, erros: 0, semNome: 0 }
      });
    }

    // 4. Atualizar emails
    let sucessos = 0;
    let erros = 0;
    let semNome = 0;
    const alteracoes: any[] = [];

    for (const persona of personas) {
      if (!persona.full_name || persona.full_name.trim() === '') {
        semNome++;
        continue;
      }

      try {
        const oldEmail = persona.email;
        const newEmail = await generateUniqueEmail(
          persona.full_name,
          dominio,
          empresaId,
          persona.id
        );

        if (oldEmail !== newEmail) {
          const { error: updateError } = await supabase
            .from('personas')
            .update({ email: newEmail })
            .eq('id', persona.id);

          if (updateError) {
            erros++;
            continue;
          }

          alteracoes.push({
            role: persona.role,
            name: persona.full_name,
            oldEmail: oldEmail || null,
            newEmail
          });
        }

        sucessos++;
      } catch (error) {
        erros++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Emails atualizados com sucesso',
      dominio,
      stats: {
        total: personas.length,
        atualizados: sucessos,
        erros,
        semNome,
        alterados: alteracoes.length
      },
      alteracoes
    });

  } catch (error: any) {
    console.error('Erro ao corrigir emails:', error);
    return NextResponse.json(
      { error: 'Erro interno ao corrigir emails', details: error.message },
      { status: 500 }
    );
  }
}
