# SOLUÇÃO: Diversidade e Localização nas Personas

## 🎯 Problema Identificado

**Situação Atual:**
- Scripts CLI geram apenas nomes brasileiros (hardcoded)
- Frontend chama os mesmos scripts sem passar parâmetros de localização
- Falta de diversidade cultural nas personas geradas

**Exemplo:** LifeWayUSA (empresa americana) recebeu 40 personas com nomes brasileiros

---

## 📋 3 Soluções Propostas

### ✅ Solução 1: Usar `empresa.pais` + `empresa.idiomas` (RECOMENDADA)

**Vantagens:**
- ✅ Dados já existem no banco (`empresas.pais`, `empresas.idiomas`)
- ✅ Não requer mudanças no frontend
- ✅ Funciona tanto via CLI quanto via UI
- ✅ Implementação rápida (~2 horas)

**Como Funciona:**
1. Scripts leem `empresa.pais` e `empresa.idiomas` do banco
2. `lib/locale_mapper.js` mapeia país → locale do Faker
3. Faker gera nomes/dados apropriados para o país
4. Prompts LLM são enriquecidos com contexto cultural

**Arquivos Criados:**
- `✅ AUTOMACAO/lib/locale_mapper.js` (biblioteca de mapeamento)
- `✅ AUTOMACAO/EXEMPLO_LOCALIZACAO.js` (exemplos de uso)

**Exemplo de Uso:**
```javascript
const localeConfig = getLocalizationConfig(empresa);
// empresa.pais = 'Estados Unidos' → locale = 'en_US'

faker.locale = localeConfig.locale;
const name = faker.person.firstName(); // "Michael" (não "Gabriel")
```

**Países Suportados:** 40+ países mapeados (ver `COUNTRY_TO_LOCALE`)

---

### 🔧 Solução 2: Adicionar Parâmetros CLI

**Vantagens:**
- ✅ Controle fino via linha de comando
- ✅ Útil para testes específicos

**Desvantagens:**
- ❌ Requer passagem de parâmetros em cada execução
- ❌ Frontend precisa enviar parâmetros extras
- ❌ Mais complexo de manter

**Implementação:**
```bash
node 02_generate_biografias.js --empresaId=UUID --locale=en_US --cultura=americano
```

---

### 🎨 Solução 3: Interface de Configuração no Frontend

**Vantagens:**
- ✅ UX rica para configurar diversidade
- ✅ Permite mix de nacionalidades (40% USA, 30% Brasil, 30% Índia)
- ✅ Controle granular por persona

**Desvantagens:**
- ❌ Requer desenvolvimento de UI nova
- ❌ Complexidade alta (~2 semanas)
- ❌ Precisa nova tabela: `personas_diversity_config`

**Mockup:**
```
┌────────────────────────────────────────┐
│ Configuração de Diversidade            │
├────────────────────────────────────────┤
│ País Principal: [Estados Unidos ▼]     │
│ Idiomas: [Inglês] [Espanhol] [+]      │
│                                        │
│ Distribuição de Nacionalidades:       │
│ 🇺🇸 USA:     ████████░░ 70%            │
│ 🇧🇷 Brasil:  ███░░░░░░░ 20%            │
│ 🇮🇳 Índia:   ██░░░░░░░░ 10%            │
│                                        │
│ [Aplicar] [Cancelar]                   │
└────────────────────────────────────────┘
```

---

## 🚀 Implementação Recomendada (Solução 1)

### Passo 1: Modificar Scripts Existentes

**Scripts a modificar:**
1. `02_generate_biografias_COMPLETO.js` ✅ PRIORIDADE
2. `03_generate_atribuicoes_contextualizadas.js`
3. `04_generate_competencias_grok.js`
4. `05_generate_avatares_v5.js` ✅ PRIORIDADE
5. `06_analyze_tasks_for_automation.js`
6. `07_generate_n8n_workflows.js`
7. `08_generate_machine_learning.js`
8. `09_generate_auditoria.js`

**Mudanças Necessárias (cada script):**

```javascript
// 1. Importar biblioteca
const { getLocalizationConfig, enrichPromptWithLocalization } = require('./lib/locale_mapper.js');

// 2. Obter config após buscar empresa
const empresa = await supabase.from('empresas').select('*').eq('id', empresaId).single();
const localeConfig = getLocalizationConfig(empresa);

// 3. Configurar Faker
const { faker } = require('@faker-js/faker');
faker.locale = localeConfig.locale;

// 4. Enriquecer prompts LLM
const basePrompt = `Gere biografia para ${persona.role}...`;
const promptFinal = enrichPromptWithLocalization(basePrompt, localeConfig);
const resultado = await generateJSONWithFallback(promptFinal);
```

### Passo 2: Testar com Empresa Multilocale

**Criar empresa teste:**
```sql
INSERT INTO empresas (nome, codigo, pais, idiomas, industria)
VALUES (
  'GlobalTech USA',
  'GLOBALTECH001',
  'Estados Unidos',
  ARRAY['Inglês', 'Espanhol'],
  'Tecnologia'
);
```

**Executar cascata:**
```bash
node 01_create_personas.js --empresaId=UUID
node 02_generate_biografias.js --empresaId=UUID
# Verificar: nomes americanos gerados
```

### Passo 3: Validar Diversidade

**Query de validação:**
```sql
-- Verificar nomes gerados
SELECT full_name, role, empresa_id
FROM personas
WHERE empresa_id = 'UUID'
ORDER BY full_name;

-- Exemplo esperado para USA:
-- Michael Johnson, Sarah Williams, David Brown
-- (não Gabriel Silva, Lucas Santos, etc)
```

---

## 📊 Matriz de Suporte

| País | Locale Faker | Idioma Principal | Formato Nome | Suporte |
|------|-------------|------------------|--------------|---------|
| 🇧🇷 Brasil | pt_BR | Português | Nome Sobrenome1 Sobrenome2 | ✅ Total |
| 🇺🇸 USA | en_US | Inglês | FirstName MiddleName LastName | ✅ Total |
| 🇬🇧 UK | en_GB | Inglês | FirstName LastName | ✅ Total |
| 🇫🇷 França | fr | Francês | Prénom Nom | ✅ Total |
| 🇩🇪 Alemanha | de | Alemão | Vorname Nachname | ✅ Total |
| 🇪🇸 Espanha | es | Espanhol | Nombre Apellido1 Apellido2 | ✅ Total |
| 🇮🇹 Itália | it | Italiano | Nome Cognome | ✅ Total |
| 🇨🇳 China | zh_CN | Chinês | 姓名 | ✅ Total |
| 🇯🇵 Japão | ja | Japonês | 姓名 | ✅ Total |
| 🇮🇳 Índia | en_IN | Inglês/Hindi | First Last | ✅ Total |
| 🇷🇺 Rússia | ru | Russo | Имя Фамилия | ✅ Total |
| 🇲🇽 México | es_MX | Espanhol | Nombre Apellido | ✅ Total |
| 🇦🇺 Austrália | en_AU | Inglês | FirstName LastName | ✅ Total |
| 🇨🇦 Canadá | en_CA | Inglês/Francês | FirstName LastName | ✅ Total |
| 🇦🇷 Argentina | es | Espanhol | Nombre Apellido | ✅ Total |

**Total:** 40+ países suportados

---

## 🎯 Perguntas Respondidas

### 1. Quando eu rodar os scripts via o frontend isso vai se repetir?

**Resposta:** SIM, vai se repetir porque:
- Frontend chama scripts via `/api/automation/route.ts`
- Scripts CLI não recebem parâmetros de localização
- Lógica hardcoded para Brasil

**Após Solução 1:** NÃO vai se repetir porque:
- Scripts lerão `empresa.pais` e `empresa.idiomas` do banco
- Dados já estão no banco quando empresa é criada via frontend
- Localização automática sem mudanças no frontend

### 2. De que forma podemos tratar isso?

**Resposta:** Implementar Solução 1 (usar dados existentes)

**Passo a passo:**
1. ✅ Criar `lib/locale_mapper.js` (FEITO)
2. ⏳ Modificar 8 scripts para usar localização
3. ⏳ Testar com empresa USA/França/China
4. ⏳ Validar nomes gerados

**Tempo estimado:** 2-3 horas de desenvolvimento

---

## 🔄 Próximos Passos Imediatos

### Opção A: Implementar Agora (Recomendado)
1. Modificar Script 02 (biografias) - 30 min
2. Modificar Script 05 (avatares) - 20 min
3. Testar com empresa USA - 10 min
4. Se funcionar, modificar restantes - 1h

### Opção B: Continuar Cascata Atual
1. Terminar Scripts 06-09 com dados brasileiros
2. Depois implementar localização
3. Reprocessar LifeWayUSA com localização correta

### Opção C: Criar Empresa Teste Agora
1. Criar "GlobalTech USA" no frontend
2. Rodar Scripts 01-05 sem modificações (nomes brasileiros)
3. Implementar localização
4. Rodar novamente (nomes americanos)
5. Comparar resultados

---

## 💡 Recomendação Final

**OPÇÃO:** Implementar Solução 1 AGORA (antes de continuar para Script 06)

**Por quê:**
- Scripts 06-09 também geram conteúdo contextual (workflows, automações)
- Melhor ter localização desde o início
- LifeWayUSA é empresa americana, faz sentido ter nomes americanos
- 2-3 horas de trabalho vs meses de dados incorretos

**Você prefere:**
1. ✅ Implementar localização agora (pausar cascata 2h)
2. ⏭️ Continuar Scripts 06-09 e implementar depois
3. 🧪 Criar empresa teste para validar conceito

Qual sua preferência?
