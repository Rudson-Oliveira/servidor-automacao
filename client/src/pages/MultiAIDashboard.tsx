import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, Zap, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

/**
 * DASHBOARD MULTI-IA - FASE 4 AUDITORIA FORENSE
 * 
 * Interface centralizada para:
 * - Executar tarefas com seleção automática de IA
 * - Visualizar métricas de performance
 * - Monitorar status das 6 IAs
 * - Aprender qual IA é melhor para cada tarefa
 */

export default function MultiAIDashboard() {
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Queries
  const { data: capabilities } = trpc.multiAI.getCapabilities.useQuery();
  const { data: metrics, refetch: refetchMetrics } = trpc.multiAI.getMetrics.useQuery();
  const { data: recommendation } = trpc.multiAI.recommendAI.useQuery(
    { taskType: selectedTaskType },
    { enabled: !!selectedTaskType }
  );

  // Mutation
  const executeMutation = trpc.multiAI.execute.useMutation({
    onSuccess: (data) => {
      setLastResult(data);
      refetchMetrics();
      toast.success(`Tarefa executada com sucesso por ${data.aiUsed}!`);
      setExecuting(false);
    },
    onError: (error) => {
      toast.error(`Erro ao executar tarefa: ${error.message}`);
      setExecuting(false);
    },
  });

  const handleExecute = () => {
    if (!selectedTaskType || !prompt.trim()) {
      toast.error("Selecione um tipo de tarefa e digite um prompt");
      return;
    }

    setExecuting(true);
    executeMutation.mutate({
      taskType: selectedTaskType as any,
      prompt: prompt.trim(),
      maxRetries: 3,
    });
  };

  // Calcular estatísticas
  const totalExecutions = metrics?.totalExecutions || 0;
  const successRate = metrics?.overallSuccessRate || 0;
  const activeAIs = metrics?.byAI?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Orquestrador Multi-IA
          </h1>
          <p className="text-muted-foreground text-lg">
            Sistema inteligente com 6 IAs integradas e seleção automática
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                IAs Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAIs}/6</div>
              <p className="text-xs text-muted-foreground mt-1">
                {capabilities?.availableAIs.length || 0} disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Execuções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalExecutions}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de tarefas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {successRate >= 90 ? "Excelente" : successRate >= 70 ? "Bom" : "Precisa melhorar"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tipos de Tarefa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{capabilities?.taskTypes.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Suportados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Execução */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Executar Tarefa</CardTitle>
                <CardDescription>
                  Selecione o tipo de tarefa e o sistema escolherá automaticamente a melhor IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Tarefa</label>
                  <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      {capabilities?.taskTypes.map((taskType) => (
                        <SelectItem key={taskType} value={taskType}>
                          {taskType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {recommendation && (
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      <strong>IA Recomendada:</strong> {recommendation.recommendedAI}
                      {recommendation.performance && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({recommendation.performance.successRate.toFixed(0)}% sucesso,{" "}
                          {recommendation.performance.avgResponseTime.toFixed(0)}ms médio)
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva a tarefa que deseja executar..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleExecute}
                  disabled={executing || !selectedTaskType || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {executing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Executar Tarefa
                    </>
                  )}
                </Button>

                {lastResult && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Resultado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{lastResult.aiUsed}</Badge>
                        <span className="text-muted-foreground">
                          {lastResult.attempts} tentativa(s)
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap bg-background p-3 rounded-md border">
                        {lastResult.result}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de IAs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>IAs Disponíveis</CardTitle>
                <CardDescription>Status e capacidades de cada IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {capabilities?.availableAIs.map((aiName) => {
                  const aiMetrics = metrics?.byAI?.find((m: any) => m.aiName === aiName);
                  const aiCapabilities = capabilities.capabilities[aiName as keyof typeof capabilities.capabilities];

                  return (
                    <Card key={aiName} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">{aiName}</CardTitle>
                          {aiMetrics ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {aiCapabilities.slice(0, 2).map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {aiCapabilities.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{aiCapabilities.length - 2}
                            </Badge>
                          )}
                        </div>
                        {aiMetrics && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Taxa: {aiMetrics.successRate.toFixed(0)}%</div>
                            <div>Tempo: {aiMetrics.avgResponseTime.toFixed(0)}ms</div>
                            <div>Tarefas: {aiMetrics.totalTasks}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
