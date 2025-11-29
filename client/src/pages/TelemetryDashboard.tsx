import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, TrendingUp, Zap, RefreshCw, Brain, Shield } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { toast } from "sonner";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const { data: metrics, refetch: refetchMetrics } = trpc.telemetry.getMetrics.useQuery(
    { limit: 50 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: anomalies } = trpc.telemetry.getAnomalies.useQuery(
    { limit: 20 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: predictions } = trpc.telemetry.getPredictions.useQuery(
    { limit: 10 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: patterns } = trpc.telemetry.getPatterns.useQuery(
    { limit: 10 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: stats } = trpc.telemetry.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Preparar dados para gráficos
  const cpuMetrics = metrics?.filter((m) => m.name === "system.cpu") || [];
  const memoryMetrics = metrics?.filter((m) => m.name === "system.memory") || [];

  const metricsChartData = {
    labels: cpuMetrics.map((m) => new Date(m.timestamp).toLocaleTimeString("pt-BR")),
    datasets: [
      {
        label: "CPU (%)",
        data: cpuMetrics.map((m) => parseFloat(m.value)),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Memória (%)",
        data: memoryMetrics.map((m) => parseFloat(m.value)),
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const anomaliesChartData = {
    labels: anomalies?.map((a) => new Date(a.detectedAt).toLocaleTimeString("pt-BR")) || [],
    datasets: [
      {
        label: "Desvio (%)",
        data: anomalies?.map((a) => parseFloat(a.deviation || "0")) || [],
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-8 w-8 text-blue-600" />
              Dashboard de Telemetria
            </h1>
            <p className="text-slate-600 mt-1">
              Monitoramento em tempo real do sistema de auto-evolução
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                refetchMetrics();
                toast.success("Dados atualizados!");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.totalMetrics || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Anomalias Detectadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.totalAnomalies || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requer atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Predições Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.totalPredictions || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Falhas previstas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Padrões Aprendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalPatterns || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Conhecimento acumulado</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="anomalies">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomalias
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <Zap className="h-4 w-4 mr-2" />
              Predições
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <Brain className="h-4 w-4 mr-2" />
              Padrões
            </TabsTrigger>
          </TabsList>

          {/* Tab: Métricas */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance em Tempo Real</CardTitle>
                <CardDescription>CPU e Memória dos últimos 50 registros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <Line data={metricsChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics?.slice(0, 10).map((metric) => {
                const tags = metric.tags as Record<string, string> | null;
                return (
                  <Card key={metric.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                        <Badge variant="secondary">{metric.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Valor:</span>
                          <span className="font-medium">{metric.value} {metric.unit}</span>
                        </div>
                        {tags && (
                          <div className="text-xs text-slate-500">
                            Tags: {JSON.stringify(tags)}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {new Date(metric.timestamp).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Anomalias */}
          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomalias Detectadas</CardTitle>
                <CardDescription>Desvio percentual ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <Bar data={anomaliesChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {anomalies?.map((anomaly) => (
                <Card key={anomaly.id} className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">{anomaly.type}</CardTitle>
                      <Badge variant="destructive">{anomaly.severity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 mb-2">{anomaly.description}</p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div>
                        <strong>Métrica:</strong> {anomaly.metric}
                      </div>
                      <div>
                        <strong>Esperado:</strong> {anomaly.expectedValue} | <strong>Real:</strong> {anomaly.actualValue}
                      </div>
                      <div>
                        <strong>Desvio:</strong> {anomaly.deviation}%
                      </div>
                      <div className="text-xs text-slate-500">
                        Detectado em: {new Date(anomaly.detectedAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Predições */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Predições de Falhas
                </CardTitle>
                <CardDescription>
                  Falhas previstas antes que ocorram - Sistema preventivo ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictions?.map((prediction) => {
                    const indicators = prediction.indicators as Record<string, unknown> | null;
                    const preventiveActions = prediction.preventiveActions as string[] | null;
                    return (
                      <Card key={prediction.id} className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium">
                              {prediction.type}
                            </CardTitle>
                            <Badge
                              variant={
                                parseFloat(prediction.probability) > 80
                                  ? "destructive"
                                  : parseFloat(prediction.probability) > 60
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              Probabilidade: {prediction.probability}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Componente:</strong> {prediction.component}
                            </div>
                            <div>
                              <strong>Severidade:</strong> {prediction.severity}
                            </div>
                            {prediction.timeToFailure && (
                              <div>
                                <strong>Tempo até falha:</strong> {Math.floor(prediction.timeToFailure / 60)} minutos
                              </div>
                            )}
                            {preventiveActions && preventiveActions.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <strong>Ações Preventivas:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {preventiveActions.map((action, idx) => (
                                    <li key={idx}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Padrões */}
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Padrões Aprendidos
                </CardTitle>
                <CardDescription>
                  Conhecimento acumulado pelo sistema de meta-aprendizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patterns?.map((pattern) => (
                    <Card key={pattern.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-medium">{pattern.pattern}</CardTitle>
                          <Badge variant="secondary">
                            Ocorrências: {pattern.occurrences}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700 mb-2">{pattern.description}</p>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>
                            <strong>Categoria:</strong> {pattern.category}
                          </div>
                          <div>
                            <strong>Confiança:</strong> {pattern.confidence}%
                          </div>
                          <div>
                            <strong>Impacto:</strong> {pattern.impact}
                          </div>
                          {pattern.recommendation && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <strong>Recomendação:</strong> {pattern.recommendation}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
