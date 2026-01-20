# Estrutura do Frontend - Dashboard VCM

## 🎨 Design System e Layout

### Layout Principal
```
┌─────────────────────────────────────────────────┐
│ Header: Logo VCM | EmpresaSelector | UserMenu   │
├─────────────┬───────────────────────────────────┤
│ Sidebar     │ Main Content                      │
│ [Dashboard] │ ┌─────────────────────────────────┐ │
│ [Empresas]  │ │ PageHeader + Actions            │ │
│ [Equipes]   │ ├─────────────────────────────────┤ │
│ [Skills]    │ │ Content Area                    │ │
│ [Workflows] │ │ (Cards, Tables, Forms)          │ │
│ [Sync]      │ │                                 │ │
│ [Config]    │ │                                 │ │
│             │ └─────────────────────────────────┘ │
└─────────────┴───────────────────────────────────┘
```

### Design Tokens
```typescript
// lib/design-tokens.ts
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a'
  },
  success: '#10b981',
  warning: '#f59e0b', 
  error: '#ef4444',
  sync: {
    synchronized: '#10b981',   // Verde
    pending: '#f59e0b',        // Amarelo
    syncing: '#3b82f6',        // Azul
    error: '#ef4444',          // Vermelho
    conflict: '#f97316'        // Laranja
  }
}

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem'
}
```

## 📱 Componentes da Interface

### Layout Components

#### Header.tsx
```typescript
interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { user } = useAuth()
  const { selectedEmpresa } = useEmpresaStore()

  return (
    <header className={cn("border-b bg-white px-6 py-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <EmpresaSelector selectedEmpresa={selectedEmpresa} />
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          <SyncStatusIndicator />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
```

#### Sidebar.tsx
```typescript
interface SidebarProps {
  className?: string
}

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Empresas', href: '/empresas' },
  { icon: Users, label: 'Equipes', href: '/personas' },
  { icon: Target, label: 'Competências', href: '/competencias' },
  { icon: Workflow, label: 'Workflows', href: '/workflows' },
  { icon: RefreshCw, label: 'Sincronização', href: '/sync' },
  { icon: Settings, label: 'Configurações', href: '/config' },
]

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn("w-64 bg-gray-50 border-r", className)}>
      <nav className="p-4">
        {menuItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  )
}
```

### Business Components

#### EmpresaCard.tsx
```typescript
interface EmpresaCardProps {
  empresa: Empresa
  onEdit?: (empresa: Empresa) => void
  onSync?: (empresa: Empresa) => void
  onDelete?: (empresa: Empresa) => void
}

export function EmpresaCard({ empresa, onEdit, onSync, onDelete }: EmpresaCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{empresa.nome_empresa}</h3>
            <StatusBadge status={empresa.status} />
            <SyncStatusBadge status={empresa.sync_status} />
          </div>
          
          <p className="text-gray-600 mb-4">{empresa.descricao}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <MetricItem 
              label="Personas" 
              value={empresa.total_personas} 
              icon={Users}
            />
            <MetricItem 
              label="Última Sync" 
              value={formatRelativeTime(empresa.ultima_sincronizacao)}
              icon={RefreshCw}
            />
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit?.(empresa)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSync?.(empresa)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete?.(empresa)}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
```

#### PersonaGrid.tsx
```typescript
interface PersonaGridProps {
  personas: Persona[]
  onEdit?: (persona: Persona) => void
  onViewDetails?: (persona: Persona) => void
}

export function PersonaGrid({ personas, onEdit, onViewDetails }: PersonaGridProps) {
  const categorias = ['executivos', 'especialistas', 'assistentes']

  return (
    <div className="space-y-8">
      {categorias.map(categoria => {
        const personasCategoria = personas.filter(p => p.categoria === categoria)
        
        return (
          <div key={categoria}>
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {categoria} ({personasCategoria.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {personasCategoria.map(persona => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

#### PersonaCard.tsx
```typescript
interface PersonaCardProps {
  persona: Persona
  onEdit?: (persona: Persona) => void
  onViewDetails?: (persona: Persona) => void
}

export function PersonaCard({ persona, onEdit, onViewDetails }: PersonaCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={persona.avatar_url} />
          <AvatarFallback>
            {persona.full_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{persona.full_name}</h4>
          <p className="text-sm text-gray-600 truncate">{persona.role}</p>
          <p className="text-xs text-gray-500 truncate">{persona.department}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={persona.status} size="sm" />
            <SyncIndicator lastSync={persona.last_sync} size="sm" />
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onViewDetails?.(persona)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(persona)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
```

#### SyncStatusIndicator.tsx
```typescript
interface SyncStatusIndicatorProps {
  status: SyncStatus
  lastSync?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SyncStatusIndicator({ status, lastSync, size = 'md' }: SyncStatusIndicatorProps) {
  const config = {
    synchronized: { color: 'green', icon: CheckCircle, label: 'Sincronizado' },
    pending: { color: 'yellow', icon: Clock, label: 'Pendente' },
    syncing: { color: 'blue', icon: RefreshCw, label: 'Sincronizando' },
    error: { color: 'red', icon: XCircle, label: 'Erro' },
    conflict: { color: 'orange', icon: AlertTriangle, label: 'Conflito' }
  }

  const { color, icon: Icon, label } = config[status]

  return (
    <div className="flex items-center gap-2">
      <Icon 
        className={cn(
          "animate-spin-slow",
          status === 'syncing' && "animate-spin",
          size === 'sm' && "h-3 w-3",
          size === 'md' && "h-4 w-4", 
          size === 'lg' && "h-5 w-5"
        )}
        style={{ color: colors.sync[status] }}
      />
      
      <span className={cn(
        "text-sm",
        size === 'sm' && "text-xs"
      )}>
        {label}
      </span>
      
      {lastSync && (
        <span className="text-xs text-gray-500">
          {formatRelativeTime(lastSync)}
        </span>
      )}
    </div>
  )
}
```

#### DataTable.tsx
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ 
  data, 
  columns, 
  loading, 
  searchPlaceholder,
  onRowClick 
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={searchPlaceholder || "Buscar..."}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer hover:bg-gray-50")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

## 📄 Páginas Principais

### Dashboard.tsx
```typescript
export function Dashboard() {
  const { data: empresas, isLoading } = useEmpresas()
  const { data: syncStatus } = useSyncStatus()

  const metrics = useMemo(() => ({
    totalEmpresas: empresas?.length || 0,
    empresasAtivas: empresas?.filter(e => e.status === 'active').length || 0,
    totalPersonas: empresas?.reduce((acc, e) => acc + e.total_personas, 0) || 0,
    syncsPendentes: syncStatus?.filter(s => s.status === 'pending').length || 0
  }), [empresas, syncStatus])

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard VCM" />
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Empresas Virtuais"
          value={metrics.totalEmpresas}
          subtitle={`${metrics.empresasAtivas} ativas`}
          icon={Building2}
          color="blue"
        />
        <MetricCard
          title="Total Personas"
          value={metrics.totalPersonas}
          subtitle="Todas as empresas"
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Sincronizações"
          value={metrics.syncsPendentes}
          subtitle="Pendentes"
          icon={RefreshCw}
          color="yellow"
        />
        <MetricCard
          title="Status Sistema"
          value="Operacional"
          subtitle="Todos os serviços"
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Virtuais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {empresas?.map(empresa => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Empresas.tsx
```typescript
export function Empresas() {
  const { data: empresas, isLoading } = useEmpresas()
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleEdit = (empresa: Empresa) => {
    setSelectedEmpresa(empresa)
    setShowForm(true)
  }

  const handleSync = async (empresa: Empresa) => {
    await syncAPI.syncEmpresa(empresa.id)
    toast.success(`Sincronização iniciada para ${empresa.nome_empresa}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Empresas Virtuais"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        }
      />

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {empresas?.map(empresa => (
          <EmpresaCard
            key={empresa.id}
            empresa={empresa}
            onEdit={handleEdit}
            onSync={handleSync}
          />
        ))}
      </div>

      {/* Modal de Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEmpresa ? 'Editar Empresa' : 'Nova Empresa Virtual'}
            </DialogTitle>
          </DialogHeader>
          <EmpresaForm 
            empresa={selectedEmpresa}
            onSuccess={() => {
              setShowForm(false)
              setSelectedEmpresa(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

## 🎣 Hooks Customizados

### useEmpresas.ts
```typescript
export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: empresasAPI.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEmpresa(id: string) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasAPI.getById(id),
    enabled: !!id,
  })
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: empresasAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      toast.success('Empresa criada com sucesso!')
    },
    onError: (error) => {
      toast.error('Erro ao criar empresa: ' + error.message)
    }
  })
}
```

### useSync.ts
```typescript
export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: syncAPI.getGlobalStatus,
    refetchInterval: 30000, // 30 seconds
  })
}

export function useSyncEmpresa() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: syncAPI.syncEmpresa,
    onSuccess: (data, empresaId) => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['empresa', empresaId] })
      toast.success('Sincronização iniciada!')
    },
    onError: (error) => {
      toast.error('Erro na sincronização: ' + error.message)
    }
  })
}
```

## 📱 Responsividade

### Breakpoints
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px'  // Extra large
    }
  }
}
```

### Layout Responsivo
```typescript
// Layout adapta conforme o tamanho da tela
export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```