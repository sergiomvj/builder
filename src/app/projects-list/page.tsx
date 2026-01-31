'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
}

export default function ProjectsListPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // Force fetch on mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            // Cache-busting to ensure fresh data
            const res = await fetch(`/api/projects?ts=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (!res.ok) throw new Error('Failed to fetch projects');

            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            toast.error('Erro ao carregar projetos.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha na exclusão');

            toast.success('Projeto excluído.');
            // Update local state immediately
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            toast.error('Erro ao excluir projeto.');
        }
    };

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projetos</h1>
                        <p className="text-slate-500 mt-1">Gerencie suas empresas e análises.</p>
                    </div>
                    <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Novo Projeto
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Buscar projetos..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 border-slate-200"
                        />
                    </div>
                    <div className="flex items-center border rounded-lg p-1 bg-slate-100">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500'}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500'}
                        >
                            <ListIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Nenhum projeto encontrado</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando sua primeira empresa virtual.'}
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {filtered.map(project => (
                            <Card
                                key={project.id}
                                className="group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                onClick={() => router.push(`/projects/${project.id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className={`mb-2 capitalize ${project.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                project.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-slate-50 text-slate-600'
                                            }`}>
                                            {project.status || 'Draft'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {project.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {project.description || 'Sem descrição.'}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t bg-slate-50/50 mt-auto">
                                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => deleteProject(project.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
