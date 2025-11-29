import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, Bell, TrendingUp, CheckCircle2, XCircle, AlertTriangle, Zap, Activity } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function MLDashboard() {
  const { data: config } = trpc.alerts.getConfig.useQuery();
  const [trainingStatus, setTrainingStatus] = useState<Record<string, "idle" | "training" | "success" | "error">>({
    cpu_usage: "idle",
    memory_usage: "idle",
  });

  const trainMutation = trpc.ml.train.useMutation({
    onSuccess: (data, variables) => {
      setTrainingStatus(prev => ({ ...prev, [variables.metricName]: "success" }));
      toast.success(`Modelo ${variables.metricName} treinado! Acurácia: ${(data.metrics.accuracy * 100).toFixed(1)}%`);
    },
    onError: (error, variables) => {
      setTrainingStatus(prev => ({ ...prev, [variables.metricName]: "error" }));
      toast.error(`Erro ao treinar ${variables.metricName}`);
    },
  });

  const testAlertMutation = trpc.alerts.test.useMutation({
    onSuccess: () => {
      toast.success("Alerta de teste enviado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar alerta: ${error.message}`);
    },
  });

  const handleQuickTrain = async () => {
    const metrics = ["cpu_usage", "memory_usage"];
    
    for (const metric of metrics) {
      setTrainingStatus(prev => ({ ...prev, [metric]: "training" }));
      try {
        await trainMutation.mutateAsync({ metricName: metric, component: "system" });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Erro já tratado no onError
      }
    }
  };

  const handleTestAlert = () => {
    if (!config?.emailAddress) {
      toast.error("Configure um email primeiro em Configurações de Alertas");
      return;
    }
    testAlertMutation.mutate({ channel: "email" });
  };

  const allTrained = Object.values(trainingStatus).every(s => s === "success");
  const anyTraining = Object.values(trainingStatus).some(s => s === "training");
  const alertsConfigured = config?.emailEnabled && config?.emailAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Zap className="h-12 w-12 text-indigo-600" />
            ML & Alertas - Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema de Predição de Anomalias e Auto-Healing Preventivo
          </p>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Modelos ML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900">
                {Object.values(trainingStatus).filter(s => s === "success").length}/2
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                {allTrained ? "Todos treinados" : "Aguardando treinamento"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Sistema de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {alertsConfigured ? "Ativo" : "Inativo"}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {alertsConfigured ? config.emailAddress : "Configure SMTP"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Auto-Healing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {allTrained && alertsConfigured ? "Pronto" : "Pendente"}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {allTrained && alertsConfigured ? "Sistema operacional" : "Configure primeiro"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Configure o sistema em 2 passos simples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passo 1: Treinar Modelos */}
              <Card className="border-indigo-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {allTrained ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : anyTraining ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      Passo 1: Treinar Modelos ML
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Treinar modelos LSTM para CPU e memória (~2 min)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleQuickTrain}
                    disabled={anyTraining || allTrained}
                    className="w-full"
                    variant={allTrained ? "outline" : "default"}
                  >
                    {anyTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Treinando...
                      </>
                    ) : allTrained ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Concluído
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Iniciar Treinamento
                      </>
                    )}
                  </Button>
                  <Link href="/ml-training">
                    <Button variant="ghost" className="w-full mt-2 text-xs">
                      Ver detalhes →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Passo 2: Configurar Alertas */}
              <Card className="border-purple-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {alertsConfigured ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      Passo 2: Configurar Alertas
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Configurar SMTP e email para notificações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/alerts-config">
                    <Button
                      className="w-full"
                      variant={alertsConfigured ? "outline" : "default"}
                    >
                      {alertsConfigured ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Configurado
                        </>
                      ) : (
                        <>
                          <Bell className="mr-2 h-4 w-4" />
                          Configurar Agora
                        </>
                      )}
                    </Button>
                  </Link>
                  {alertsConfigured && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-xs"
                      onClick={handleTestAlert}
                      disabled={testAlertMutation.isPending}
                    >
                      {testAlertMutation.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : null}
                      Testar alerta →
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Status Final */}
        {allTrained && alertsConfigured ? (
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 text-lg">
              <strong>🎉 Sistema Totalmente Operacional!</strong>
              <div className="mt-2 space-y-1 text-sm">
                <p>✅ Modelos ML treinados e fazendo predições a cada 30s</p>
                <p>✅ Detecção de anomalias ativa</p>
                <p>✅ Auto-healing preventivo funcionando</p>
                <p>✅ Alertas configurados para {config.emailAddress}</p>
                <p className="mt-3 font-semibold">O sistema agora prevê falhas 5 minutos antes e corrige automaticamente!</p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Configuração Pendente</strong>
              <div className="mt-2 space-y-1 text-sm">
                {!allTrained && <p>⚠️ Treine os modelos ML (Passo 1)</p>}
                {!alertsConfigured && <p>⚠️ Configure SMTP e alertas (Passo 2)</p>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Links Úteis */}
        <Card>
          <CardHeader>
            <CardTitle>Links Úteis</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/ml-training">
              <Button variant="outline" className="w-full">
                <Brain className="mr-2 h-4 w-4" />
                Treinamento ML
              </Button>
            </Link>
            <Link href="/alerts-config">
              <Button variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Config. Alertas
              </Button>
            </Link>
            <Link href="/telemetry">
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Telemetria
              </Button>
            </Link>
            <Link href="/performance">
              <Button variant="outline" className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
