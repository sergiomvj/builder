'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Users,
  UserPlus,
  UserX,
  Calendar,
  DollarSign,
  Clock,
  Award,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  AlertCircle,
  CheckCircle,
  Building2,
  Calculator,
  Target,
  BarChart3,
  Settings
} from 'lucide-react'

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  level: string
  manager?: string
  hireDate: string
  status: 'active' | 'inactive' | 'on-leave' | 'terminated'
  salary: number
  currency: string
  workLocation: 'office' | 'remote' | 'hybrid'
  workSchedule: string
  skills: string[]
  certifications: string[]
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  avatar?: string
  birthDate: string
  documents: EmployeeDocument[]
  performanceScore?: number
}

interface EmployeeDocument {
  id: string
  name: string
  type: string
  uploadDate: string
  url: string
  size: string
}

interface Department {
  id: string
  name: string
  description: string
  head: string
  budget: number
  employeeCount: number
  locations: string[]
  goals: string[]
}

interface PayrollEntry {
  id: string
  employeeId: string
  employeeName: string
  period: string
  baseSalary: number
  bonuses: number
  deductions: number
  taxes: number
  netSalary: number
  status: 'draft' | 'processed' | 'paid'
  payDate?: string
  workingDays: number
  overtimeHours: number
  overtimePay: number
}

interface Performance {
  id: string
  employeeId: string
  employeeName: string
  period: string
  reviewType: 'quarterly' | 'annual' | 'project' | '360'
  overallScore: number
  goals: PerformanceGoal[]
  feedback: string[]
  developmentPlan: string[]
  reviewer: string
  status: 'draft' | 'in-review' | 'completed'
  nextReviewDate: string
}

interface PerformanceGoal {
  id: string
  title: string
  description: string
  target: string
  achievement: number
  status: 'not-started' | 'in-progress' | 'completed' | 'exceeded'
}

interface TimeOff {
  id: string
  employeeId: string
  employeeName: string
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approver?: string
  approvedDate?: string
  comments?: string
}

interface HRMetrics {
  totalEmployees: number
  newHires: number
  turnoverRate: number
  avgSalary: number
  avgPerformance: number
  openPositions: number
  pendingRequests: number
  payrollTotal: number
}

export default function HREmployeeManagementSystem() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [performances, setPerformances] = useState<Performance[]>([])
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([])
  const [metrics, setMetrics] = useState<HRMetrics>({
    totalEmployees: 0,
    newHires: 0,
    turnoverRate: 0,
    avgSalary: 0,
    avgPerformance: 0,
    openPositions: 0,
    pendingRequests: 0,
    payrollTotal: 0
  })
  
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load departments from hr_departments
        const { data: deptData, error: deptError } = await supabase
          .from('hr_departments')
          .select('*')
          .order('name')

        if (deptError) {
          console.error('Error loading departments:', deptError)
        } else if (deptData) {
          const mappedDepts: Department[] = deptData.map(dept => ({
            id: dept.id,
            name: dept.name,
            description: dept.description || '',
            head: dept.manager_employee_id || 'N/A',
            budget: parseFloat(dept.budget) || 0,
            employeeCount: dept.employee_count || 0,
            locations: [],
            goals: []
          }))
          setDepartments(mappedDepts)
        }

        // Load employees from hr_employees
        const { data: empData, error: empError } = await supabase
          .from('hr_employees')
          .select('*')
          .order('full_name')

        if (empError) {
          console.error('Error loading employees:', empError)
        } else if (empData) {
          const mappedEmployees: Employee[] = empData.map(emp => ({
            id: emp.id,
            employeeNumber: emp.employee_number,
            firstName: emp.first_name,
            lastName: emp.last_name,
            email: emp.email,
            phone: emp.phone || '',
            department: emp.department || '',
            position: emp.position || '',
            level: emp.level || 'mid',
            manager: emp.manager_id || undefined,
            hireDate: emp.hire_date,
            status: emp.employment_status as Employee['status'],
            salary: parseFloat(emp.salary) || 0,
            currency: emp.currency || 'BRL',
            workLocation: emp.work_location as Employee['workLocation'],
            workSchedule: emp.work_schedule || 'full-time',
            skills: Array.isArray(emp.skills) ? emp.skills : [],
            certifications: Array.isArray(emp.certifications) ? emp.certifications : [],
            emergencyContact: emp.emergency_contact || { name: '', relationship: '', phone: '' },
            address: emp.address || { street: '', city: '', state: '', zipCode: '', country: 'Brasil' },
            birthDate: emp.birth_date || '',
            documents: [],
            performanceScore: emp.performance_score || undefined
          }))
          setEmployees(mappedEmployees)
        }

        // Load payroll from hr_payroll
        const { data: payData, error: payError } = await supabase
          .from('hr_payroll')
          .select(`
            *,
            employee:hr_employees(full_name)
          `)
          .order('pay_period', { ascending: false })
          .limit(20)

        if (payError) {
          console.error('Error loading payroll:', payError)
        } else if (payData) {
          const mappedPayroll: PayrollEntry[] = payData.map(pay => ({
            id: pay.id,
            employeeId: pay.employee_id,
            employeeName: pay.employee?.full_name || 'N/A',
            period: pay.pay_period,
            baseSalary: parseFloat(pay.gross_pay) || 0,
            bonuses: parseFloat(pay.bonuses) || 0,
            deductions: parseFloat(pay.deductions) || 0,
            taxes: parseFloat(pay.taxes) || 0,
            netSalary: parseFloat(pay.net_pay) || 0,
            status: pay.status as PayrollEntry['status'],
            payDate: pay.pay_date,
            workingDays: pay.working_days || 0,
            overtimeHours: pay.overtime_hours || 0,
            overtimePay: parseFloat(pay.overtime_pay) || 0
          }))
          setPayroll(mappedPayroll)
        }

        // Load performance reviews from hr_performance_reviews
        const { data: perfData, error: perfError } = await supabase
          .from('hr_performance_reviews')
          .select(`
            *,
            employee:hr_employees!hr_performance_reviews_employee_id_fkey(full_name),
            reviewer:hr_employees!hr_performance_reviews_reviewer_id_fkey(full_name)
          `)
          .order('review_date', { ascending: false })
          .limit(20)

        if (perfError) {
          console.error('Error loading performance reviews:', perfError)
        } else if (perfData) {
          const mappedPerformances: Performance[] = perfData.map(perf => ({
            id: perf.id,
            employeeId: perf.employee_id,
            employeeName: perf.employee?.full_name || 'N/A',
            period: perf.review_period,
            reviewType: perf.review_type as Performance['reviewType'],
            overallScore: parseFloat(perf.overall_rating) || 0,
            goals: Array.isArray(perf.goals) ? perf.goals.map((g: any) => ({
              id: g.id || Date.now().toString(),
              title: g.title || g.name || '',
              description: g.description || '',
              target: g.target || '',
              achievement: g.achievement || 0,
              status: g.status || 'in-progress'
            })) : [],
            feedback: Array.isArray(perf.strengths) ? perf.strengths : [],
            developmentPlan: Array.isArray(perf.development_areas) ? perf.development_areas : [],
            reviewer: perf.reviewer?.full_name || 'N/A',
            status: perf.status as Performance['status'],
            nextReviewDate: perf.next_review_date || ''
          }))
          setPerformances(mappedPerformances)
        }

        // Calculate metrics
        const calculatedMetrics: HRMetrics = {
          totalEmployees: empData?.length || 0,
          newHires: empData?.filter(e => {
            const hireDate = new Date(e.hire_date)
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return hireDate > monthAgo
          }).length || 0,
          turnoverRate: 5.2,
          avgSalary: empData && empData.length > 0 ? 
            empData.reduce((sum, e) => sum + parseFloat(e.salary || 0), 0) / empData.length : 0,
          avgPerformance: perfData && perfData.length > 0 ?
            perfData.reduce((sum, p) => sum + parseFloat(p.overall_rating || 0), 0) / perfData.length : 0,
          openPositions: 3,
          pendingRequests: 0,
          payrollTotal: payData?.reduce((sum, p) => sum + parseFloat(p.net_pay || 0), 0) || 0
        }
        setMetrics(calculatedMetrics)

        console.log('HR System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading HR data:', error)
      }
    }

    loadData()
  }, [])

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inativo' },
      'on-leave': { color: 'bg-yellow-100 text-yellow-800', label: 'Licença' },
      terminated: { color: 'bg-red-100 text-red-800', label: 'Desligado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeitado' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'Processado' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Pago' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Concluído' },
      'in-review': { color: 'bg-yellow-100 text-yellow-800', label: 'Em Análise' }
    }
    
    const config = configs[status as keyof typeof configs]
    return config ? <Badge className={config.color}>{config.label}</Badge> : null
  }

  const getWorkLocationBadge = (location: string) => {
    const configs = {
      office: { color: 'bg-blue-100 text-blue-800', label: 'Presencial' },
      remote: { color: 'bg-purple-100 text-purple-800', label: 'Remoto' },
      hybrid: { color: 'bg-orange-100 text-orange-800', label: 'Híbrido' }
    }
    
    const config = configs[location as keyof typeof configs]
    return config ? <Badge className={config.color}>{config.label}</Badge> : null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus
    return matchesDepartment && matchesStatus
  })

  const getDepartmentEmployees = (departmentName: string) => {
    return employees.filter(emp => emp.department === departmentName)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de RH & Funcionários</h2>
          <p className="text-muted-foreground">
            Gerencie funcionários, folha de pagamento, performance e departamentos
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* HR Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.newHires} novos este ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Turnover</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.turnoverRate}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: {'<'}8%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgSalary)}</div>
            <p className="text-xs text-muted-foreground">
              Performance média: {metrics.avgPerformance.toFixed(1)}/5.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.openPositions} vagas abertas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="payroll">Folha de Pagamento</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="time-off">Férias & Licenças</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 muted-foreground" />
                <Input placeholder="Buscar funcionários..." className="pl-8" />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="on-leave">Licença</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          {getStatusBadge(employee.status)}
                          {getWorkLocationBadge(employee.workLocation)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {employee.position} • {employee.department}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">ID do Funcionário</div>
                            <div className="font-medium">{employee.employeeNumber}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Data de Contratação</div>
                            <div className="font-medium">
                              {new Date(employee.hireDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Gestor</div>
                            <div className="font-medium">{employee.manager || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Salário</div>
                            <div className="font-medium">{formatCurrency(employee.salary)}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {employee.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {employee.phone}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {employee.address.city}, {employee.address.state}
                          </div>
                        </div>

                        {employee.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-1">Habilidades:</div>
                            <div className="flex flex-wrap gap-1">
                              {employee.skills.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {employee.skills.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{employee.skills.length - 4} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {employee.performanceScore && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium">Performance: {employee.performanceScore}/5.0</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((department) => (
              <Card key={department.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <CardDescription>{department.description}</CardDescription>
                    </div>
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Responsável</div>
                      <div className="font-medium">{department.head}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Funcionários</div>
                      <div className="font-medium">{getDepartmentEmployees(department.name).length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Orçamento</div>
                      <div className="font-medium">{formatCurrency(department.budget)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Localizações</div>
                      <div className="font-medium">{department.locations.join(', ')}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Metas do Departamento:</div>
                    <div className="space-y-1">
                      {department.goals.map((goal, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {goal}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Funcionários:</div>
                    <div className="flex flex-wrap gap-1">
                      {getDepartmentEmployees(department.name).slice(0, 3).map((employee) => (
                        <Badge key={employee.id} variant="outline" className="text-xs">
                          {employee.firstName} {employee.lastName}
                        </Badge>
                      ))}
                      {getDepartmentEmployees(department.name).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{getDepartmentEmployees(department.name).length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="space-y-4">
            {payroll.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{entry.employeeName}</CardTitle>
                      <CardDescription>Período: {entry.period}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(entry.status)}
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(entry.netSalary)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Salário Base</div>
                      <div className="font-medium">{formatCurrency(entry.baseSalary)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bônus</div>
                      <div className="font-medium text-green-600">+{formatCurrency(entry.bonuses)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Deduções</div>
                      <div className="font-medium text-red-600">-{formatCurrency(entry.deductions)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Impostos</div>
                      <div className="font-medium text-red-600">-{formatCurrency(entry.taxes)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t">
                    <div>
                      <div className="text-muted-foreground">Dias Trabalhados</div>
                      <div className="font-medium">{entry.workingDays} dias</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Horas Extra</div>
                      <div className="font-medium">{entry.overtimeHours}h ({formatCurrency(entry.overtimePay)})</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Data de Pagamento</div>
                      <div className="font-medium">
                        {entry.payDate ? new Date(entry.payDate).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="space-y-4">
            {performances.map((performance) => (
              <Card key={performance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{performance.employeeName}</CardTitle>
                      <CardDescription>
                        Avaliação {performance.reviewType} • {performance.period}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(performance.status)}
                      <div className="text-right">
                        <div className="text-lg font-bold flex items-center">
                          <Star className="w-5 h-5 text-yellow-400 mr-1" />
                          {performance.overallScore}/5.0
                        </div>
                        <div className="text-xs text-muted-foreground">Score Geral</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Metas ({performance.goals.filter(g => g.status === 'completed').length}/{performance.goals.length} concluídas):</div>
                    <div className="space-y-2">
                      {performance.goals.map((goal) => (
                        <div key={goal.id} className="flex justify-between items-center p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{goal.title}</div>
                            <div className="text-xs text-muted-foreground">{goal.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{goal.achievement}%</div>
                            <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {goal.status === 'completed' ? 'Concluída' : 
                               goal.status === 'in-progress' ? 'Em Progresso' : 
                               goal.status === 'exceeded' ? 'Superada' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Feedback Positivo:</div>
                    <div className="space-y-1">
                      {performance.feedback.map((feedback, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feedback}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Plano de Desenvolvimento:</div>
                    <div className="space-y-1">
                      {performance.developmentPlan.map((plan, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex items-start">
                          <GraduationCap className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          {plan}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Avaliador: {performance.reviewer}</span>
                    <span>Próxima avaliação: {new Date(performance.nextReviewDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time-off" className="space-y-4">
          <div className="space-y-4">
            {timeOffs.map((timeOff) => (
              <Card key={timeOff.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{timeOff.employeeName}</CardTitle>
                      <CardDescription>
                        {timeOff.type === 'vacation' ? 'Férias' :
                         timeOff.type === 'sick' ? 'Licença Médica' :
                         timeOff.type === 'personal' ? 'Licença Pessoal' :
                         timeOff.type === 'maternity' ? 'Licença Maternidade' :
                         'Licença Paternidade'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(timeOff.status)}
                      <div className="text-right">
                        <div className="font-bold">{timeOff.days} dias</div>
                        <div className="text-xs text-muted-foreground">Solicitados</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Início</div>
                      <div className="font-medium">
                        {new Date(timeOff.startDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fim</div>
                      <div className="font-medium">
                        {new Date(timeOff.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Motivo:</div>
                    <div className="text-sm text-muted-foreground">{timeOff.reason}</div>
                  </div>

                  {timeOff.approver && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Aprovado por</div>
                        <div className="font-medium">{timeOff.approver}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Data de Aprovação</div>
                        <div className="font-medium">
                          {timeOff.approvedDate ? new Date(timeOff.approvedDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {timeOff.comments && (
                    <div>
                      <div className="text-sm font-medium mb-1">Comentários:</div>
                      <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {timeOff.comments}
                      </div>
                    </div>
                  )}

                  {timeOff.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map((dept) => {
                    const deptEmployees = getDepartmentEmployees(dept.name)
                    const percentage = (deptEmployees.length / employees.length) * 100
                    return (
                      <div key={dept.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{dept.name}</span>
                          <span>{deptEmployees.length} funcionários ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Salarial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(metrics.avgSalary)}</div>
                      <div className="text-sm text-muted-foreground">Salário Médio</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(metrics.payrollTotal)}</div>
                      <div className="text-sm text-muted-foreground">Folha Atual</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {departments.map((dept) => {
                      const deptEmployees = getDepartmentEmployees(dept.name)
                      const avgSalary = deptEmployees.length > 0 ? 
                        deptEmployees.reduce((sum, emp) => sum + emp.salary, 0) / deptEmployees.length : 0
                      return (
                        <div key={dept.id} className="flex justify-between items-center">
                          <span className="text-sm">{dept.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(avgSalary)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{metrics.avgPerformance.toFixed(1)}/5.0</div>
                    <div className="text-sm text-muted-foreground">Performance Média</div>
                  </div>
                  
                  <div className="space-y-2">
                    {employees.filter(emp => emp.performanceScore).map((employee) => (
                      <div key={employee.id} className="flex justify-between items-center">
                        <span className="text-sm">{employee.firstName} {employee.lastName}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{employee.performanceScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modalidades de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['office', 'remote', 'hybrid'].map((location) => {
                    const locationEmployees = employees.filter(emp => emp.workLocation === location)
                    const percentage = (locationEmployees.length / employees.length) * 100
                    const label = location === 'office' ? 'Presencial' : 
                                 location === 'remote' ? 'Remoto' : 'Híbrido'
                    return (
                      <div key={location} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{label}</span>
                          <span>{locationEmployees.length} funcionários ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}