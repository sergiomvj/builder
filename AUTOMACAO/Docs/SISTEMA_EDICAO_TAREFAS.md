# 🎯 Sistema de Edição de Tarefas - Implementado

## 📋 O Que Foi Implementado

### ✅ Funcionalidades Adicionadas

1. **Edição de Tarefas Existentes**
   - Botão "✏️ Editar" em cada tarefa
   - Formulário reutilizado para criar e editar
   - Seleção condicional de personas preservada

2. **Modificação de Atribuições de Personas**
   - Ao editar, checkboxes são marcados com personas já atribuídas
   - Possível adicionar ou remover personas
   - Validação de pelo menos 1 persona selecionada

3. **UI Melhorada**
   - Indicador visual quando em modo edição
   - Botão "Cancelar Edição" para voltar ao modo criação
   - Botão muda de "➕ Criar Tarefa" para "💾 Atualizar Tarefa"
   - Estado desabilitado do botão Editar quando já editando

## 🔄 Fluxo de Edição

```
Usuário clica em "✏️ Editar" na tarefa
    ↓
Formulário é preenchido com dados da tarefa
    ↓
Checkboxes de personas marcadas conforme atribuições
    ↓
Empresa selecionada automaticamente
    ↓
Lista de personas filtrada pela empresa
    ↓
Usuário modifica título, descrição ou personas
    ↓
Clica "💾 Atualizar Tarefa"
    ↓
API PUT /api/tasks atualiza tarefa e assignments
    ↓
Lista de tarefas é atualizada em tempo real
```

## 🎨 Componentes UI Adicionados

### Banner de Edição
```tsx
{editingTask && (
  <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
    <span className="text-blue-600 font-medium">✏️ Editando tarefa</span>
    <span className="text-sm text-gray-600">({editingTask.title})</span>
    <Button onClick={cancelEdit}>Cancelar Edição</Button>
  </div>
)}
```

### Botões de Ação
```tsx
// No card da tarefa
<Button onClick={() => startEditTask(t)} disabled={editingTask?.id === t.id}>
  {editingTask?.id === t.id ? '✏️ Editando...' : '✏️ Editar'}
</Button>
<Button onClick={() => removeTask(t.id)} className="text-red-600">
  🗑️ Remover
</Button>

// No formulário
<Button type="submit">
  {loading ? 'Salvando...' : (editingTask ? '💾 Atualizar Tarefa' : '➕ Criar Tarefa')}
</Button>
{editingTask && (
  <Button type="button" variant="outline" onClick={cancelEdit}>
    Cancelar
  </Button>
)}
```

## 🔧 Funções Implementadas

### `startEditTask(task: Task)`
**Propósito:** Iniciar modo de edição de uma tarefa

```typescript
const startEditTask = (task: Task) => {
  setEditingTask(task);
  setTitle(task.title);
  setDescription(task.description || '');
  setSelectedEmpresa(task.empresa_id || '');
  
  // Carregar personas atribuídas
  if (task.task_persona_assignments) {
    const assignedPersonaIds = task.task_persona_assignments.map(a => a.persona_id);
    setSelectedPersonas(assignedPersonaIds);
  }
  
  // Scroll para o formulário
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

### `cancelEdit()`
**Propósito:** Cancelar edição e voltar ao modo criação

```typescript
const cancelEdit = () => {
  setEditingTask(null);
  setTitle('');
  setDescription('');
  setSelectedPersonas([]);
};
```

### `createTask()` - Modificada
**Propósito:** Criar nova tarefa OU atualizar existente

```typescript
const createTask = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validações ...
  
  if (editingTask) {
    // Atualizar tarefa existente (PUT)
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      body: JSON.stringify({ 
        id: editingTask.id,
        title, 
        description,
        empresa_id: selectedEmpresa,
        persona_ids: selectedPersonas 
      }),
    });
    const updatedTask = await res.json();
    setTasks((s) => s.map(t => t.id === editingTask.id ? updatedTask : t));
    setEditingTask(null);
  } else {
    // Criar nova tarefa (POST)
    // ... código existente ...
  }
};
```

## 🎯 Exemplo de Uso

### Cenário: Editar "Revisão Mensal de Estratégias de Aquisição"

**Estado Inicial:**
```
📋 Revisão Mensal de Estratégias de Aquisição
   Atribuída a: Sarah Johnson (CEO), Michael Johnson (CTO)
   [✏️ Editar] [🗑️ Remover]
```

**Após Clicar em Editar:**
```
┌──────────────────────────────────────────────────┐
│ ✏️ Editando tarefa (Revisão Mensal de Estratégias│
│ de Aquisição)              [Cancelar Edição]    │
└──────────────────────────────────────────────────┘

1. Empresa: ✅ ARVA Tech Solutions (selecionada automaticamente)

2. Dados da Tarefa:
   Título: [Revisão Mensal de Estratégias de Aquisição]
   Descrição: [________________________________]

3. Atribuir a personas:
   ☑️ Sarah Johnson (CEO)
   ☑️ Michael Johnson (CTO)
   ☐ David Brown (SDR Mgr)
   ☐ Robert Davis (Mkt Mgr)
   ... (11 outras)

   ✓ 2 personas selecionadas

[💾 Atualizar Tarefa] [Cancelar]
```

**Modificando Personas:**
Usuário desmarca CEO e marca SDR Mgr:
```
3. Atribuir a personas:
   ☐ Sarah Johnson (CEO)          ← Desmarcado
   ☑️ Michael Johnson (CTO)
   ☑️ David Brown (SDR Mgr)        ← Marcado
   ☐ Robert Davis (Mkt Mgr)
   ...

   ✓ 2 personas selecionadas
```

**Após Atualizar:**
```
📋 Revisão Mensal de Estratégias de Aquisição
   Atribuída a: Michael Johnson (CTO), David Brown (SDR Mgr)
   [✏️ Editar] [🗑️ Remover]
```

## 🔒 Validações

1. **Pelo menos 1 persona:** Não permite atualizar sem personas selecionadas
2. **Título obrigatório:** Campo title não pode estar vazio
3. **Empresa obrigatória:** Deve ter empresa_id selecionada
4. **Desabilitar botão durante edição:** Não pode editar duas tarefas ao mesmo tempo

## 📡 Chamadas API

### Criar Tarefa (POST)
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Nova Tarefa",
  "description": "Descrição",
  "empresa_id": "uuid",
  "persona_ids": ["uuid1", "uuid2"]
}
```

### Atualizar Tarefa (PUT)
```http
PUT /api/tasks
Content-Type: application/json

{
  "id": "uuid-tarefa",
  "title": "Título Atualizado",
  "description": "Nova descrição",
  "empresa_id": "uuid",
  "persona_ids": ["uuid2", "uuid3", "uuid4"]
}
```

**Comportamento da API PUT:**
1. Atualiza campos da tarefa em `personas_tasks`
2. Remove todos os `task_persona_assignments` antigos
3. Cria novos `task_persona_assignments` conforme `persona_ids`
4. Retorna tarefa atualizada com JOINs

## 🧪 Como Testar

### Teste 1: Edição Básica
```bash
# 1. Abra http://localhost:3001/tasks
# 2. Clique em "✏️ Editar" em qualquer tarefa
# 3. Verifique:
✅ Formulário preenchido com dados da tarefa
✅ Banner azul "Editando tarefa" aparece
✅ Botão muda para "💾 Atualizar Tarefa"
✅ Personas corretas estão marcadas
```

### Teste 2: Modificar Personas
```bash
# 1. Edite uma tarefa
# 2. Desmarque 1 persona
# 3. Marque 2 novas personas
# 4. Clique "💾 Atualizar Tarefa"
# 5. Verifique:
✅ Card da tarefa mostra novas personas
✅ Personas antigas removidas
✅ Contagem correta de badges
```

### Teste 3: Cancelar Edição
```bash
# 1. Clique "✏️ Editar" em uma tarefa
# 2. Modifique o título
# 3. Clique "Cancelar Edição" (no banner azul)
# 4. Verifique:
✅ Formulário volta ao estado limpo
✅ Banner azul desaparece
✅ Botão volta para "➕ Criar Tarefa"
✅ Campos vazios
```

### Teste 4: Validações
```bash
# 1. Edite uma tarefa
# 2. Desmarque TODAS as personas
# 3. Tente atualizar
✅ Alert: "Por favor, selecione pelo menos uma persona"
✅ Tarefa não é atualizada
```

## 🎨 Estados Visuais

### Modo Criação (Padrão)
- Formulário vazio
- Sem banner azul
- Botão: "➕ Criar Tarefa"

### Modo Edição
- Formulário preenchido
- Banner azul com nome da tarefa
- Botão: "💾 Atualizar Tarefa"
- Botão "Cancelar" visível
- Botão "✏️ Editar" desabilitado na tarefa sendo editada

### Durante Salvamento
- Botão: "Salvando..."
- Formulário desabilitado
- Loading spinner (opcional)

## 🔄 Atualizações em Tempo Real

O estado da lista de tarefas é atualizado localmente após:
- ✅ Criar nova tarefa → adiciona no início da lista
- ✅ Atualizar tarefa → substitui na mesma posição
- ✅ Remover tarefa → remove da lista

Não é necessário recarregar a página!

## 📝 Notas Importantes

1. **Scroll automático:** Ao editar, página faz scroll suave até o formulário
2. **Empresa bloqueada:** Campo empresa fica desabilitado se houver apenas 1 empresa
3. **Persona filtering:** Personas são filtradas pela empresa selecionada automaticamente
4. **Preservação de dados:** Ao editar, todos os dados originais são carregados

## ✅ Status Final

| Feature | Status | Testes |
|---------|--------|--------|
| Edição de tarefas | ✅ | Pendente |
| Modificar personas | ✅ | Pendente |
| Cancelar edição | ✅ | Pendente |
| Validações | ✅ | Pendente |
| UI responsiva | ✅ | Pendente |
| API PUT funcionando | ✅ | Confirmado |

**Próximo Passo:** Testar no navegador em `http://localhost:3001/tasks`
