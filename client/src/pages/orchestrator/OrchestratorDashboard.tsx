import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Dashboard do Sistema de Orquestração Multi-IA
 * 
 * Exibe status em tempo real de todas as IAs, métricas,
 * histórico de escalações e permite interação com o sistema
 */
export default function OrchestratorDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  // Buscar status dos providers
  const { data: providersData, isLoading: loadingProviders, refetch: refetchProviders } =
    trpc.orchestratorMultiIA.getProvidersStatus.useQuery(undefined, {
      refetchInterval: 5000, // Atualizar a cada 5s
    });

  // Buscar métricas
  const { data: metricsData, isLoading: loadingMetrics } =
    trpc.orchestratorMultiIA.getMetrics.useQuery(
      { days: selectedPeriod },
      { refetchInterval: 10000 }
    );

  // Buscar tarefas recentes
  const { data: tasksData, isLoading: loadingTasks } =
    trpc.orchestratorMultiIA.listTasks.useQuery(
      { limit: 10, offset: 0 },
      { refetchInterval: 5000 }
    );

  const providers = providersData?.providers || [];
  const metrics = metricsData?.general || {};
  const tasks = tasksData?.tasks || [];

  // Calcular estatísticas
  const totalTasks = Number(metrics.total_tasks) || 0;
  const completedTasks = Number(metrics.completed_tasks) || 0;
  const failedTasks = Number(metrics.failed_tasks) || 0;
  const escalatedTasks = Number(metrics.escalated_tasks) || 0;
  const successRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0.0";
  const avgExecutionTime = Number(metrics.avg_execution_time) || 0;
  const totalCost = Number(metrics.total_cost) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Orquestração Multi-IA</h1>
          <p className="text-muted-foreground mt-1">
            COMET lidera a orquestração de IAs especializadas
          </p>
        </div>
        <Button onClick={() => {
          refetchProviders();
          toast.success("Status atualizado!");
        }}>
          <Activity className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {selectedPeriod} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} concluídas, {failedTasks} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgExecutionTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Tempo de execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {escalatedTasks} escalações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">
            <Zap className="mr-2 h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Activity className="mr-2 h-4 w-4" />
            Tarefas Recentes
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Providers */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Providers</CardTitle>
              <CardDescription>
                Monitoramento em tempo real de todas as IAs disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider: any) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`h-3 w-3 rounded-full ${
                          provider.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold">{provider.display_name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {provider.total_requests_today || 0} requisições hoje
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {((provider.successful_requests_today || 0) / (provider.total_requests_today || 1) * 100).toFixed(1)}% sucesso
                          </p>
                        </div>
                        <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
                          {provider.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tarefas Recentes */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas Recentes</CardTitle>
              <CardDescription>
                Histórico das últimas tarefas processadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-mono text-muted-foreground">
                            {task.task_id.substring(0, 8)}...
                          </p>
                          {task.escalation_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <ArrowUpCircle className="mr-1 h-3 w-3" />
                              {task.escalation_count} escalações
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 line-clamp-1">{task.input_text}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm">
                          <p className="font-medium">{task.current_provider_name}</p>
                          <p className="text-muted-foreground">{task.execution_time_ms}ms</p>
                        </div>
                        <Badge
                          variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'failed' ? 'destructive' :
                            task.status === 'escalated' ? 'secondary' :
                            'outline'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Período de Análise</h3>
            <div className="flex space-x-2">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant={selectedPeriod === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(days)}
                >
                  {days} dias
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas por Provider</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(metricsData?.byProvider || []).map((item: any) => (
                      <div key={item.provider_name} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.provider_name}</span>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{item.task_count} tarefas</span>
                          <span>{Number(item.avg_confidence || 0).toFixed(1)}% conf.</span>
                          <span>${Number(item.total_cost || 0).toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências Diárias</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(metricsData?.daily || []).slice(-7).map((item: any) => (
                      <div key={item.date} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span>{item.total_tasks} tarefas</span>
                          <span className="text-green-600">
                            {Number(item.avg_confidence || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
