import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function CircuitBreakers() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Queries
  const { data: breakers, isLoading, refetch } = trpc.circuitBreaker.listar.useQuery(undefined, {
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: saudeGeral } = trpc.circuitBreaker.saudeGeral.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: detalhes } = trpc.circuitBreaker.detalhes.useQuery(
    { serviceName: selectedService! },
    { enabled: !!selectedService, refetchInterval: 3000 }
  );

  // Mutations
  const forcarAbertura = trpc.circuitBreaker.forcarAbertura.useMutation({
    onSuccess: () => {
      toast.success("Circuit breaker aberto com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao abrir circuit breaker: ${error.message}`);
    },
  });

  const forcarFechamento = trpc.circuitBreaker.forcarFechamento.useMutation({
    onSuccess: () => {
      toast.success("Circuit breaker fechado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao fechar circuit breaker: ${error.message}`);
    },
  });

  const resetar = trpc.circuitBreaker.reset.useMutation({
    onSuccess: () => {
      toast.success("Circuit breaker resetado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao resetar circuit breaker: ${error.message}`);
    },
  });

  // Helper functions
  const getStateColor = (state: string) => {
    switch (state) {
      case "CLOSED":
        return "bg-green-500";
      case "OPEN":
        return "bg-red-500";
      case "HALF_OPEN":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "CLOSED":
        return <CheckCircle2 className="h-5 w-5" />;
      case "OPEN":
        return <XCircle className="h-5 w-5" />;
      case "HALF_OPEN":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Circuit Breakers</h1>
            <p className="text-muted-foreground">Monitoramento de isolamento de serviços</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Saúde Geral */}
        {saudeGeral && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{saudeGeral.totalBreakers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Saudáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{saudeGeral.healthy}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Não Saudáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{saudeGeral.unhealthy}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Isolados (OPEN)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{saudeGeral.open}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recomendações */}
        {saudeGeral && saudeGeral.recomendacoes.length > 0 && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {saudeGeral.recomendacoes.map((rec, index) => (
                  <li key={index} className="text-sm">
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Lista de Circuit Breakers */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Monitorados</CardTitle>
            <CardDescription>
              {breakers?.length || 0} circuit breaker(s) ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!breakers || breakers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum circuit breaker ativo
              </div>
            ) : (
              <div className="space-y-4">
                {breakers.map((breaker) => (
                  <Card
                    key={breaker.serviceName}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedService === breaker.serviceName ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedService(breaker.serviceName)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${getStateColor(breaker.state)}`}>
                              {getStateIcon(breaker.state)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{breaker.serviceName}</h3>
                              <Badge variant="outline" className="mt-1">
                                {breaker.state}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Taxa de Falha</p>
                              <p className="font-semibold flex items-center gap-1">
                                {breaker.metrics.failureRate.toFixed(1)}%
                                {breaker.metrics.failureRate > 50 ? (
                                  <TrendingUp className="h-4 w-4 text-red-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Total de Chamadas</p>
                              <p className="font-semibold">{breaker.totalCalls}</p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Tempo no Estado</p>
                              <p className="font-semibold">
                                {formatDuration(breaker.metrics.timeInCurrentState)}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <Badge variant={breaker.metrics.isHealthy ? "default" : "destructive"}>
                                {breaker.metrics.isHealthy ? "Saudável" : "Não Saudável"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {breaker.state === "OPEN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                forcarFechamento.mutate({
                                  serviceName: breaker.serviceName,
                                  reason: "Fechamento manual via UI",
                                });
                              }}
                            >
                              Fechar
                            </Button>
                          )}

                          {breaker.state === "CLOSED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                forcarAbertura.mutate({
                                  serviceName: breaker.serviceName,
                                  reason: "Abertura manual via UI",
                                });
                              }}
                            >
                              Abrir
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetar.mutate({ serviceName: breaker.serviceName });
                            }}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhes do Serviço Selecionado */}
        {selectedService && detalhes && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes: {selectedService}</CardTitle>
              <CardDescription>Histórico de transições de estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Falhas Consecutivas</p>
                    <p className="text-2xl font-bold">{detalhes.state.failureCount}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Sucessos Consecutivos</p>
                    <p className="text-2xl font-bold">{detalhes.state.successCount}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total de Falhas</p>
                    <p className="text-2xl font-bold">{detalhes.state.totalFailures}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total de Sucessos</p>
                    <p className="text-2xl font-bold">{detalhes.state.totalSuccesses}</p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Última Falha</p>
                    <p className="text-sm font-mono">
                      {formatTimestamp(detalhes.state.lastFailureTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Último Sucesso</p>
                    <p className="text-sm font-mono">
                      {formatTimestamp(detalhes.state.lastSuccessTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Próxima Tentativa</p>
                    <p className="text-sm font-mono">
                      {formatTimestamp(detalhes.state.nextAttemptTime)}
                    </p>
                  </div>
                </div>

                {/* Histórico */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Histórico de Transições</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detalhes.history.slice().reverse().map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className={`p-1.5 rounded-full ${getStateColor(entry.state)}`}>
                          {getStateIcon(entry.state)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{entry.state}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{entry.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
