
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface HRManagerChatProps {
  projectId: string;
  mode: 'team' | 'workflows';
  onUpdate: () => void;
  currentData?: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposal?: {
    type: string;
    payload: any;
    summary: string;
  };
  confirmed?: boolean;
}

export default function HRManagerChat({ projectId, mode, onUpdate, currentData }: HRManagerChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: mode === 'team'
        ? 'Olá! Sou seu Gerente de RH Virtual. Posso ajudar a definir, contratar ou reorganizar sua equipe. O que você precisa?'
        : 'Olá! Sou seu Gerente de Operações. Vamos otimizar seus processos? Posso criar ou ajustar fluxos de trabalho.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (projectId.startsWith('mock-')) return;
      try {
        const { data, error } = await supabase
          .from('chat_logs')
          .select('*')
          .eq('project_id', projectId)
          .eq('mode', mode)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const history = data.map((log: any) => ({
            role: log.role,
            content: log.content,
            proposal: log.proposal ? JSON.parse(log.proposal) : undefined,
            confirmed: log.confirmed
          }));
          setMessages(prev => [...prev.slice(0, 1), ...history]); // Keep welcome message
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchHistory();
  }, [projectId, mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          projectId,
          mode,
          currentData
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Handle direct actions (legacy or informational)
      if (data.action_performed && !data.proposal) {
        onUpdate();
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        proposal: data.proposal
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar seu pedido.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (messageIndex: number, proposal: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [], // Context not strictly needed for execution
          projectId,
          mode,
          currentData,
          confirm_action: proposal
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (data.action_performed) {
        onUpdate();
        toast.success('Alterações aplicadas com sucesso!');

        // Mark message as confirmed
        setMessages(prev => prev.map((m, i) =>
          i === messageIndex ? { ...m, confirmed: true } : m
        ));

        // Add confirmation response
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }

    } catch (error) {
      console.error(error);
      toast.error('Erro ao aplicar alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col border-indigo-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-4">
        <CardTitle className="flex items-center gap-2 text-indigo-800 text-lg">
          <Avatar className="h-8 w-8 bg-indigo-100 border border-indigo-200">
            <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${mode}`} />
            <AvatarFallback><Bot /></AvatarFallback>
          </Avatar>
          {mode === 'team' ? 'HR Manager Assistant' : 'Ops Manager Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className={`h-8 w-8 ${m.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100'}`}>
                  <AvatarFallback>{m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 text-sm max-w-[80%] ${m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Proposal Card */}
                  {m.proposal && (
                    <div className={`mt-3 p-3 rounded bg-white border ${m.confirmed ? 'border-green-200 bg-green-50' : 'border-indigo-200'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        {m.confirmed ? <CheckCircle className="w-4 h-4 text-green-600 mt-1" /> : <AlertCircle className="w-4 h-4 text-indigo-600 mt-1" />}
                        <div>
                          <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                            {m.confirmed ? 'Alteração Confirmada' : 'Sugestão de Alteração'}
                          </p>
                          <p className="text-slate-600 mt-1">{m.proposal.summary}</p>
                        </div>
                      </div>

                      {!m.confirmed && (
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => handleConfirm(i, m.proposal)}
                          disabled={isLoading}
                        >
                          Concordar e Aplicar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-indigo-100"><AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback></Avatar>
                <div className="bg-slate-100 rounded-lg p-3 rounded-tl-none border border-slate-200 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 animate-spin text-indigo-500" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'team' ? "Ex: Hire a Senior React Dev..." : "Ex: Create a workflow for lead qualification..."}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
