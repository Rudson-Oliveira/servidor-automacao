import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Monitor, 
  Plus, 
  Power, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Activity,
  Terminal
} from "lucide-react";

export default function AgentesLocais() {
  const { user, loading: authLoading } = useAuth();
  const [nomeToken, setNomeToken] = useState("");
  const [comandoAgente, setComandoAgente] = useState("");
  const [comandoParams, setComandoParams] = useState("{}");
  const [agenteSelecionado, setAgenteSelecionado] = useState("");

  // Queries
  const { data: tokens, refetch: refetchTokens } = trpc.agente.listarTokens.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const { data: agentes, refetch: refetchAgentes } = trpc.agente.listarAgentes.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000,
    staleTime: 3000,
    refetchOnWindowFocus: false,
  });

  const { data: estatisticas } = trpc.agente.estatisticas.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const { data: historico } = trpc.agente.historico.useQuery(
    { limite: 20 },
    {
      enabled: !!user,
      refetchInterval: 5000,
      staleTime: 3000,
      refetchOnWindowFocus: false,
    }
  );

  // Mutations
  const gerarToken = trpc.agente.gerarToken.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setNomeToken("");
      refetchTokens();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const desativarToken = trpc.agente.desativarToken.useMutation({
    onSuccess: () => {
      toast.success("Token desativado");
      refetchTokens();
    },
  });

  const enviarComando = trpc.agente.enviarComando.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setComandoAgente("");
      setComandoParams("{}");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const desconectarAgente = trpc.agente.desconectarAgente.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchAgentes();
    },
  });

  const handleGerarToken = () => {
    if (!nomeToken.trim()) {
      toast.error("Digite um nome para o token");
      return;
    }
    gerarToken.mutate({ nome: nomeToken });
  };

  const handleEnviarComando = () => {
    if (!agenteSelecionado) {
      toast.error("Selecione um agente");
      return;
    }
    if (!comandoAgente.trim()) {
      toast.error("Digite um comando");
      return;
    }

    try {
      const params = JSON.parse(comandoParams);
      enviarComando.mutate({
        agenteId: agenteSelecionado,
        comando: comandoAgente,
        parametros: params,
      });
    } catch (error) {
      toast.error("Parâmetros JSON inválidos");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Faça login para acessar os agentes locais</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Monitor className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agentes Locais</h1>
            <p className="text-muted-foreground">
              Controle remoto de aplicações no seu computador
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Execuções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {estatisticas.taxaSucesso}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.duracaoMediaMs}ms</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agentes Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {agentes?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="agentes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agentes">
              <Activity className="h-4 w-4 mr-2" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="comandos">
              <Terminal className="h-4 w-4 mr-2" />
              Comandos
            </TabsTrigger>
            <TabsTrigger value="tokens">
              <Plus className="h-4 w-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="historico">
              <Clock className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Agentes */}
          <TabsContent value="agentes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agentes Conectados</CardTitle>
                <CardDescription>
                  Agentes ativos e prontos para receber comandos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!agentes || agentes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum agente conectado</p>
                    <p className="text-sm mt-1">
                      Instale e execute o agente local no seu computador
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentes.map((agente: any) => (
                      <Card key={agente.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{agente.name}</h3>
                                <Badge variant="default">Online</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                ID: {agente.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {agente.platform} • {agente.hostname} • v{agente.version}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Conectado há{" "}
                                {Math.floor((Date.now() - agente.connectedAt) / 1000)}s
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => desconectarAgente.mutate({ agenteId: agente.id })}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Comandos */}
          <TabsContent value="comandos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Comando</CardTitle>
                <CardDescription>Execute comandos nos agentes conectados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Agente</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={agenteSelecionado}
                    onChange={(e) => setAgenteSelecionado(e.target.value)}
                  >
                    <option value="">Selecione um agente</option>
                    {agentes?.map((agente: any) => (
                      <option key={agente.id} value={agente.id}>
                        {agente.name} ({agente.platform})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Comando</Label>
                  <Input
                    placeholder="Ex: shell, obsidian.criar_nota, sistema.info"
                    value={comandoAgente}
                    onChange={(e) => setComandoAgente(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Parâmetros (JSON)</Label>
                  <Textarea
                    placeholder='{"cmd": "ls -la"}'
                    value={comandoParams}
                    onChange={(e) => setComandoParams(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleEnviarComando}
                  disabled={enviarComando.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Comando
                </Button>

                <div className="mt-4 p-4 bg-muted rounded-md space-y-2 text-sm">
                  <p className="font-semibold">Comandos Disponíveis:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <code>shell</code> - Executar comando shell
                    </li>
                    <li>
                      <code>obsidian.criar_nota</code> - Criar nota no Obsidian
                    </li>
                    <li>
                      <code>obsidian.listar_notas</code> - Listar notas
                    </li>
                    <li>
                      <code>obsidian.ler_nota</code> - Ler conteúdo de nota
                    </li>
                    <li>
                      <code>vscode.abrir_arquivo</code> - Abrir arquivo no VSCode
                    </li>
                    <li>
                      <code>sistema.info</code> - Informações do sistema
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tokens */}
          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Novo Token</CardTitle>
                <CardDescription>
                  Tokens são necessários para autenticar agentes locais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Agente</Label>
                  <Input
                    placeholder="Ex: Meu Desktop, Notebook Trabalho"
                    value={nomeToken}
                    onChange={(e) => setNomeToken(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleGerarToken}
                  disabled={gerarToken.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Token
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tokens Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                {!tokens || tokens.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum token gerado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tokens.map((token: any) => (
                      <Card key={token.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{token.nome}</h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {token.tokenParcial}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Criado em {new Date(token.criadoEm).toLocaleString()}
                              </p>
                              {token.ultimoUso && (
                                <p className="text-xs text-muted-foreground">
                                  Último uso: {new Date(token.ultimoUso).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={token.ativo ? "default" : "secondary"}>
                                {token.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                              {token.ativo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => desativarToken.mutate({ id: token.id })}
                                >
                                  Desativar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>Últimas 20 execuções</CardDescription>
              </CardHeader>
              <CardContent>
                {!historico || historico.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma execução registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historico.map((exec: any) => (
                      <Card key={exec.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-semibold">{exec.comando}</code>
                                {exec.status === "sucesso" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {exec.agenteNome} • {exec.duracaoMs}ms •{" "}
                                {new Date(exec.executadoEm).toLocaleString()}
                              </p>
                              {exec.erro && (
                                <p className="text-xs text-red-600 mt-1">{exec.erro}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
