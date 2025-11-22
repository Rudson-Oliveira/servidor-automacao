import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'system' | 'success' | 'error';
  content: string;
  timestamp: Date;
}

interface SystemStatus {
  online: boolean;
  version: string;
  totalRequests: number;
  errorsFixed: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: '👋 Olá! Sou o Sistema de Automação. Envie comandos ou pergunte algo!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<SystemStatus>({
    online: true,
    version: '1.0.0',
    totalRequests: 0,
    errorsFixed: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Buscar status do sistema
    fetchStatus();
    
    // Atualizar status a cada 5 segundos
    const interval = setInterval(fetchStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll para o final quando novas mensagens chegarem
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setStatus({
          online: data.online,
          version: data.versao,
          totalRequests: data.total_requisicoes,
          errorsFixed: data.erros_corrigidos,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await fetch('/api/conversar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: inputValue }),
      });

      const data = await response.json();

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: data.sucesso ? 'system' : 'error',
        content: data.sucesso ? data.resposta : `Erro: ${data.erro}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, systemMessage]);
      fetchStatus();
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: `Erro de conexão: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const getMessageStyle = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return 'ml-auto bg-primary text-primary-foreground';
      case 'system':
        return 'bg-muted';
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              🤖 Sistema de Automação
            </CardTitle>
            <CardDescription className="text-lg">
              Interface de Comunicação Comet/Manus ↔ Automação
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status do Sistema */}
            <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Status:</span>
                  <Badge variant={status.online ? 'default' : 'destructive'}>
                    {status.online ? '✅ Online' : '❌ Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Versão:</span>
                  <span className="text-blue-800 dark:text-blue-200">{status.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Requisições:</span>
                  <span className="text-blue-800 dark:text-blue-200">{status.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Erros Corrigidos:</span>
                  <span className="text-blue-800 dark:text-blue-200">{status.errorsFixed}</span>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle>Chat em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[80%] rounded-lg p-3 ${getMessageStyle(message.type)} ${
                          message.type === 'user' ? 'ml-auto' : ''
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem ou comando..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage}>Enviar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-lg">📡 Endpoints Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/api/status</code>
                  <span className="text-sm text-muted-foreground">- Status do sistema</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/executar</code>
                  <span className="text-sm text-muted-foreground">- Executar tarefa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/corrigir-erro</code>
                  <span className="text-sm text-muted-foreground">- Corrigir erro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/conversar</code>
                  <span className="text-sm text-muted-foreground">- Conversar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-sm">/api/historico</code>
                  <span className="text-sm text-muted-foreground">- Ver histórico</span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
