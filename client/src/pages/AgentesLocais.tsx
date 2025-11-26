/**
 * PÁGINA DE CONTROLE DE AGENTES LOCAIS
 * ======================================
 * 
 * Interface avançada para gerenciar agentes locais instalados nos computadores dos usuários.
 * 
 * Funcionalidades:
 * - Dashboard com agentes conectados em tempo real
 * - Envio de comandos e visualização de respostas
 * - Captura de screenshots do desktop
 * - Histórico de execuções
 * - Configuração de permissões
 * - Métricas e estatísticas
 * - Execução de skills Python
 * - Integração com Obsidian
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Monitor,
  Activity,
  Terminal,
  Image as ImageIcon,
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  FileText,
  Code,
  Eye,
  Download,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Agente {
  id: number;
  idAgente: string;
  sistema: any;
  permissoes: any;
  status: string;
  conectadoEm: Date;
  ultimoHeartbeat: Date;
}

export default function AgentesLocais() {
  const [agentesSelecionado, setAgenteSelecionado] = useState<string | null>(null);
  const [comandoCustom, setComandoCustom] = useState("");
  const [parametrosCustom, setParametrosCustom] = useState("{}");
  const [screenshotAtual, setScreenshotAtual] = useState<string | null>(null);

  // Queries
  const { data: agentes, refetch: refetchAgentes, isLoading } = trpc.agenteLocal.listar.useQuery(undefined, {
    staleTime: 10000, // Considerar dados frescos por 10 segundos
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });
  
  const { data: agentesConectados } = trpc.agenteLocal.listarConectados.useQuery(undefined, {
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    enabled: false, // Desabilitado por enquanto, não está sendo usado
  });

  // Usar useMemo para evitar re-renders desnecessários
  const agenteAtual = useMemo(() => {
    return agentes?.find(a => a.idAgente === agentesSelecionado);
  }, [agentes, agentesSelecionado]);

  // Mutations
  const enviarComandoMutation = trpc.agenteLocal.enviarComando.useMutation({
    onSuccess: (data) => {
      if (data.sucesso) {
        toast.success("Comando executado com sucesso!");
      } else {
        toast.error(`Erro: ${data.erro}`);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao enviar comando: ${error.message}`);
    },
  });

  const capturarTelaMutation = trpc.agenteLocal.capturarTela.useMutation({
    onSuccess: (data) => {
      if (data.sucesso) {
        setScreenshotAtual(data.screenshot || null);
        toast.success("Screenshot capturado!");
      } else {
        toast.error(`Erro: ${data.erro}`);
      }
    },
  });

  const pingMutation = trpc.agenteLocal.ping.useMutation({
    onSuccess: (data) => {
      if (data.sucesso) {
        toast.success("Agente respondeu: Pong!");
      } else {
        toast.error(`Erro: ${data.erro}`);
      }
    },
  });

  const infoSistemaMutation = trpc.agenteLocal.infoSistema.useMutation({
    onSuccess: (data) => {
      if (data.sucesso) {
        toast.success("Informações do sistema obtidas!");
        console.log(data.info);
      } else {
        toast.error(`Erro: ${data.erro}`);
      }
    },
  });

  // Selecionar primeiro agente automaticamente
  useEffect(() => {
    if (agentes && agentes.length > 0 && !agentesSelecionado) {
      setAgenteSelecionado(agentes[0].idAgente);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentes]); // Remover agentesSelecionado das dependências para evitar loop infinito

  const handleEnviarComando = () => {
    if (!agentesSelecionado) {
      toast.error("Selecione um agente");
      return;
    }

    try {
      const parametros = JSON.parse(parametrosCustom);
      enviarComandoMutation.mutate({
        idAgente: agentesSelecionado,
        comando: comandoCustom,
        parametros,
      });
    } catch (error) {
      toast.error("Parâmetros JSON inválidos");
    }
  };

  const handleCapturarTela = () => {
    if (!agentesSelecionado) {
      toast.error("Selecione um agente");
      return;
    }

    capturarTelaMutation.mutate({
      idAgente: agentesSelecionado,
    });
  };

  const handlePing = () => {
    if (!agentesSelecionado) {
      toast.error("Selecione um agente");
      return;
    }

    pingMutation.mutate({
      idAgente: agentesSelecionado,
    });
  };

  const handleInfoSistema = () => {
    if (!agentesSelecionado) {
      toast.error("Selecione um agente");
      return;
    }

    infoSistemaMutation.mutate({
      idAgente: agentesSelecionado,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "conectado":
        return <Badge className="bg-green-500"><Wifi className="w-3 h-3 mr-1" /> Online</Badge>;
      case "desconectado":
        return <Badge variant="secondary"><WifiOff className="w-3 h-3 mr-1" /> Offline</Badge>;
      case "erro":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Carregando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 Agentes Locais
            </h1>
            <p className="text-gray-600 mt-2">
              Sistema Híbrido Nuvem + Local - Controle total do desktop
            </p>
          </div>
          <Button onClick={() => refetchAgentes()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Dashboard de Agentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Monitor className="w-4 h-4 mr-2 text-purple-600" />
                Total de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{agentes?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Registrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2 text-green-600" />
                Agentes Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {agentesConectados?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Conectados agora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                Última Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {agenteAtual?.ultimoHeartbeat
                  ? new Date(agenteAtual.ultimoHeartbeat).toLocaleString("pt-BR")
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Heartbeat mais recente</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Agentes Disponíveis
            </CardTitle>
            <CardDescription>
              Selecione um agente para visualizar detalhes e enviar comandos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentes && agentes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentes.map((agente) => (
                  <Card
                    key={agente.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      agentesSelecionado === agente.idAgente
                        ? "ring-2 ring-purple-600 bg-purple-50"
                        : ""
                    }`}
                    onClick={() => setAgenteSelecionado(agente.idAgente)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium truncate">
                          {agente.sistema?.hostname || agente.idAgente}
                        </CardTitle>
                        {getStatusBadge(agente.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center text-gray-600">
                          <Cpu className="w-3 h-3 mr-2" />
                          {agente.sistema?.os} {agente.sistema?.release}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-3 h-3 mr-2" />
                          {new Date(agente.ultimoHeartbeat).toLocaleTimeString("pt-BR")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">Nenhum agente conectado</p>
                <p className="text-sm text-gray-400">
                  Instale o agente local no seu computador para começar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel de Controle */}
        {agentesSelecionado && agenteAtual && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="w-5 h-5 mr-2" />
                Painel de Controle - {agenteAtual.sistema?.hostname}
              </CardTitle>
              <CardDescription>
                Envie comandos e visualize resultados em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="comandos">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="comandos">Comandos</TabsTrigger>
                  <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
                  <TabsTrigger value="sistema">Sistema</TabsTrigger>
                  <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                </TabsList>

                {/* Tab: Comandos */}
                <TabsContent value="comandos" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={handlePing}
                      variant="outline"
                      disabled={pingMutation.isPending}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Ping
                    </Button>
                    <Button
                      onClick={handleCapturarTela}
                      variant="outline"
                      disabled={capturarTelaMutation.isPending}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Capturar Tela
                    </Button>
                    <Button
                      onClick={handleInfoSistema}
                      variant="outline"
                      disabled={infoSistemaMutation.isPending}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      Info Sistema
                    </Button>
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Listar Processos
                    </Button>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label>Comando Customizado</Label>
                    <Input
                      placeholder="Ex: desktop_capture, status, ping..."
                      value={comandoCustom}
                      onChange={(e) => setComandoCustom(e.target.value)}
                    />
                    <Label>Parâmetros (JSON)</Label>
                    <Textarea
                      placeholder='{"chave": "valor"}'
                      value={parametrosCustom}
                      onChange={(e) => setParametrosCustom(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleEnviarComando}
                      disabled={enviarComandoMutation.isPending}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Executar Comando
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab: Screenshot */}
                <TabsContent value="screenshot" className="space-y-4">
                  {screenshotAtual ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Screenshot Capturado</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = `data:image/png;base64,${screenshotAtual}`;
                            link.download = `screenshot-${Date.now()}.png`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                      <img
                        src={`data:image/png;base64,${screenshotAtual}`}
                        alt="Screenshot"
                        className="w-full rounded-lg border shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">Nenhum screenshot capturado</p>
                      <Button onClick={handleCapturarTela}>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Capturar Agora
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Sistema */}
                <TabsContent value="sistema" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Sistema Operacional</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">
                          {agenteAtual.sistema?.os} {agenteAtual.sistema?.release}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Hostname</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">
                          {agenteAtual.sistema?.hostname || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Python</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-mono">
                          {agenteAtual.sistema?.python || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {getStatusBadge(agenteAtual.status)}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Tab: Permissões */}
                <TabsContent value="permissoes" className="space-y-4">
                  <div className="space-y-4">
                    {agenteAtual.permissoes &&
                      Object.entries(agenteAtual.permissoes).map(([chave, valor]) => (
                        <div
                          key={chave}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <Label className="font-medium">{chave}</Label>
                            <p className="text-sm text-gray-500">
                              {chave === "desktop_capture" && "Permite capturar screenshots"}
                              {chave === "executar_scripts" && "Permite executar scripts Python"}
                              {chave === "acessar_obsidian" && "Permite criar notas no Obsidian"}
                              {chave === "controlar_mouse" && "Permite controlar o mouse"}
                              {chave === "controlar_teclado" && "Permite controlar o teclado"}
                            </p>
                          </div>
                          <Switch checked={valor as boolean} disabled />
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
