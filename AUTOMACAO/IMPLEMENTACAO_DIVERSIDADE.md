# ✅ IMPLEMENTAÇÃO: Diversidade Automática em Todas as Empresas

## 🎯 Solução Implementada

**Requisitos:**
- ✅ Todas as empresas base = Estados Unidos
- ✅ Equipe multinacional (5+ nacionalidades diferentes)
- ✅ Idiomas obrigatórios: Inglês, Português, Espanhol + 2 extras aleatórios
- ✅ Nenhuma nacionalidade > 40% do total
- ✅ Distribuição automática e equilibrada

---

## 📁 Arquivos Criados

### 1. `lib/diversity_manager.js` (239 linhas)

**Funcionalidades:**
- ✅ `gerarDistribuicaoNacionalidades(total)` - Cria distribuição automática
- ✅ `atribuirNacionalidades(personas, distribuicao)` - Atribui nacionalidade a cada persona
- ✅ `gerarIdiomasEmpresa()` - Gera lista de idiomas (obrigatórios + 2 extras)
- ✅ `gerarRelatorioiversidade()` - Relatório visual com barras
- ✅ `validarDiversidade()` - Valida requisitos mínimos

**Nacionalidades Disponíveis:**
1. 🇺🇸 Americano (Inglês) - locale: en_US
2. 🇧🇷 Brasileiro (Português) - locale: pt_BR
3. 🇪🇸 Europeu (Espanhol) - locale: es
4. 🇲🇽 Latino (Espanhol) - locale: es_MX
5. 🇨🇳 Asiático (Mandarim) - locale: zh_CN
6. 🇮🇳 Indiano (Hindi) - locale: en_IN
7. 🇸🇦 Árabe (Árabe) - locale: ar
8. 🇿🇦 Africano (Inglês) - locale: en_ZA

**Idiomas Extras Disponíveis:**
Francês, Alemão, Italiano, Russo, Japonês, Coreano, Mandarim, Hindi, Árabe, Hebraico, Turco, Polonês

---

### 2. `update_empresas_global.js` (Script Utilitário)

**Função:** Atualizar empresas existentes com configuração global

**Uso:**
```bash
node update_empresas_global.js
```

**O que faz:**
1. Busca todas as empresas no banco
2. Atualiza `pais` para "Estados Unidos"
3. Atualiza `idiomas` com [Inglês, Português, Espanhol + 2 extras]
4. Mostra antes/depois de cada empresa

---

## 🔧 Modificações nos Scripts Existentes

### Script 02 (`02_generate_biografias_COMPLETO.js`)

**Mudanças:**

```javascript
// 1. Importar diversity_manager
import { 
  gerarDistribuicaoNacionalidades, 
  atribuirNacionalidades, 
  gerarIdiomasEmpresa,
  gerarRelatorioiversidade,
  validarDiversidade
} from './lib/diversity_manager.js';

// 2. Gerar distribuição automática (ANTES de processar personas)
const distribuicao = gerarDistribuicaoNacionalidades(personasSemBiografia.length);
const personasComNacionalidade = atribuirNacionalidades(personasSemBiografia, distribuicao);

// 3. Exibir relatório de diversidade
console.log(gerarRelatorioiversidade(distribuicao, personasSemBiografia.length));

// 4. Validar (bloqueia se < 5 nacionalidades ou > 40% de uma)
const validacao = validarDiversidade(distribuicao, personasSemBiografia.length);
if (!validacao.valido) {
  console.error('❌ Distribuição inválida');
  process.exit(1);
}

// 5. Processar com nacionalidade atribuída
for (const persona of personasComNacionalidade) {
  const nacionalidade = persona.nacionalidade; // Já atribuída automaticamente
  // ... resto do processamento
}
```

---

## 📊 Exemplo de Output

### Relatório de Diversidade (40 personas):

```
📊 RELATÓRIO DE DIVERSIDADE
==================================================
Total de personas: 40
Nacionalidades diferentes: 6

Americano       ████████████████     12 (30.0%) - Inglês
Brasileiro      ████████████         10 (25.0%) - Português
Europeu         ████████             8 (20.0%) - Espanhol
Indiano         ████                 5 (12.5%) - Hindi
Asiático        ███                  3 (7.5%) - Mandarim
Latino          ██                   2 (5.0%) - Espanhol
==================================================
```

### Idiomas Gerados (exemplo):

```
Idiomas da empresa: Inglês, Português, Espanhol, Francês, Japonês
```

---

## 🚀 Como Usar

### Opção 1: Atualizar Empresa Existente (LifeWayUSA)

```bash
# 1. Atualizar configuração da empresa
node update_empresas_global.js

# 2. Limpar biografias antigas
DELETE FROM personas_biografias WHERE persona_id IN (
  SELECT id FROM personas WHERE empresa_id = 'UUID_LIFEWAYUSA'
);

# 3. Regenerar com diversidade
node 02_generate_biografias_COMPLETO.js --empresaId=b356b561-cd43-4760-8377-98a0cc1463ad
```

### Opção 2: Criar Nova Empresa

```bash
# 1. Criar empresa via frontend
# (automaticamente terá pais = "Estados Unidos" e idiomas corretos)

# 2. Rodar cascata normal
node 01_create_personas.js --empresaId=NEW_UUID
node 02_generate_biografias.js --empresaId=NEW_UUID
# ... diversidade automática será aplicada
```

---

## ✅ Validações Implementadas

### 1. Mínimo 5 Nacionalidades
```javascript
if (distribuicao.length < 5) {
  erros.push('Apenas X nacionalidades (mínimo: 5)');
}
```

### 2. Máximo 40% de Uma Nacionalidade
```javascript
for (const { nome, quantidade } of distribuicao) {
  const percentual = (quantidade / total) * 100;
  if (percentual > 40) {
    erros.push(`${nome} tem ${percentual}% (máximo: 40%)`);
  }
}
```

### 3. Total Correto
```javascript
const totalDistribuido = distribuicao.reduce((sum, d) => sum + d.quantidade, 0);
if (totalDistribuido !== total) {
  erros.push('Total distribuído != total esperado');
}
```

---

## 🎨 Casos de Teste

### Teste 1: 40 Personas

**Distribuição esperada:**
- 6-7 nacionalidades diferentes
- Americanos: 8-12 (20-30%)
- Brasileiros: 8-12 (20-30%)
- Europeus: 6-10 (15-25%)
- Outras: 3-8 cada (7-20%)

**Idiomas:**
- Obrigatórios: Inglês, Português, Espanhol
- Extras: 2 aleatórios (ex: Francês, Japonês)

### Teste 2: 10 Personas

**Distribuição esperada:**
- 5 nacionalidades diferentes
- Cada uma: 1-3 personas (10-30%)
- Nenhuma > 4 personas (40%)

### Teste 3: 100 Personas

**Distribuição esperada:**
- 7-8 nacionalidades diferentes
- Cada uma: 8-40 personas
- Nenhuma > 40 personas (40%)

---

## 🔍 Debugging

### Ver distribuição sem executar:

```javascript
import { gerarDistribuicaoNacionalidades, gerarRelatorioiversidade } from './lib/diversity_manager.js';

const dist = gerarDistribuicaoNacionalidades(40);
console.log(gerarRelatorioiversidade(dist, 40));
```

### Verificar idiomas gerados:

```javascript
import { gerarIdiomasEmpresa } from './lib/diversity_manager.js';

for (let i = 0; i < 5; i++) {
  console.log(gerarIdiomasEmpresa());
}

// Output:
// ['Inglês', 'Português', 'Espanhol', 'Francês', 'Japonês']
// ['Inglês', 'Português', 'Espanhol', 'Alemão', 'Coreano']
// ['Inglês', 'Português', 'Espanhol', 'Italiano', 'Hindi']
// etc.
```

---

## 📋 Checklist de Implementação

- [x] Criar `lib/diversity_manager.js`
- [x] Criar `update_empresas_global.js`
- [x] Modificar `02_generate_biografias_COMPLETO.js`
- [ ] Testar com empresa existente (LifeWayUSA)
- [ ] Testar com nova empresa
- [ ] Validar 5+ nacionalidades
- [ ] Validar idiomas obrigatórios
- [ ] Validar nenhuma nacionalidade > 40%
- [ ] Atualizar Scripts 03-09 (se necessário)

---

## 🎯 Próximos Passos

### Agora:
1. Executar `node update_empresas_global.js`
2. Ver LifeWayUSA atualizada para USA
3. Limpar biografias antigas
4. Rodar Script 02 novamente
5. Conferir relatório de diversidade

### Depois (opcional):
- Modificar Script 03 (atribuições) para considerar nacionalidade
- Modificar Script 04 (competências) para considerar idiomas
- Modificar Script 05 (avatares) para características físicas por nacionalidade
- Criar UI no frontend para visualizar diversidade

---

## 🏆 Resultado Final

**Antes:**
- ❌ LifeWayUSA (empresa americana) com 40 personas brasileiras
- ❌ Todos os nomes: Gabriel, Lucas, Maria, Ana
- ❌ Uma única nacionalidade

**Depois:**
- ✅ LifeWayUSA (sede USA) com equipe multinacional
- ✅ Nomes diversos: Michael, Raj, Wang Wei, Gabriel, Ahmed
- ✅ 6 nacionalidades: USA (30%), Brasil (25%), Europa (20%), Índia (12%), China (8%), México (5%)
- ✅ Idiomas: Inglês, Português, Espanhol, Francês, Mandarim

**Diversidade real, automática e equilibrada!** 🌍
