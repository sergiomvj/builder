
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (member: any) => void;
    member?: any;
}

export default function TeamMemberModal({ isOpen, onClose, onSave, member }: TeamMemberModalProps) {
    const [formData, setFormData] = useState({
        nome: '',
        cargo: '',
        nacionalidade: '',
        idade: '',
        perfil_profissional: '',
        descricao_funcao: '',
    });

    useEffect(() => {
        if (member) {
            setFormData({
                nome: member.nome || '',
                cargo: member.cargo || '',
                nacionalidade: member.nacionalidade || '',
                idade: member.idade || '',
                perfil_profissional: member.perfil_profissional || '',
                descricao_funcao: member.descricao_funcao || '',
            });
        } else {
            setFormData({
                nome: '',
                cargo: '',
                nacionalidade: '',
                idade: '',
                perfil_profissional: '',
                descricao_funcao: '',
            });
        }
    }, [member, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...member,
            ...formData,
            idade: formData.idade ? parseInt(formData.idade as string) : null,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{member ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cargo">Cargo</Label>
                            <Input
                                id="cargo"
                                value={formData.cargo}
                                onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nacionalidade">Nacionalidade</Label>
                            <Input
                                id="nacionalidade"
                                value={formData.nacionalidade}
                                onChange={e => setFormData({ ...formData, nacionalidade: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="idade">Idade</Label>
                            <Input
                                id="idade"
                                type="number"
                                value={formData.idade}
                                onChange={e => setFormData({ ...formData, idade: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="perfil">Perfil Profissional</Label>
                        <Input
                            id="perfil"
                            placeholder="Ex: Engenheiro de Software com 10 anos de exp..."
                            value={formData.perfil_profissional}
                            onChange={e => setFormData({ ...formData, perfil_profissional: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição da Função</Label>
                        <Textarea
                            id="descricao"
                            value={formData.descricao_funcao}
                            onChange={e => setFormData({ ...formData, descricao_funcao: e.target.value })}
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Salvar Membro</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
