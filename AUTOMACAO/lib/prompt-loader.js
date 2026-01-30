
import fs from 'fs';
import path from 'path';

/**
 * Carrega prompt do banco de dados (system_config) ou usa fallback
 * @param {SupabaseClient} supabase - Cliente Supabase autenticado
 * @param {string} promptKey - Chave na tabela system_config (ex: 'team_prompt', 'workflow_prompt')
 * @param {string} defaultPrompt - Prompt padrão hardcoded para fallback
 * @returns {Promise<string>} - Conteúdo do prompt
 */
export async function loadPrompt(supabase, promptKey, defaultPrompt) {
    try {
        console.log(`   🔎 [PROMPT] Buscando prompt customizado: '${promptKey}'...`);

        // Buscar no banco
        const { data, error } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', promptKey)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Ignorar erro "not found"
                console.warn(`   ⚠️ [PROMPT] Erro ao buscar no banco: ${error.message}`);
            }
        }

        if (data && data.value && data.value.trim() !== '') {
            let promptContent = data.value;

            // Limpar se foi salvo como string JSON
            if (promptContent.startsWith('"') && promptContent.endsWith('"')) {
                try { promptContent = JSON.parse(promptContent); } catch { }
            }

            console.log(`   ✅ [PROMPT] Usando prompt customizado do banco (${promptContent.length} chars)`);
            return promptContent;
        }

        console.log(`   ℹ️ [PROMPT] Usando prompt padrão (fallback)`);
    } catch (err) {
        console.warn(`   ⚠️ [PROMPT] Falha inesperada ao carregar prompt: ${err.message}`);
    }

    return defaultPrompt;
}
