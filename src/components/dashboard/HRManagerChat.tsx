
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface HRManagerChatProps {
  projectId: string;
  mode: 'team' | 'workflows';
  onUpdate: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function HRManagerChat({ projectId, mode, onUpdate }: HRManagerChatProps) {
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
          mode
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (data.action_performed) {
        onUpdate(); // Trigger parent refresh
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar seu pedido.' }]);
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
             <AvatarFallback><Bot/></AvatarFallback>
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
                  <AvatarFallback>{m.role === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}</AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 text-sm max-w-[80%] ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex gap-3">
                 <Avatar className="h-8 w-8 bg-indigo-100"><AvatarFallback><Bot className="w-4 h-4"/></AvatarFallback></Avatar>
                 <div className="bg-slate-100 rounded-lg p-3 rounded-tl-none border border-slate-200 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 animate-spin text-indigo-500"/>
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
          />
          <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
