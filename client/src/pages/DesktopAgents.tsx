import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Download, Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DesktopAgents() {
  const { user, loading: authLoading } = useAuth();
  const [deviceName, setDeviceName] = useState("");
  const [platform, setPlatform] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generatedAgentId, setGeneratedAgentId] = useState<number | null>(null);

  // Query para listar agents
  const { data: agents, isLoading: loadingAgents, refetch: refetchAgents } = trpc.desktopControl.listAgents.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 15000, // Atualizar a cada 15 segundos (reduzido de 5s)
    staleTime: 10000,
    refetchOnWindowFocus: false, // Desabilitar refetch ao focar janela
  });

  // Mutation para criar agent
  const createAgentMutation = trpc.desktopControl.createAgent.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setGeneratedToken(data.agent.token);
      setGeneratedAgentId(data.agent.id);
      setShowTokenDialog(true);
      setDeviceName("");
      setPlatform("");
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Erro ao criar agent: ${error.message}`);
    },
  });

  const handleCreateAgent = () => {
    if (!deviceName.trim()) {
      toast.error("Nome do dispositivo é obrigatório");
      return;
    }

    createAgentMutation.mutate({
      deviceName: deviceName.trim(),
      platform: platform.trim() || undefined,
      version: "1.0.0",
    });
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success("Token copiado para área de transferência!");
    }
  };

  const copyConfig = () => {
    if (!generatedToken) return;

    const config = {
      server_url: `wss://${window.location.host.replace('3000', '3001')}`,
      token: generatedToken,
      device_name: deviceName || "Desktop Agent",
      platform: platform || "Windows 11",
      version: "1.0.0",
    };

    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("Configuração copiada! Cole no arquivo config.json");
  };

  const downloadConfigFile = () => {
    if (!generatedToken) return;

    const config = {
      server_url: `wss://${window.location.host.replace('3000', '3001')}`,
      token: generatedToken,
      device_name: deviceName || "Desktop Agent",
      platform: platform || "Windows 11",
      version: "1.0.0",
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Arquivo config.json baixado!");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para gerenciar seus Desktop Agents</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Desktop Agents</h1>
        <p className="text-muted-foreground">
          Crie e gerencie agents para controle remoto de desktops
        </p>
      </div>

      {/* Criar Novo Agent */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Novo Agent
          </CardTitle>
          <CardDescription>
            Gere um token de autenticação para conectar um novo dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="deviceName">Nome do Dispositivo *</Label>
              <Input
                id="deviceName"
                placeholder="Ex: Meu PC Windows"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform">Plataforma (opcional)</Label>
              <Input
                id="platform"
                placeholder="Ex: Windows 11, Linux Ubuntu, macOS"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateAgent}
              disabled={createAgentMutation.isPending || !deviceName.trim()}
              className="w-full"
            >
              {createAgentMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Token...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Token e Criar Agent
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agents Cadastrados</CardTitle>
              <CardDescription>
                {agents?.length || 0} agent(s) cadastrado(s) • {agents?.filter((a) => a.isOnline).length || 0} online
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchAgents()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAgents ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : agents && agents.length > 0 ? (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        agent.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold">{agent.deviceName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {agent.platform} • v{agent.version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agent.isOnline
                          ? "Online"
                          : `Offline há ${Math.floor(agent.timeSinceLastPing / 60)}min`}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {agent.id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Nenhum agent cadastrado. Crie um novo agent acima para começar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog com Token Gerado */}
      {showTokenDialog && generatedToken && (
        <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🎉 Agent Criado com Sucesso!</DialogTitle>
              <DialogDescription>
                Copie o token abaixo e configure no seu Desktop Agent
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="token" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="token">Token</TabsTrigger>
                <TabsTrigger value="config">config.json</TabsTrigger>
                <TabsTrigger value="instructions">Instruções</TabsTrigger>
              </TabsList>

              <TabsContent value="token" className="space-y-4">
                <div>
                  <Label>Token de Autenticação (64 caracteres)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={generatedToken} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyToken}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    ⚠️ <strong>Importante:</strong> Guarde este token em local seguro. Ele não será exibido novamente.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div>
                  <Label>Arquivo config.json Completo</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(
                      {
                        server_url: `wss://${window.location.host.replace('3000', '3001')}`,
                        token: generatedToken,
                        device_name: deviceName || "Desktop Agent",
                        platform: platform || "Windows 11",
                        version: "1.0.0",
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyConfig} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Configuração
                  </Button>
                  <Button onClick={downloadConfigFile} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar config.json
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Passo 1:</strong> Baixe o Desktop Agent em{" "}
                      <a href="/download-agent" className="text-primary underline" target="_blank">
                        /download-agent
                      </a>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>Passo 2:</strong> Copie o token acima ou baixe o arquivo config.json
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>Passo 3:</strong> Cole o config.json no diretório do Desktop Agent
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>Passo 4:</strong> Execute o Desktop Agent e ele conectará automaticamente
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
