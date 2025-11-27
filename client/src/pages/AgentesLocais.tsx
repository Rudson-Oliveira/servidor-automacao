import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Activity, 
  Monitor, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Copy,
  RefreshCw,
  Zap,
  Download,
  Plus
} from "lucide-react";

export default function AgentesLocais() {
  const [comandoPersonalizado, setComandoPersonalizado] = useState("");
  const [parametrosJson, setParametrosJson] = useState("{}");
  const [agenteSelecionado, setAgenteSelecionado] = useState<string | null>(null);
  const [nomeNovoToken, setNomeNovoToken] = useState("");

  // Queries
  const { data: agentes, refetch: refetchAgentes } = trpc.agente.listarAgentes.useQuery(undefined, {
    refetchInterval: 5000, // Atualizar a cada 5s
  });

  const { data: tokens } = trpc.agente.listarTokens.useQuery();

  const { data: historico } = trpc.agente.historico.useQuery({
    agenteId: agenteSelecionado || undefined,
    limite: 20,
  });

  const { data: estatisticas } = trpc.agente.estatisticas.useQuery();

  // Mutations
  const gerarTokenMutation = trpc.agente.gerarToken.useMutation({
    onSuccess: (data) => {
      toast.success("Token gerado com sucesso!");
      setNomeNovoToken("");
      // Mostrar token em dialog
      navigator.clipboard.writeText(data.token);
      toast.info("Token copiado para área de transferência!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const enviarComandoMutation = trpc.agente.enviarComando.useMutation({
    onSuccess: () => {
      toast.success("Comando enviado!");
      setComandoPersonalizado("");
      setParametrosJson("{}");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const desconectarMutation = trpc.agente.desconectarAgente.useMutation({
    onSuccess: () => {
      toast.success("Agente desconectado");
      refetchAgentes();
    },
  });

  const handleEnviarComando = (agenteId: string, comando: string, params: any = {}) => {
    enviarComandoMutation.mutate({
      agenteId,
      comando,
      parametros: params,
    });
  };

  const handleComandoPersonalizado = () => {
    if (!agenteSelecionado) {
      toast.error("Selecione um agente primeiro");
      return;
    }

    try {
      const params = JSON.parse(parametrosJson);
      handleEnviarComando(agenteSelecionado, comandoPersonalizado, params);
    } catch (e) {
      toast.error("JSON de parâmetros inválido");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "executing":
        return "bg-yellow-500 animate-pulse";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>;
      case "executing":
        return <Badge className="bg-yellow-500">Executando</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Monitor className="w-10 h-10 text-blue-500" />
              Agentes Locais
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Controle remoto de aplicações locais (similar ao Vercept)
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Gerar Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Novo Token</DialogTitle>
                <DialogDescription>
                  Crie um token para autenticar um novo agente local
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Agente</Label>
                  <Input
                    placeholder="Ex: Desktop Casa, Laptop Trabalho"
                    value={nomeNovoToken}
                    onChange={(e) => setNomeNovoToken(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => gerarTokenMutation.mutate({ nome: nomeNovoToken })}
                  disabled={!nomeNovoToken || gerarTokenMutation.isPending}
                  className="w-full"
                >
                  {gerarTokenMutation.isPending ? "Gerando..." : "Gerar Token"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Comandos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Taxa de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{estatisticas.taxaSucesso}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Tempo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{estatisticas.duracaoMediaMs}ms</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Agentes Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {agentes?.filter((a) => a.status === "online").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="agentes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="agentes">Agentes Conectados</TabsTrigger>
            <TabsTrigger value="comandos">Enviar Comandos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          {/* Tab: Agentes */}
          <TabsContent value="agentes" className="space-y-4">
            {!agentes || agentes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Monitor className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum agente conectado</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Instale e execute o agente local no seu computador
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Agente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentes.map((agente) => (
                  <Card key={agente.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(agente.status)}`} />
                          <div>
                            <CardTitle className="text-lg">{agente.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {agente.platform} • v{agente.version}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(agente.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Monitor className="w-4 h-4" />
                          <span>{agente.hostname}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Activity className="w-4 h-4" />
                          <span>{agente.ip}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            Conectado há {Math.round((Date.now() - agente.connectedAt) / 60000)}min
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setAgenteSelecionado(agente.id)}
                        >
                          <Terminal className="w-4 h-4 mr-2" />
                          Comandos
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => desconectarMutation.mutate({ agenteId: agente.id })}
                        >
                          Desconectar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Comandos */}
          <TabsContent value="comandos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Comando Personalizado</CardTitle>
                <CardDescription>
                  Execute comandos diretamente no agente selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Agente</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={agenteSelecionado || ""}
                    onChange={(e) => setAgenteSelecionado(e.target.value)}
                  >
                    <option value="">Selecione um agente</option>
                    {agentes
                      ?.filter((a) => a.status === "online")
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.hostname})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <Label>Comando</Label>
                  <Input
                    placeholder="Ex: shell, obsidian.criar_nota, sistema.info"
                    value={comandoPersonalizado}
                    onChange={(e) => setComandoPersonalizado(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Parâmetros (JSON)</Label>
                  <Textarea
                    placeholder='{"cmd": "echo Hello World"}'
                    value={parametrosJson}
                    onChange={(e) => setParametrosJson(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleComandoPersonalizado}
                  disabled={!agenteSelecionado || !comandoPersonalizado || enviarComandoMutation.isPending}
                  className="w-full gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {enviarComandoMutation.isPending ? "Enviando..." : "Executar Comando"}
                </Button>
              </CardContent>
            </Card>

            {/* Comandos Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Comandos Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      agenteSelecionado &&
                      handleEnviarComando(agenteSelecionado, "sistema.info")
                    }
                    disabled={!agenteSelecionado}
                  >
                    Info do Sistema
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      agenteSelecionado &&
                      handleEnviarComando(agenteSelecionado, "shell", { cmd: "echo Hello" })
                    }
                    disabled={!agenteSelecionado}
                  >
                    Echo Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>Últimas 20 execuções</CardDescription>
              </CardHeader>
              <CardContent>
                {!historico || historico.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhuma execução ainda</p>
                ) : (
                  <div className="space-y-2">
                    {historico.map((exec) => (
                      <div
                        key={exec.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {exec.status === "sucesso" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : exec.status === "erro" ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <div className="font-medium">{exec.comando}</div>
                            <div className="text-xs text-slate-500">
                              {exec.agenteNome} • {exec.duracaoMs}ms
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(exec.executadoEm).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tokens */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>Tokens de Autenticação</CardTitle>
                <CardDescription>Gerencie tokens de acesso dos agentes</CardDescription>
              </CardHeader>
              <CardContent>
                {!tokens || tokens.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhum token gerado</p>
                ) : (
                  <div className="space-y-2">
                    {tokens.map((token) => (
                      <div
                        key={token.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{token.nome}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {token.tokenParcial}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {token.ativo ? (
                            <Badge className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(token.criadoEm).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
