'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { FolderKanban, ListChecks, Calendar, Users, Plus, Clock, Target, TrendingUp, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: string
  endDate: string
  progress: number
  team: string[]
  budget: number
  spent: number
  tasksTotal: number
  tasksCompleted: number
}

interface ProjectTask {
  id: string
  projectId: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  dueDate: string
  tags: string[]
}

interface Milestone {
  id: string
  projectId: string
  name: string
  description: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  completionPercentage: number
}

export default function ProjectManagementSystem() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: projData } = await supabase.from('project_projects').select('*').order('created_at', { ascending: false })
      if (projData) {
        setProjects(projData.map((p: any) => ({
          id: p.id, name: p.name, description: p.description || '', status: p.status || 'planning',
          priority: p.priority || 'medium', startDate: p.start_date, endDate: p.end_date,
          progress: p.progress_percentage || 0, team: Array.isArray(p.team_members) ? p.team_members : [],
          budget: parseFloat(p.budget) || 0, spent: parseFloat(p.spent_amount) || 0,
          tasksTotal: p.tasks_total || 0, tasksCompleted: p.tasks_completed || 0
        })))
      }

      const { data: taskData } = await supabase.from('project_tasks').select('*').order('created_at', { ascending: false }).limit(50)
      if (taskData) {
        setTasks(taskData.map((t: any) => ({
          id: t.id, projectId: t.project_id, title: t.title, description: t.description || '',
          status: t.status || 'todo', priority: t.priority || 'medium', assignee: t.assignee_persona_id || 'Não atribuído',
          dueDate: t.due_date, tags: Array.isArray(t.tags) ? t.tags : []
        })))
      }

      const { data: mileData } = await supabase.from('project_milestones').select('*').order('due_date')
      if (mileData) {
        setMilestones(mileData.map((m: any) => ({
          id: m.id, projectId: m.project_id, name: m.name, description: m.description || '',
          dueDate: m.due_date, status: m.status || 'pending', completionPercentage: m.completion_percentage || 0
        })))
      }

      console.log('Project Management: Dados carregados')
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      planning: { color: 'bg-gray-100 text-gray-800', label: 'Planejamento' },
      active: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', label: 'Em Espera' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Concluído' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
      todo: { color: 'bg-gray-100 text-gray-800', label: 'A Fazer' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'Em Progresso' },
      review: { color: 'bg-purple-100 text-purple-800', label: 'Em Revisão' },
      done: { color: 'bg-green-100 text-green-800', label: 'Concluído' },
      blocked: { color: 'bg-red-100 text-red-800', label: 'Bloqueado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      delayed: { color: 'bg-red-100 text-red-800', label: 'Atrasado' }
    }
    const config = configs[status] || configs.planning
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, any> = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      medium: { color: 'bg-blue-100 text-blue-800', label: 'Média' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    }
    const config = configs[priority] || configs.medium
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Gestão de projetos, tarefas e entregas</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Projeto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center">
          <FolderKanban className="h-8 w-8 text-blue-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
          <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'active').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <ListChecks className="h-8 w-8 text-green-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Tarefas</p>
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Target className="h-8 w-8 text-purple-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Milestones</p>
          <p className="text-2xl font-bold text-gray-900">{milestones.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
          <p className="text-2xl font-bold text-gray-900">{projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0}%</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {projects.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum projeto criado</p>
              <Button><Plus className="h-4 w-4 mr-2" />Criar Projeto</Button>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(proj => (
                <Card key={proj.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{proj.name}</CardTitle>
                          {getStatusBadge(proj.status)}
                        </div>
                        <div className="flex gap-2">{getPriorityBadge(proj.priority)}</div>
                      </div>
                    </div>
                    <CardDescription>{proj.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progresso</span>
                        <span className="font-medium">{proj.progress}%</span>
                      </div>
                      <Progress value={proj.progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-gray-600">Tarefas</p><p className="font-medium">{proj.tasksCompleted}/{proj.tasksTotal}</p></div>
                      <div><p className="text-gray-600">Equipe</p><p className="font-medium">{proj.team.length} membros</p></div>
                      <div><p className="text-gray-600">Orçamento</p><p className="font-medium">R$ {(proj.budget / 1000).toFixed(0)}k</p></div>
                      <div><p className="text-gray-600">Prazo</p><p className="font-medium">{new Date(proj.endDate).toLocaleDateString('pt-BR')}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma tarefa criada</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <Card key={task.id} className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><Users className="h-3 w-3 mr-1" />{task.assignee}</div>
                          <div className="flex items-center"><Clock className="h-3 w-3 mr-1" />{new Date(task.dueDate).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones">
          {milestones.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum milestone definido</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {milestones.map(mile => (
                <Card key={mile.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{mile.name}</CardTitle>
                          {getStatusBadge(mile.status)}
                        </div>
                        <CardDescription>{mile.description}</CardDescription>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">Prazo</p>
                        <p className="font-medium">{new Date(mile.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Conclusão</span>
                      <span className="font-medium">{mile.completionPercentage}%</span>
                    </div>
                    <Progress value={mile.completionPercentage} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}