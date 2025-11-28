import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Monitor, 
  Network, 
  Play, 
  Square, 
  Terminal,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Zap
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DesktopAgent {
  id: string;
  hostname: string;
  platform: string;
  status: "online" | "offline" | "busy";
  lastSeen: Date;
  cpu: number;
  memory: number;
  disk: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "success";
  message: string;
  source: string;
}

export default function ControlCenter() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Mock data - substituir com queries tRPC reais
  const agents: DesktopAgent[] = [
    {
      id: "agent-1",
      hostname: "DESKTOP-PRINCIPAL",
      platform: "Windows 11",
      status: "online",
      lastSeen: new Date(),
      cpu: 45,
      memory: 62,
      disk: 78
    },
    {
      id: "agent-2",
      hostname: "LAPTOP-TRABALHO",
      platform: "Windows 10",
      status: "online",
      lastSeen: new Date(Date.now() - 120000),
      cpu: 23,
      memory: 41,
      disk: 55
    }
  ];

  const handleExecuteCommand = async () => {
    if (!command.trim() || !selectedAgent) {
      toast.error("Selecione um agente e digite um comando");
      return;
    }

    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: "info",
      message: `Executando: ${command}`,
      source: selectedAgent
    };

    setLogs(prev => [newLog, ...prev]);
    
    // Simular execução
    setTimeout(() => {
      const resultLog: LogEntry = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        level: "success",
        message: `Comando executado com sucesso`,
        source: selectedAgent
      };
      setLogs(prev => [resultLog, ...prev]);
    }, 1500);

    setCommand("");
    toast.success("Comando enviado para execução");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-gray-500";
      case "busy": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warn": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Bot className="h-10 w-10 text-blue-400" />
              Centro de Controle Manus
            </h1>
            <p className="text-slate-400 mt-2">
              Controle total sobre navegador e desktop
            </p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            <Zap className="h-3 w-3 mr-1" />
            Sistema Ativo
          </Badge>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Agentes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{agents.filter(a => a.status === "online").length}</div>
              <p className="text-xs text-slate-500 mt-1">de {agents.length} total</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.round(agents.reduce((acc, a) => acc + a.cpu, 0) / agents.length)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Uso agregado</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Memória Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.round(agents.reduce((acc, a) => acc + a.memory, 0) / agents.length)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">RAM utilizada</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Comandos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">247</div>
              <p className="text-xs text-slate-500 mt-1">Executados com sucesso</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Desktop Agents */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-400" />
                Desktop Agents
              </CardTitle>
              <CardDescription className="text-slate-400">
                Máquinas conectadas ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedAgent === agent.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{agent.hostname}</h3>
                          <p className="text-xs text-slate-400">{agent.platform}</p>
                        </div>
                        <Badge className={`${getStatusColor(agent.status)} text-white`}>
                          {agent.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>CPU</span>
                          <span className="text-white font-medium">{agent.cpu}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ width: `${agent.cpu}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Memória</span>
                          <span className="text-white font-medium">{agent.memory}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full" 
                            style={{ width: `${agent.memory}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-slate-400">
                          <span>Disco</span>
                          <span className="text-white font-medium">{agent.disk}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-yellow-500 h-1.5 rounded-full" 
                            style={{ width: `${agent.disk}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                        Último contato: {agent.lastSeen.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Command Execution & Logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Command Panel */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-green-400" />
                  Executar Comando
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedAgent 
                    ? `Executar no agente: ${agents.find(a => a.id === selectedAgent)?.hostname}`
                    : "Selecione um agente para executar comandos"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Digite o comando a ser executado..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="min-h-[100px] bg-slate-800 border-slate-700 text-white font-mono"
                  disabled={!selectedAgent}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExecuteCommand}
                    disabled={!selectedAgent || !command.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Executar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCommand("")}
                    className="border-slate-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Logs em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">
                        Nenhum log ainda. Execute um comando para começar.
                      </p>
                    ) : (
                      logs.map((log) => (
                        <div 
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                        >
                          {getLogIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-500">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {log.source}
                              </Badge>
                            </div>
                            <p className="text-sm text-white">{log.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
