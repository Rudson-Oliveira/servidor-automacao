import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Activity,
  Terminal,
  Monitor,
  Camera,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Play,
  X,
  Download,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function DesktopControlPro() {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const { data: agents, refetch: refetchAgents } = trpc.desktopControl.listAgents.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? 3000 : false,
      staleTime: 2000,
    }
  );

  const { data: stats } = trpc.desktopControl.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 3000,
  });

  const { data: commands } = trpc.desktopControl.listCommands.useQuery(
    { agentId: selectedAgent || 0, limit: 50 },
    {
      enabled: !!selectedAgent,
      refetchInterval: autoRefresh ? 2000 : false,
      staleTime: 1000,
    }
  );

  const { data: screenshots } = trpc.desktopControl.listScreenshots.useQuery(
    { agentId: selectedAgent || 0, limit: 10 },
    {
      enabled: !!selectedAgent,
      refetchInterval: autoRefresh ? 5000 : false,
    }
  );

  // Mutations
  const sendCommandMutation = trpc.desktopControl.sendCommand.useMutation({
    onSuccess: (data) => {
      toast.success(`Comando #${data.commandId} enviado!`);
      setCommandInput("");
      addTerminalOutput(`> Comando enviado: ${commandInput}`);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
      addTerminalOutput(`> ERRO: ${error.message}`);
    },
  });

  const addTerminalOutput = useCallback((line: string) => {
    setTerminalOutput((prev) => [...prev.slice(-100), line]);
  }, []);

  const handleSendCommand = () => {
    if (!selectedAgent || !commandInput.trim()) {
      toast.error("Selecione um agent e digite um comando");
      return;
    }

    sendCommandMutation.mutate({
      agentId: selectedAgent,
      commandType: "shell",
      commandData: { command: commandInput },
    });
  };

  const handleCaptureScreenshot = () => {
    if (!selectedAgent) {
      toast.error("Selecione um agent");
      return;
    }

    sendCommandMutation.mutate({
      agentId: selectedAgent,
      commandType: "screenshot",
      commandData: { format: "PNG", quality: 90 },
    });

    toast.success("Capturando screenshot...");
  };

  const selectedAgentData = agents?.find((a) => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🖥️ Desktop Control Pro
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Controle remoto profissional de desktops
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              Auto-Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetchAgents()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Agents Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {stats?.agents?.online || 0}
              </span>
              <Activity className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Comandos Executados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {stats?.commands?.total || 0}
              </span>
              <Terminal className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-purple-600">
                {stats?.commands?.successRate || 0}%
              </span>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Screenshots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600">
                {screenshots?.length || 0}
              </span>
              <Camera className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Agents Conectados
            </CardTitle>
            <CardDescription>
              {agents?.length || 0} agent(s) disponível(is)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {agents?.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAgent === agent.id
                        ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : ""
                    }`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{agent.deviceName}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {agent.id}
                          </p>
                        </div>
                        <Badge
                          variant={agent.status === "online" ? "default" : "secondary"}
                          className={
                            agent.status === "online"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {agent.status === "online" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {agent.status}
                        </Badge>
                      </div>

                      <Separator className="my-2" />

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Cpu className="h-3 w-3" />
                          <span>{agent.platform}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Wifi className="h-3 w-3" />
                          <span>{agent.ipAddress || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {agent.lastPing
                              ? new Date(agent.lastPing).toLocaleString("pt-BR")
                              : "Nunca"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!agents || agents.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum agent conectado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {selectedAgentData
                ? `Controlando: ${selectedAgentData.deviceName}`
                : "Selecione um Agent"}
            </CardTitle>
            <CardDescription>
              {selectedAgentData
                ? `${selectedAgentData.platform} • ${selectedAgentData.version}`
                : "Escolha um agent na lista ao lado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAgent ? (
              <Tabs defaultValue="terminal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="terminal">
                    <Terminal className="h-4 w-4 mr-2" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="screenshots">
                    <Camera className="h-4 w-4 mr-2" />
                    Screenshots
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="h-4 w-4 mr-2" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                {/* Terminal Tab */}
                <TabsContent value="terminal" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite um comando (ex: dir, ipconfig, systeminfo)..."
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendCommand();
                      }}
                      className="font-mono"
                    />
                    <Button onClick={handleSendCommand} disabled={!commandInput.trim()}>
                      <Play className="h-4 w-4 mr-2" />
                      Executar
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCaptureScreenshot}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar Tela
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTerminalOutput([])}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>

                  <Card className="bg-slate-950 text-green-400 font-mono text-sm">
                    <CardContent className="p-4">
                      <ScrollArea className="h-[400px]">
                        {terminalOutput.map((line, i) => (
                          <div key={i} className="mb-1">
                            {line}
                          </div>
                        ))}
                        {terminalOutput.length === 0 && (
                          <div className="text-slate-500">
                            Terminal pronto. Digite um comando acima.
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Screenshots Tab */}
                <TabsContent value="screenshots">
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-2 gap-4">
                      {screenshots?.map((screenshot) => (
                        <Card key={screenshot.id} className="overflow-hidden">
                          <img
                            src={screenshot.imageUrl}
                            alt="Screenshot"
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(screenshot.imageUrl, "_blank")}
                          />
                          <CardContent className="p-3">
                            <p className="text-xs text-slate-500">
                              {new Date(screenshot.createdAt).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-slate-400">
                              {screenshot.width}x{screenshot.height} • {screenshot.format}
                            </p>
                          </CardContent>
                        </Card>
                      ))}

                      {(!screenshots || screenshots.length === 0) && (
                        <div className="col-span-2 text-center py-8 text-slate-500">
                          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum screenshot capturado</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {commands?.map((cmd) => (
                        <Card key={cmd.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <Badge
                                  variant={
                                    cmd.status === "completed"
                                      ? "default"
                                      : cmd.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="mb-2"
                                >
                                  {cmd.status}
                                </Badge>
                                <p className="text-sm font-mono">
                                  {cmd.commandType}:{" "}
                                  {JSON.stringify(cmd.commandData).substring(0, 100)}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500">
                                #{cmd.id}
                              </span>
                            </div>

                            <Separator className="my-2" />

                            <div className="text-xs space-y-1">
                              <p className="text-slate-600 dark:text-slate-400">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {cmd.sentAt
                                  ? new Date(cmd.sentAt).toLocaleString("pt-BR")
                                  : "Pendente"}
                              </p>
                              {cmd.executionTimeMs && (
                                <p className="text-slate-600 dark:text-slate-400">
                                  <Zap className="h-3 w-3 inline mr-1" />
                                  {cmd.executionTimeMs}ms
                                </p>
                              )}
                            </div>

                            {cmd.result && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-700">
                                  Ver resultado
                                </summary>
                                <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(cmd.result, null, 2)}
                                </pre>
                              </details>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {(!commands || commands.length === 0) && (
                        <div className="text-center py-8 text-slate-500">
                          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum comando executado</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
                <Monitor className="h-24 w-24 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum Agent Selecionado</h3>
                <p className="text-sm text-center max-w-md">
                  Selecione um agent na lista ao lado para começar a controlar remotamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
