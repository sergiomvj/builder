"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Empresa {
  id: string;
  nome: string;
  razao_social?: string;
  setor?: string;
}

interface Persona {
  id: string;
  full_name: string;
  role?: string;
  email?: string;
  empresa_id: string;
}

interface TaskAssignment {
  id: string;
  persona_id: string;
  status: string;
  assigned_at?: string;
  completed_at?: string;
  personas?: Persona;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  task_type?: string;
  due_date?: string;
  created_at?: string;
  empresa_id?: string;
  task_persona_assignments?: TaskAssignment[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPersonas, setFilterPersonas] = useState<string[]>([]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      console.log('Tasks API response:', data);
      
      // Ensure we always set an array
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data && data.error) {
        console.error('API Error:', data.error);
        setTasks([]);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      console.log('🔍 Buscando personas...');
      const res = await fetch('/api/personas');
      const response = await res.json();
      console.log('📦 Resposta da API personas:', response);
      
      // A API retorna { success, data: [...] }
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        console.log(`✅ ${data.length} persona(s) encontrada(s)`);
        setAllPersonas(data);
      } else {
        console.warn('⚠️ Resposta não é um array:', response);
        setAllPersonas([]);
      }
    } catch (err) {
      console.error('❌ Error fetching personas:', err);
      setAllPersonas([]);
    }
  };

  const fetchEmpresas = async () => {
    try {
      console.log('🔍 Buscando empresas...');
      const res = await fetch('/api/empresas');
      const response = await res.json();
      console.log('📦 Resposta da API empresas:', response);
      
      // A API retorna { success, data: [...] }
      const data = response.data || response;
      
      if (Array.isArray(data)) {
        console.log(`✅ ${data.length} empresa(s) encontrada(s)`);
        setEmpresas(data);
        // Se houver apenas uma empresa, selecionar automaticamente
        if (data.length === 1) {
          console.log(`🎯 Selecionando automaticamente: ${data[0].nome}`);
          setSelectedEmpresa(data[0].id);
        }
      } else if (Array.isArray(response)) {
        console.log(`✅ ${response.length} empresa(s) encontrada(s)`);
        setEmpresas(response);
        if (response.length === 1) {
          console.log(`🎯 Selecionando automaticamente: ${response[0].nome}`);
          setSelectedEmpresa(response[0].id);
        }
      } else {
        console.warn('⚠️ Resposta não é um array:', response);
      }
    } catch (err) {
      console.error('❌ Error fetching empresas:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchPersonas();
    fetchEmpresas();
  }, []);

  // Filtrar personas quando empresa mudar
  useEffect(() => {
    if (selectedEmpresa) {
      const filtered = allPersonas.filter(p => p.empresa_id === selectedEmpresa);
      setFilteredPersonas(filtered);
      
      // Só limpar seleção de personas se NÃO estiver editando
      // Quando editando, as personas já foram definidas por startEditTask
      if (!editingTask) {
        setSelectedPersonas([]);
      }
    } else {
      setFilteredPersonas([]);
      if (!editingTask) {
        setSelectedPersonas([]);
      }
    }
  }, [selectedEmpresa, allPersonas, editingTask]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedEmpresa) {
      alert('Por favor, preencha o título e selecione uma empresa');
      return;
    }
    if (selectedPersonas.length === 0) {
      alert('Por favor, selecione pelo menos uma persona');
      return;
    }
    
    setLoading(true);
    try {
      if (editingTask) {
        // Atualizar tarefa existente
        const res = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        // Criar nova tarefa
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            description,
            empresa_id: selectedEmpresa,
            persona_ids: selectedPersonas 
          }),
        });
        const item = await res.json();
        setTasks((s) => [item, ...s]);
      }
      setTitle('');
      setDescription('');
      setSelectedPersonas([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeTask = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks((s) => s.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePersonaSelection = (personaId: string) => {
    setSelectedPersonas(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const selectAllPersonas = () => {
    setSelectedPersonas(filteredPersonas.map((p: Persona) => p.id));
  };

  const clearPersonaSelection = () => {
    setSelectedPersonas([]);
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setSelectedEmpresa(task.empresa_id || '');
    
    // Carregar personas atribuídas
    if (task.task_persona_assignments) {
      const assignedPersonaIds = task.task_persona_assignments.map(a => a.persona_id);
      setSelectedPersonas(assignedPersonaIds);
    } else {
      setSelectedPersonas([]);
    }
    
    // Scroll para o formulário com delay para garantir renderização
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSelectedPersonas([]);
  };

  const toggleFilterPersona = (personaId: string) => {
    setFilterPersonas(prev => 
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const clearFilters = () => {
    setFilterPersonas([]);
  };

  // Filtrar tarefas baseado nas personas selecionadas no filtro
  const filteredTasks = filterPersonas.length === 0 
    ? tasks 
    : tasks.filter(task => 
        task.task_persona_assignments?.some(assignment => 
          filterPersonas.includes(assignment.persona_id)
        )
      );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Tarefas das Personas</h1>

      <form onSubmit={createTask} className="mb-6 space-y-4 border p-4 rounded-lg bg-gray-50">
        {editingTask && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">✏️ Editando tarefa</span>
              <span className="text-sm text-gray-600">({editingTask.title})</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
              Cancelar Edição
            </Button>
          </div>
        )}
        {/* Seleção de Empresa */}
        <div>
          <label className="block text-sm font-medium mb-2">
            1. Empresa: <span className="text-red-500">*</span>
            {empresas.length === 1 && (
              <span className="ml-2 text-xs text-green-600">(selecionada automaticamente)</span>
            )}
          </label>
          <select
            className="w-full border p-2 rounded bg-white"
            value={selectedEmpresa}
            onChange={(e) => setSelectedEmpresa(e.target.value)}
            required
            disabled={empresas.length === 1}
          >
            {empresas.length === 0 ? (
              <option value="">Carregando empresas...</option>
            ) : empresas.length === 1 ? (
              <option value={empresas[0].id}>
                {empresas[0].nome || empresas[0].razao_social} 
                {empresas[0].industria && ` - ${empresas[0].industria}`}
              </option>
            ) : (
              <>
                <option value="">-- Escolha uma empresa --</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome || empresa.razao_social}
                    {empresa.industria && ` - ${empresa.industria}`}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Campos de Tarefa */}
        <div>
          <label className="block text-sm font-medium mb-2">
            2. Dados da Tarefa: <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <input
              className="border p-2 rounded flex-1"
              placeholder="Título da tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              className="border p-2 rounded w-80"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              3. Atribuir a personas: <span className="text-red-500">*</span>
            </label>
            {filteredPersonas.length > 0 && (
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllPersonas}>
                  ✓ Todas ({filteredPersonas.length})
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearPersonaSelection}>
                  Limpar
                </Button>
              </div>
            )}
          </div>
          
          {!selectedEmpresa ? (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
              ⚠️ Selecione uma empresa primeiro para ver as personas disponíveis
            </p>
          ) : filteredPersonas.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
              Nenhuma persona encontrada para esta empresa. Crie personas primeiro.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-white">
              {filteredPersonas.map((persona: Persona) => (
                <label key={persona.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPersonas.includes(persona.id)}
                    onChange={() => togglePersonaSelection(persona.id)}
                    className="rounded"
                  />
                  <span className="text-sm truncate" title={`${persona.full_name} - ${persona.role || 'sem cargo'}`}>
                    {persona.full_name}
                  </span>
                </label>
              ))}
            </div>
          )}
          
          {selectedPersonas.length > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              ✓ {selectedPersonas.length} persona{selectedPersonas.length > 1 ? 's' : ''} selecionada{selectedPersonas.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !title || !selectedEmpresa || selectedPersonas.length === 0}>
            {loading ? 'Salvando...' : (editingTask ? '💾 Atualizar Tarefa' : '➕ Criar Tarefa')}
          </Button>
          {editingTask && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Filtro por Personas */}
      {tasks.length > 0 && allPersonas.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">🔍 Filtrar Tarefas por Persona</h2>
            {filterPersonas.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros ({filterPersonas.length})
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {allPersonas.map((persona) => {
              const taskCount = tasks.filter(t => 
                t.task_persona_assignments?.some(a => a.persona_id === persona.id)
              ).length;
              
              return (
                <label 
                  key={persona.id} 
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                    filterPersonas.includes(persona.id) 
                      ? 'bg-blue-50 border-2 border-blue-500' 
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterPersonas.includes(persona.id)}
                    onChange={() => toggleFilterPersona(persona.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" title={persona.full_name}>
                      {persona.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {taskCount} tarefa{taskCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {filterPersonas.length > 0 && (
            <div className="mt-3 text-sm text-blue-600">
              ✓ Mostrando tarefas de {filterPersonas.length} persona{filterPersonas.length > 1 ? 's' : ''} ({filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''})
            </div>
          )}
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div>Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="text-gray-500">Nenhuma tarefa encontrada. Crie uma nova acima.</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
          ⚠️ Nenhuma tarefa encontrada para as personas selecionadas no filtro.
          <button onClick={clearFilters} className="ml-2 underline">Limpar filtros</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {Array.isArray(filteredTasks) && filteredTasks.map((t) => (
            <li key={t.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium text-lg">{t.title}</div>
                    {t.priority && (
                      <Badge variant={
                        t.priority === 'URGENT' ? 'destructive' :
                        t.priority === 'HIGH' ? 'default' :
                        'secondary'
                      }>
                        {t.priority}
                      </Badge>
                    )}
                    {t.status && (
                      <Badge variant="outline">{t.status}</Badge>
                    )}
                  </div>
                  
                  {t.description && (
                    <div className="text-sm text-gray-600 mb-3">{t.description}</div>
                  )}
                  
                  {/* Mostrar personas atribuídas */}
                  {t.task_persona_assignments && t.task_persona_assignments.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Atribuída a:</div>
                      <div className="flex flex-wrap gap-1">
                        {t.task_persona_assignments.map((assignment) => (
                          <Badge 
                            key={assignment.id} 
                            variant="outline"
                            className="text-xs"
                          >
                            {assignment.personas?.full_name || assignment.persona_id}
                            {assignment.status !== 'pending' && (
                              <span className="ml-1 text-blue-600">({assignment.status})</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Criada em: {t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : 'N/A'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => startEditTask(t)}
                    disabled={editingTask?.id === t.id}
                  >
                    {editingTask?.id === t.id ? '✏️ Editando...' : '✏️ Editar'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeTask(t.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️ Remover
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
