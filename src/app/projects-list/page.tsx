'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    FolderOpen,
    Search,
    Calendar,
    ArrowRight,
    Plus,
    Rocket,
    LayoutDashboard,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
    mission: string;
}

export default function ProjectsListPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Falha ao carregar projetos');

            setProjects(data.projects || []);
        } catch (error: any) {
            console.error('Erro:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'planning': 'bg-blue-100 text-blue-700 border-blue-200',
            'active': 'bg-green-100 text-green-700 border-green-200',
            'completed': 'bg-slate-100 text-slate-700 border-slate-200',
            'draft': 'bg-amber-100 text-amber-700 border-amber-200'
        };

        return (
            <Badge variant="outline" className={variants[status] || 'bg-slate-50'}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Meus Projetos</h1>
                    <p className="text-slate-500 mt-2">Gerencie e acesse todas as suas empresas virtuais em um só lugar.</p>
                </div>
                <Button
                    onClick={() => router.push('/')}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4 mr-2" /> Novo Projeto
                </Button>
            </div>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Buscar por nome ou descrição..."
                        className="pl-10 h-11 bg-white border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <Card className="px-6 py-2 flex items-center justify-center border-slate-100 bg-white shadow-sm">
                        <span className="text-sm font-semibold text-slate-600 mr-2">Total:</span>
                        <span className="text-2xl font-bold text-indigo-600">{projects.length}</span>
                    </Card>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-[240px] rounded-2xl" />
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Card key={project.id} className="group overflow-hidden border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 bg-white">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        <Rocket className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    {getStatusBadge(project.status)}
                                </div>
                                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2 h-10 mt-1">
                                    {project.description || 'Sem descrição.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3 pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center text-xs text-slate-500">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Criado em {new Date(project.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        ID: {project.id.slice(0, 8)}...
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 border-t border-slate-50 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors p-4">
                                <Button
                                    onClick={() => router.push(`/projects/${project.id}`)}
                                    variant="ghost"
                                    className="w-full justify-between hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-100 font-semibold"
                                >
                                    <span className="flex items-center">
                                        <LayoutDashboard className="w-4 h-4 mr-2" /> Ver Dashboard
                                    </span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="py-20 border-dashed border-2 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                            <FolderOpen className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Nenhum projeto encontrado</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            {searchTerm ? 'Tente buscar com outros termos.' : 'Você ainda não criou nenhum projeto. Vamos começar?'}
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={() => router.push('/')}
                                className="mt-6 bg-indigo-600"
                            >
                                Criar Primeiro Projeto
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
