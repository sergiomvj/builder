'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar,
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Timer,
  Target,
  Users,
  BarChart3,
  Zap
} from 'lucide-react';

interface Task {
  id: string;
  persona_id: string;
  persona_name: string;
  company?: string;
  role?: string;
  title: string;
  description?: string;
  task_type: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  estimated_duration?: number;
  actual_duration?: number;
  due_date?: string;
  completed_at?: string;
  required_subsystems: string[];
  inputs_from: string[];
  outputs_to: string[];
  dependencies: string[];
  created_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  task_type: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimated_duration: number;
  persona_id: string;
  company: string;
  required_subsystems: string[];
  inputs_from: string[];
  outputs_to: string[];
  dependencies: string[];
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800'
};

const typeIcons = {
  daily: <Calendar className="h-4 w-4" />,
  weekly: <BarChart3 className="h-4 w-4" />,
  monthly: <Target className="h-4 w-4" />,
  ad_hoc: <Zap className="h-4 w-4" />
};

export function TaskManagementCRUD() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [personas, setPersonas] = useState<any[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    task_type: 'daily',
    priority: 'MEDIUM',
    estimated_duration: 60,
    persona_id: '',
    company: '',
    required_subsystems: [],
    inputs_from: [],
    outputs_to: [],
    dependencies: []
  });

  // Dados mockados para desenvolvimento
  const mockTasks: Task[] = [
    {
      id: '1',
      persona_id: 'ceo_001',
      persona_name: 'João Silva - CEO',
      company: 'LifewayUSA',
      role: 'Executivo',
      title: 'Revisão de Métricas Executivas',
      description: 'Análise do dashboard executivo com KPIs principais',
      task_type: 'daily',
      priority: 'HIGH',
      status: 'completed',
      estimated_duration: 30,
      actual_duration: 25,
      due_date: '2025-11-16T18:00:00Z',
      completed_at: '2025-11-16T17:45:00Z',
      required_subsystems: ['Analytics', 'BI'],
      inputs_from: ['CFO', 'CTO', 'Sales Director'],
      outputs_to: ['Equipe executiva'],
      dependencies: ['Relatórios atualizados'],
      created_at: '2025-11-16T08:00:00Z'
    },
    {
      id: '2',
      persona_id: 'mkt_001',
      persona_name: 'Maria Santos - Marketing Manager',
      company: 'LifewayUSA',
      role: 'Marketing',
      title: 'Análise de Performance de Campanhas',
      description: 'Monitoramento de métricas de campanhas ativas',
      task_type: 'daily',
      priority: 'HIGH',
      status: 'in_progress',
      estimated_duration: 60,
      due_date: '2025-11-16T18:00:00Z',
      required_subsystems: ['Marketing', 'Analytics'],
      inputs_from: ['Marketing Metrics', 'Social Media'],
      outputs_to: ['Sales Director', 'CEO'],
      dependencies: ['Dados atualizados de campanhas'],
      created_at: '2025-11-16T09:00:00Z'
    },
    {
      id: '3',
      persona_id: 'sdr_001',
      persona_name: 'SDR',
      title: 'Prospecção de Novos Leads',
      description: 'Identificação e contato inicial com prospects',
      task_type: 'daily',
      priority: 'HIGH',
      status: 'pending',
      estimated_duration: 120,
      due_date: '2025-11-16T18:00:00Z',
      required_subsystems: ['CRM', 'Email Management'],
      inputs_from: ['Marketing leads', 'Lead scoring'],
      outputs_to: ['CRM pipeline', 'Account Executives'],
      dependencies: ['Lista de leads atualizada'],
      created_at: '2025-11-16T08:30:00Z'
    },
    {
      id: '4',
      persona_id: 'cfo_002',
      persona_name: 'Ana Costa - CFO',
      company: 'TechBrasil',
      role: 'Financeiro',
      title: 'Relatório Financeiro Mensal',
      description: 'Consolidação das informações financeiras do mês',
      task_type: 'monthly',
      priority: 'HIGH',
      status: 'pending',
      estimated_duration: 180,
      due_date: '2025-11-30T18:00:00Z',
      required_subsystems: ['Financial', 'Analytics'],
      inputs_from: ['Contabilidade', 'Vendas'],
      outputs_to: ['CEO', 'Diretoria'],
      dependencies: ['Fechamento contábil'],
      created_at: '2025-11-01T08:00:00Z'
    },
    {
      id: '5',
      persona_id: 'dev_001',
      persona_name: 'Carlos Lima - Tech Lead',
      company: 'TechBrasil',
      role: 'Desenvolvimento',
      title: 'Code Review Sprint',
      description: 'Revisão de código das features desenvolvidas na sprint',
      task_type: 'weekly',
      priority: 'MEDIUM',
      status: 'in_progress',
      estimated_duration: 120,
      due_date: '2025-11-17T17:00:00Z',
      required_subsystems: ['Development Tools', 'Version Control'],
      inputs_from: ['Developers Team'],
      outputs_to: ['CTO', 'QA Team'],
      dependencies: ['Sprint completion'],
      created_at: '2025-11-15T09:00:00Z'
    },
    {
      id: '6',
      persona_id: 'hr_001',
      persona_name: 'Paula Oliveira - HR Manager',
      company: 'LifewayUSA',
      role: 'Recursos Humanos',
      title: 'Avaliação de Performance',
      description: 'Ciclo mensal de avaliação de performance dos colaboradores',
      task_type: 'monthly',
      priority: 'MEDIUM',
      status: 'pending',
      estimated_duration: 240,
      due_date: '2025-11-25T18:00:00Z',
      required_subsystems: ['HR', 'Analytics'],
      inputs_from: ['Managers', 'Self-assessment'],
      outputs_to: ['Leadership Team', 'Employees'],
      dependencies: ['Performance data collection'],
      created_at: '2025-11-10T08:00:00Z'
    }
  ];

  const mockPersonas = [
    { id: 'ceo_001', name: 'CEO' },
    { id: 'mkt_001', name: 'Marketing Manager' },
    { id: 'sdr_001', name: 'SDR' },
    { id: 'cfo_001', name: 'CFO' },
    { id: 'sales_001', name: 'Sales Director' }
  ];

  const availableSubsystems = [
    'Email Management', 'CRM', 'Social Media', 'Marketing',
    'Financial', 'Content Creation', 'Support', 'Analytics',
    'HR', 'E-commerce', 'AI Assistant', 'BI'
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(task => task.task_type === filterType);
    }

    if (filterCompany !== 'all') {
      filtered = filtered.filter(task => task.company === filterCompany);
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(task => task.role === filterRole);
    }

    if (filterPersona !== 'all') {
      filtered = filtered.filter(task => task.persona_id === filterPersona);
    }

    setFilteredTasks(filtered);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filterStatus, filterType, filterPersona, filterCompany, filterRole]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados
      setTimeout(() => {
        setTasks(mockTasks);
        
        // Extrair empresas e funções únicas
        const uniqueCompanies = Array.from(new Set(mockTasks.map(task => task.company).filter(Boolean)));
        const uniqueRoles = Array.from(new Set(mockTasks.map(task => task.role).filter(Boolean)));
        setCompanies(uniqueCompanies);
        setRoles(uniqueRoles);
        
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      const newTask: Task = {
        id: Date.now().toString(),
        ...formData,
        persona_name: mockPersonas.find(p => p.id === formData.persona_id)?.name || 'Unknown',
        status: 'pending',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h from now
      };

      setTasks(prev => [...prev, newTask]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
      try {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
      }
    }
  };

  const markAsCompleted = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_duration: task.estimated_duration
      });
    }
  };

  const arbitrateTasksForPersona = async (personaId: string) => {
    // Simular arbitragem de tarefas
    console.log('Arbitrando tarefas para persona:', personaId);
    alert('Arbitragem de tarefas executada com sucesso! (Funcionalidade simulada)');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'daily',
      priority: 'MEDIUM',
      estimated_duration: 60,
      persona_id: '',
      company: '',
      required_subsystems: [],
      inputs_from: [],
      outputs_to: [],
      dependencies: []
    });
  };

  const getTaskStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => t.status === 'overdue').length;

    return { total, completed, pending, inProgress, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Tarefas das Personas</h2>
          <p className="text-muted-foreground">
            Sistema CRUD para tarefas arbitradas inteligentemente
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa para uma persona específica
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título da tarefa"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Empresa</label>
                  <Select value={formData.company} onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Persona</label>
                  <Select value={formData.persona_id} onValueChange={(value) => setFormData(prev => ({ ...prev, persona_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as personas</SelectItem>
                      {mockPersonas
                        .filter(persona => formData.company === '' || 
                          tasks.find(t => t.persona_id === persona.id && t.company === formData.company))
                        .map(persona => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duração (min)</label>
                  <Input 
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: Number(e.target.value) }))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada da tarefa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={formData.task_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, task_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={createTask} className="flex-1">
                  Criar Tarefa
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
            <TabsTrigger value="arbitrate">Arbitragem</TabsTrigger>
          </TabsList>

          {/* Filtros */}
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Completas</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="daily">Diárias</SelectItem>
                <SelectItem value="weekly">Semanais</SelectItem>
                <SelectItem value="monthly">Mensais</SelectItem>
                <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPersona} onValueChange={setFilterPersona}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {mockPersonas.map(persona => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {typeIcons[task.task_type]}
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={statusColors[task.status]}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status !== 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsCompleted(task.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{task.persona_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{task.estimated_duration}min</span>
                      </span>
                      {task.due_date && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="font-medium mb-1">Sub-sistemas Requeridos:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.required_subsystems.map((sys, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {sys}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Inputs de:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.inputs_from.map((input, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {input}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1">Outputs para:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.outputs_to.map((output, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {output}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="arbitrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Arbitragem Automática de Tarefas</CardTitle>
              <CardDescription>
                Execute a arbitragem inteligente para gerar tarefas baseadas nas funções das personas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPersonas.map(persona => (
                  <Card key={persona.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{persona.name}</span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => arbitrateTasksForPersona(persona.id)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Arbitrar
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Tarefas atuais: {tasks.filter(t => t.persona_id === persona.id).length}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full"
                  onClick={() => {
                    mockPersonas.forEach(persona => arbitrateTasksForPersona(persona.id));
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Arbitrar Todas as Personas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}