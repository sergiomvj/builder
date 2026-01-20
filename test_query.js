require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async()=>{
  console.log('🔍 Testando query corrigida com JOINs...');
  const {data,error}=await supabase
    .from('personas')
    .select('*,personas_biografias(*),personas_competencias(*),personas_atribuicoes(*)')
    .eq('empresa_id','3c3bee15-b3a4-4442-89e9-5859c06e7575')
    .limit(2);

  if(error){
    console.error('❌ Erro:',error.message);
    return;
  }

  console.log('✅ Query com JOINs funciona!');
  console.log('Personas encontradas:',data?.length||0);

  if(data?.length>0){
    data.forEach((p,i)=>{
      console.log(`[${i+1}] ${p.full_name} - Biografias: ${p.personas_biografias?.length||0}, Competencias: ${p.personas_competencias?.length||0}, Atribuicoes: ${p.personas_atribuicoes?.length||0}`);
    });
  }
})();