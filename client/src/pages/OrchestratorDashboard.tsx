import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Server, 
  AlertCircle,
  RefreshCw,
  Zap,
  TrendingUp
} from "lucide-react";
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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
  ArcElement
);

/**
 * Dashboard de Orquestração de Agentes
 * 
 * Monitora em tempo real:
 * - Status de todos os agents (online/offline)
 * - Fila de tarefas (pending/running/completed/failed)
 * - Circuit breakers ativos
 * - Métricas de performance
 * - Gráficos de tendências
 */
export default function OrchestratorDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 3 segundos

  // Queries tRPC
  const statsQuery = trpc.orchestrator.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const agentsQuery = trpc.orchestrator.listAgents.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const pendingTasksQuery = trpc.orchestrator.getPendingTasks.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const runningTasksQuery = trpc.orchestrator.getRunningTasks.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const completedTasksQuery = trpc.orchestrator.getCompletedTasks.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const failedTasksQuery = trpc.orchestrator.getFailedTasks.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const stats = statsQuery.data;
  const agents = agentsQuery.data;
  const pendingTasks = pendingTasksQuery.data;
  const runningTasks = runningTasksQuery.data;
  const completedTasks = completedTasksQuery.data;
  const failedTasks = failedTasksQuery.data;

  // Dados para gráfico de distribuição de tarefas
  const taskDistributionData = {
    labels: ['Concluídas', 'Falhadas', 'Pendentes', 'Em Execução'],
    datasets: [
      {
        data: [
          stats?.completedTasks || 0,
          stats?.failedTasks || 0,
          stats?.pendingTasks || 0,
          runningTasks?.total || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de carga dos agents
  const agentLoadData = {
    labels: agents?.agents.map((a) => a.name) || [],
    datasets: [
      {
        label: 'Carga Atual',
        data: agents?.agents.map((a) => a.currentLoad) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Carga Máxima',
        data: agents?.agents.map((a) => a.maxLoad) || [],
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de performance dos agents
  const agentPerformanceData = {
    labels: agents?.agents.map((a) => a.name) || [],
    datasets: [
      {
        label: 'Tarefas Concluídas',
        data: agents?.agents.map((a) => a.totalTasksCompleted) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
      {
        label: 'Tarefas Falhadas',
        data: agents?.agents.map((a) => a.totalTasksFailed) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Zap className="w-10 h-10 text-blue-500" />
              Orquestrador de Agentes
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Monitoramento em tempo real de agentes desktop e tarefas distribuídas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                statsQuery.refetch();
                agentsQuery.refetch();
                pendingTasksQuery.refetch();
                runningTasksQuery.refetch();
                completedTasksQuery.refetch();
                failedTasksQuery.refetch();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Agora
            </Button>
          </div>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalAgents || 0}
                </div>
                <Server className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  {stats?.onlineAgents || 0} online
                </Badge>
                <Badge variant="secondary">
                  {stats?.offlineAgents || 0} offline
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tarefas Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats?.completedTasks || 0}
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Taxa de sucesso: {stats?.successRate?.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats?.pendingTasks || 0}
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Tempo médio de espera: {stats?.averageWaitTime?.toFixed(0) || 0}ms
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Circuit Breakers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats?.circuitBreakersOpen || 0}
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Tarefas falhadas: {stats?.failedTasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tarefas</CardTitle>
              <CardDescription>Status atual de todas as tarefas</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Doughnut 
                data={taskDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carga dos Agentes</CardTitle>
              <CardDescription>Tarefas ativas vs capacidade máxima</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <Bar 
                data={agentLoadData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance dos Agentes</CardTitle>
              <CardDescription>Tarefas concluídas vs falhadas</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <Bar 
                data={agentPerformanceData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Tabs com detalhes */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="agents">
              <Server className="w-4 h-4 mr-2" />
              Agentes ({agents?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Pendentes ({pendingTasks?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="running">
              <Activity className="w-4 h-4 mr-2" />
              Em Execução ({runningTasks?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Concluídas ({completedTasks?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="failed">
              <XCircle className="w-4 h-4 mr-2" />
              Falhadas ({failedTasks?.total || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Agentes */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agentes Registrados</CardTitle>
                <CardDescription>
                  Status e métricas de todos os desktop agents conectados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents?.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {agent.name}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            ID: {agent.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Carga</div>
                          <div className="font-semibold">
                            {agent.currentLoad}/{agent.maxLoad}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Sucesso</div>
                          <div className="font-semibold text-green-600">
                            {agent.totalTasksCompleted}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Falhas</div>
                          <div className="font-semibold text-red-600">
                            {agent.totalTasksFailed}
                          </div>
                        </div>

                        <Badge
                          variant={agent.circuitBreakerState === 'closed' ? 'default' : 'destructive'}
                        >
                          {agent.circuitBreakerState}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!agents || agents.agents.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Nenhum agent registrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pendentes */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas Pendentes</CardTitle>
                <CardDescription>Aguardando execução por um agent disponível</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingTasks?.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-800"
                    >
                      <div>
                        <div className="font-medium">{task.type}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ID: {task.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">Prioridade: {task.priority}</Badge>
                        <Badge variant="secondary">Tentativas: {task.retries}/{task.maxRetries}</Badge>
                      </div>
                    </div>
                  ))}

                  {(!pendingTasks || pendingTasks.tasks.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Nenhuma tarefa pendente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Em Execução */}
          <TabsContent value="running" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas em Execução</CardTitle>
                <CardDescription>Sendo processadas pelos agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {runningTasks?.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-800"
                    >
                      <div>
                        <div className="font-medium">{task.type}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ID: {task.id} | Agent: {task.assignedAgentId}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="default" className="bg-blue-500">
                          <Activity className="w-3 h-3 mr-1 animate-pulse" />
                          Executando
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!runningTasks || runningTasks.tasks.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Nenhuma tarefa em execução
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Concluídas */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas Concluídas (Últimas 50)</CardTitle>
                <CardDescription>Histórico de tarefas executadas com sucesso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {completedTasks?.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-800"
                    >
                      <div>
                        <div className="font-medium">{task.type}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ID: {task.id} | Agent: {task.assignedAgentId}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {task.executionTime}ms
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Sucesso
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!completedTasks || completedTasks.tasks.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Nenhuma tarefa concluída
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Falhadas */}
          <TabsContent value="failed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas Falhadas (Últimas 50)</CardTitle>
                <CardDescription>Histórico de tarefas que falharam após todas as tentativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {failedTasks?.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-800"
                    >
                      <div>
                        <div className="font-medium">{task.type}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ID: {task.id} | Agent: {task.assignedAgentId}
                        </div>
                        {task.error && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Erro: {task.error}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          Tentativas: {task.retries}/{task.maxRetries}
                        </Badge>
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Falhou
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {(!failedTasks || failedTasks.tasks.length === 0) && (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Nenhuma tarefa falhada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
