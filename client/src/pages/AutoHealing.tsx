/**
 * DASHBOARD DE AUTO-HEALING
 * ==========================
 * 
 * Interface para monitorar e controlar o sistema de auto-diagnóstico e auto-correção.
 * 
 * Funcionalidades:
 * - Métricas em tempo real (CPU, RAM)
 * - Lista de erros detectados
 * - Correções aplicadas automaticamente
 * - Gráficos de evolução
 * - Controles do monitor
 * - Estatísticas gerais
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Shield,
  Zap,
  Brain,
} from "lucide-react";

export default function AutoHealing() {
  const [monitorAtivo, setMonitorAtivo] = useState(false);

  // Queries
  const { data: metricas, refetch: refetchMetricas } = trpc.autoHealing.metricasAtuais.useQuery(undefined, {
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const { data: estatisticas, refetch: refetchEstatisticas } = trpc.autoHealing.estatisticas.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: erros, refetch: refetchErros } = trpc.autoHealing.errosRecentes.useQuery(
    { limite: 20 },
    { refetchInterval: 10000 }
  );

  // Mutations
  const iniciarMutation = trpc.autoHealing.iniciar.useMutation({
    onSuccess: () => {
      toast.success("Monitor de saúde iniciado!");
      setMonitorAtivo(true);
      refetchEstatisticas();
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar: ${error.message}`);
    },
  });

  const pararMutation = trpc.autoHealing.parar.useMutation({
    onSuccess: () => {
      toast.success("Monitor de saúde parado");
      setMonitorAtivo(false);
      refetchEstatisticas();
    },
    onError: (error) => {
      toast.error(`Erro ao parar: ${error.message}`);
    },
  });

  // Verificar se monitor está ativo
  useEffect(() => {
    if (estatisticas) {
      setMonitorAtivo(estatisticas.running);
    }
  }, [estatisticas]);

  const getSeveridadeBadge = (severidade: string) => {
    switch (severidade) {
      case "critico":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Crítico</Badge>;
      case "alto":
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 mr-1" /> Alto</Badge>;
      case "medio":
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" /> Médio</Badge>;
      case "baixo":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" /> Baixo</Badge>;
      default:
        return <Badge variant="outline">{severidade}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-600" />
              Auto-Healing System
            </h1>
            <p className="text-gray-600 mt-2">
              Sistema inteligente de auto-diagnóstico, auto-correção e auto-evolução
            </p>
          </div>
          <div className="flex gap-2">
            {monitorAtivo ? (
              <Button
                onClick={() => pararMutation.mutate()}
                variant="destructive"
                disabled={pararMutation.isPending}
              >
                <Pause className="w-4 h-4 mr-2" />
                Parar Monitor
              </Button>
            ) : (
              <Button
                onClick={() => iniciarMutation.mutate({ intervaloMs: 30000 })}
                disabled={iniciarMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Monitor
              </Button>
            )}
            <Button onClick={() => {
              refetchMetricas();
              refetchEstatisticas();
              refetchErros();
            }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2 text-green-600" />
                Status do Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {monitorAtivo ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-lg font-bold text-green-600">Ativo</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <span className="text-lg font-bold text-gray-600">Inativo</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Uptime: {estatisticas ? formatUptime(estatisticas.uptime) : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                Erros Detectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas?.totalErros || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {estatisticas?.errosCriticos || 0} críticos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                Correções Aplicadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {estatisticas?.errosCorrigidos || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taxa: {estatisticas?.taxaCorrecao.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                Métricas Coletadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas?.metricasColetadas || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Amostras registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas em Tempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-blue-600" />
                CPU
              </CardTitle>
              <CardDescription>Uso do processador</CardDescription>
            </CardHeader>
            <CardContent>
              {metricas ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uso Atual</span>
                      <span className="text-2xl font-bold">{metricas.cpu.usage.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          metricas.cpu.usage > 80
                            ? "bg-red-500"
                            : metricas.cpu.usage > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(metricas.cpu.usage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Load Average: {metricas.cpu.loadAverage.map(l => l.toFixed(2)).join(", ")}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Aguardando dados...</p>
              )}
            </CardContent>
          </Card>

          {/* Memória */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-purple-600" />
                Memória
              </CardTitle>
              <CardDescription>Uso de RAM</CardDescription>
            </CardHeader>
            <CardContent>
              {metricas ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uso Atual</span>
                      <span className="text-2xl font-bold">{metricas.memoria.porcentagemUso.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all ${
                          metricas.memoria.porcentagemUso > 80
                            ? "bg-red-500"
                            : metricas.memoria.porcentagemUso > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(metricas.memoria.porcentagemUso, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Total: {formatBytes(metricas.memoria.total)}</p>
                    <p>Usada: {formatBytes(metricas.memoria.usada)}</p>
                    <p>Livre: {formatBytes(metricas.memoria.livre)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Aguardando dados...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Erros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-orange-600" />
              Erros Detectados e Correções
            </CardTitle>
            <CardDescription>
              Histórico de erros detectados pelo sistema e correções aplicadas automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {erros && erros.length > 0 ? (
              <div className="space-y-3">
                {erros.map((erro: any, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeveridadeBadge(erro.severidade)}
                          <Badge variant="outline">{erro.tipo}</Badge>
                          {erro.correcao?.sucesso && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Corrigido
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm">{erro.mensagem}</p>
                        {erro.diagnostico && (
                          <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                            <p className="font-medium">Diagnóstico:</p>
                            <p>{erro.diagnostico.causaRaiz}</p>
                            <p className="mt-1">
                              <span className="font-medium">Ação:</span> {erro.diagnostico.acaoRecomendada}
                            </p>
                          </div>
                        )}
                        {erro.correcao && (
                          <div className="mt-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                            <p className="font-medium">Correção Aplicada:</p>
                            <p>{erro.correcao.descricao}</p>
                            <p className="mt-1">
                              Tempo: {erro.correcao.tempoExecucao.toFixed(2)}ms
                            </p>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {new Date(erro.timestamp).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-gray-500 mb-2">Nenhum erro detectado</p>
                <p className="text-sm text-gray-400">
                  O sistema está funcionando perfeitamente! 🎉
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Como Funciona o Auto-Healing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Monitoramento Contínuo</p>
                <p className="text-gray-600">
                  O sistema coleta métricas de CPU, memória e outros recursos a cada 30 segundos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Detecção de Anomalias</p>
                <p className="text-gray-600">
                  Usa análise estatística (baseline + desvio padrão) para identificar comportamentos anormais
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Diagnóstico com IA</p>
                <p className="text-gray-600">
                  LLM analisa o erro, identifica causa raiz e sugere correção
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Auto-Correção</p>
                <p className="text-gray-600">
                  Aplica correções automaticamente (limpeza de cache, otimização, etc)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <p className="font-medium">Aprendizado Contínuo</p>
                <p className="text-gray-600">
                  Sistema aprende com erros passados e melhora suas estratégias de correção
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
