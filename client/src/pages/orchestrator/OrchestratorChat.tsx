import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Brain,
  User,
  Loader2,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  confidence?: number;
  escalations?: number;
  timestamp: Date;
  status?: "sending" | "processing" | "completed" | "error";
}

/**
 * Interface de Chat com COMET Orquestrador
 * 
 * Permite interação direta com o sistema de orquestração,
 * mostrando qual IA está respondendo e escalações em tempo real
 */
export default function OrchestratorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# Olá! Sou o COMET 🤖

Sou o orquestrador principal do sistema multi-IA. Posso ajudá-lo com:

- **Tarefas simples**: Respondo diretamente
- **Tarefas complexas**: Escalo para IAs especializadas (Claude, Comet Vision, etc)
- **Análise visual**: Uso Comet Vision para websites
- **Pesquisa profunda**: Uso Genspark Simulated

Envie sua mensagem e eu escolherei automaticamente a melhor IA para responder!`,
      provider: "COMET",
      timestamp: new Date(),
      status: "completed",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const processMutation = trpc.orchestratorMultiIA.process.useMutation({
    onSuccess: (data) => {
      // Adicionar resposta do sistema
      const assistantMessage: Message = {
        id: data.task_id || `msg-${Date.now()}`,
        role: "assistant",
        content: data.output || "Resposta processada com sucesso",
        provider: data.provider_name,
        confidence: data.confidence_score,
        escalations: data.escalation_count,
        timestamp: new Date(),
        status: "completed",
      };

      setMessages((prev) => prev.map((msg) => 
        msg.status === "processing" ? assistantMessage : msg
      ));

      // Mostrar notificação se houve escalação
      if (data.escalation_count > 0) {
        toast.info(
          `Tarefa escalada ${data.escalation_count}x para ${data.provider_name}`,
          { description: `Confiança: ${data.confidence_score?.toFixed(1)}%` }
        );
      }
    },
    onError: (error) => {
      toast.error("Erro ao processar mensagem", {
        description: error.message,
      });

      // Marcar última mensagem como erro
      setMessages((prev) => prev.map((msg, idx) =>
        idx === prev.length - 1 ? { ...msg, status: "error" as const } : msg
      ));
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
      status: "completed",
    };

    const processingMessage: Message = {
      id: `processing-${Date.now()}`,
      role: "assistant",
      content: "Processando sua solicitação...",
      timestamp: new Date(),
      status: "processing",
    };

    setMessages((prev) => [...prev, userMessage, processingMessage]);
    setInput("");

    // Enviar para orquestrador
    processMutation.mutate({
      input: input.trim(),
      context: {},
    });
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6" />
                <span>Chat com COMET Orquestrador</span>
              </CardTitle>
              <CardDescription>
                Sistema inteligente de roteamento multi-IA
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>Orquestração Ativa</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col h-[calc(100%-8rem)]">
          {/* Área de Mensagens */}
          <ScrollArea ref={scrollRef} className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-3 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.status === "processing" ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{message.content}</span>
                          </div>
                        ) : message.status === "error" ? (
                          <div className="flex items-center space-x-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Erro ao processar mensagem</span>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        )}
                      </div>

                      {/* Metadados */}
                      {message.role === "assistant" && message.status === "completed" && (
                        <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                          {message.provider && (
                            <Badge variant="outline" className="text-xs">
                              {message.provider}
                            </Badge>
                          )}
                          {message.confidence !== undefined && (
                            <span className="flex items-center space-x-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{message.confidence.toFixed(1)}%</span>
                            </span>
                          )}
                          {message.escalations && message.escalations > 0 && (
                            <span className="flex items-center space-x-1 text-orange-600">
                              <ArrowUpCircle className="h-3 w-3" />
                              <span>{message.escalations} escalações</span>
                            </span>
                          )}
                          <span>{message.timestamp.toLocaleTimeString("pt-BR")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Área de Input */}
          <div className="flex space-x-2">
            <Textarea
              placeholder="Digite sua mensagem... (COMET escolherá automaticamente a melhor IA)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[60px] resize-none"
              disabled={processMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || processMutation.isPending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {processMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Dica */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
