import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Monitor, Terminal, Camera, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import LogsViewer from "@/components/LogsViewer";

/**
 * Dashboard principal do Desktop Control System
 * 
 * Funcionalidades:
 * - Lista de agents conectados (online/offline)
 * - Envio de comandos (shell e screenshot)
 * - Galeria de screenshots com lightbox
 * - Estatísticas em tempo real
 */

export default function DesktopControl() {
  // Estados
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [shellCommand, setShellCommand] = useState("");
  const [screenshotFormat, setScreenshotFormat] = useState<"png" | "jpeg">("png");
  const [screenshotQuality, setScreenshotQuality] = useState(85);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Queries tRPC
  const { data: agents = [], refetch: refetchAgents } = trpc.desktopControl.listAgents.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh a cada 5s
    staleTime: 3000,
  });

  const { data: stats } = trpc.desktopControl.getStats.useQuery(undefined, {
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: screenshots = [], refetch: refetchScreenshots } = trpc.desktopControl.listScreenshots.useQuery(
    { limit: 20 },
    {
      refetchInterval: 10000, // Auto-refresh a cada 10s
      staleTime: 5000,
    }
  );

  // Mutations
  const sendCommandMutation = trpc.desktopControl.sendCommand.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShellCommand("");
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar comando: ${error.message}`);
    },
  });

  // Handlers
  const handleSendShellCommand = useCallback(() => {
    if (!selectedAgent) {
      toast.error("Selecione um agent primeiro");
      return;
    }

    if (!shellCommand.trim()) {
      toast.error("Digite um comando shell");
      return;
    }

    sendCommandMutation.mutate({
      agentId: selectedAgent,
      commandType: "shell",
      commandData: {
        command: shellCommand,
        timeout: 30,
      },
    });
  }, [selectedAgent, shellCommand, sendCommandMutation]);

  const handleCaptureScreenshot = useCallback(() => {
    if (!selectedAgent) {
      toast.error("Selecione um agent primeiro");
      return;
    }

    sendCommandMutation.mutate({
      agentId: selectedAgent,
      commandType: "screenshot",
      commandData: {
        format: screenshotFormat,
        quality: screenshotQuality,
      },
    });
  }, [selectedAgent, screenshotFormat, screenshotQuality, sendCommandMutation]);

  // Agent selecionado
  const selectedAgentData = useMemo(() => {
    return agents.find((a) => a.id === selectedAgent);
  }, [agents, selectedAgent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Desktop Control System</h1>
          <p className="text-muted-foreground">
            Gerencie agents remotos, execute comandos e capture screenshots
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agents Online</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agents.online}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.agents.offline} offline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comandos Executados</CardTitle>
                <Terminal className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.commands.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.commands.failed} falharam
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.commands.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.commands.total} comandos total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
                <Camera className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.screenshots.total}</div>
                <p className="text-xs text-muted-foreground">
                  Capturados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="commands">Enviar Comandos</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Tab: Agents */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agents Conectados</CardTitle>
                <CardDescription>
                  Lista de agents disponíveis para controle remoto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum agent conectado</p>
                    <p className="text-sm mt-2">
                      Inicie o Desktop Agent no computador que deseja controlar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${
                          selectedAgent === agent.id ? "border-primary bg-accent" : ""
                        }`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Monitor className="h-5 w-5" />
                            <div>
                              <div className="font-semibold">{agent.deviceName}</div>
                              <div className="text-sm text-muted-foreground">
                                {agent.platform} • v{agent.version}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {agent.isOnline ? (
                              <Badge className="bg-green-500">Online</Badge>
                            ) : (
                              <Badge variant="outline">Offline</Badge>
                            )}
                            {agent.lastPing && (
                              <span className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {Math.floor(agent.timeSinceLastPing / 60)}m atrás
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Enviar Comandos */}
          <TabsContent value="commands" className="space-y-4">
            {!selectedAgent ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um agent na aba "Agents" primeiro</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Agent Selecionado */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Selecionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">{selectedAgentData?.deviceName}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedAgentData?.platform} • {selectedAgentData?.ipAddress}
                        </div>
                      </div>
                      {selectedAgentData?.isOnline ? (
                        <Badge className="bg-green-500 ml-auto">Online</Badge>
                      ) : (
                        <Badge variant="outline" className="ml-auto">Offline</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Comando Shell */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Executar Comando Shell
                    </CardTitle>
                    <CardDescription>
                      Execute comandos shell no computador remoto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="shell-command">Comando</Label>
                      <Input
                        id="shell-command"
                        placeholder='echo "Hello World"'
                        value={shellCommand}
                        onChange={(e) => setShellCommand(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendShellCommand();
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pressione Enter para enviar
                      </p>
                    </div>
                    <Button
                      onClick={handleSendShellCommand}
                      disabled={sendCommandMutation.isPending || !shellCommand.trim()}
                      className="w-full"
                    >
                      {sendCommandMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Terminal className="mr-2 h-4 w-4" />
                          Executar Comando
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Captura de Screenshot */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Capturar Screenshot
                    </CardTitle>
                    <CardDescription>
                      Capture uma imagem da tela do computador remoto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="screenshot-format">Formato</Label>
                        <Select
                          value={screenshotFormat}
                          onValueChange={(value) => setScreenshotFormat(value as "png" | "jpeg")}
                        >
                          <SelectTrigger id="screenshot-format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG (sem perda)</SelectItem>
                            <SelectItem value="jpeg">JPEG (comprimido)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="screenshot-quality">
                          Qualidade {screenshotFormat === "jpeg" ? `(${screenshotQuality}%)` : ""}
                        </Label>
                        <Input
                          id="screenshot-quality"
                          type="number"
                          min="1"
                          max="100"
                          value={screenshotQuality}
                          onChange={(e) => setScreenshotQuality(Number(e.target.value))}
                          disabled={screenshotFormat === "png"}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCaptureScreenshot}
                      disabled={sendCommandMutation.isPending}
                      className="w-full"
                    >
                      {sendCommandMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Capturando...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Capturar Screenshot
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab: Screenshots */}
          <TabsContent value="screenshots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Galeria de Screenshots</CardTitle>
                <CardDescription>
                  Screenshots capturados dos agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {screenshots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum screenshot capturado ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {screenshots.map((screenshot) => (
                      <div
                        key={screenshot.id}
                        className="group relative cursor-pointer"
                        onClick={() => setLightboxImage(screenshot.image_url)}
                      >
                        <img
                          src={screenshot.image_url}
                          alt={`Screenshot ${screenshot.id}`}
                          className="w-full h-40 object-cover rounded-lg border hover:border-primary transition-colors"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div className="font-semibold">{screenshot.agentName}</div>
                          <div>{screenshot.width}x{screenshot.height} • {screenshot.format.toUpperCase()}</div>
                          <div>{new Date(screenshot.createdAt).toLocaleString("pt-BR")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Logs */}
          <TabsContent value="logs" className="space-y-4">
            <LogsViewer agentId={selectedAgent || undefined} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Screenshot</DialogTitle>
            <DialogDescription>
              Clique fora da imagem para fechar
            </DialogDescription>
          </DialogHeader>
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Screenshot ampliado"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
