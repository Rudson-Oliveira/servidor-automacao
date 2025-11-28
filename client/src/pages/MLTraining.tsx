import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface TrainingResult {
  metric: string;
  status: "idle" | "training" | "success" | "error";
  message?: string;
  accuracy?: number;
}

export default function MLTraining() {
  const [results, setResults] = useState<TrainingResult[]>([
    { metric: "cpu_usage", status: "idle" },
    { metric: "memory_usage", status: "idle" },
  ]);

  const trainMutation = trpc.ml.train.useMutation({
    onSuccess: (data, variables) => {
      setResults(prev =>
        prev.map(r =>
          r.metric === variables.metricName
            ? {
                ...r,
                status: "success",
                message: data.message,
                accuracy: data.metrics.accuracy,
              }
            : r
        )
      );
      toast.success(`Modelo ${variables.metricName} treinado com sucesso!`);
    },
    onError: (error, variables) => {
      setResults(prev =>
        prev.map(r =>
          r.metric === variables.metricName
            ? { ...r, status: "error", message: error.message }
            : r
        )
      );
      toast.error(`Erro ao treinar ${variables.metricName}`);
    },
  });

  const handleTrainModel = async (metricName: string) => {
    setResults(prev =>
      prev.map(r =>
        r.metric === metricName ? { ...r, status: "training" } : r
      )
    );

    await trainMutation.mutateAsync({
      metricName,
      component: "system",
    });
  };

  const handleTrainAll = async () => {
    for (const result of results) {
      await handleTrainModel(result.metric);
      // Aguardar 2 segundos entre treinamentos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const getStatusIcon = (status: TrainingResult["status"]) => {
    switch (status) {
      case "training":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-400" />;
    }
  };

  const allSuccess = results.every(r => r.status === "success");
  const anyTraining = results.some(r => r.status === "training");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Brain className="h-10 w-10 text-blue-600" />
            Treinamento de Modelos ML
          </h1>
          <p className="text-gray-600">
            Treine modelos LSTM para predição de anomalias e auto-healing preventivo
          </p>
        </div>

        {/* Alert de Sucesso */}
        {allSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 Todos os modelos foram treinados com sucesso! O sistema agora pode fazer predições de anomalias e realizar auto-healing preventivo.
            </AlertDescription>
          </Alert>
        )}

        {/* Botão Treinar Todos */}
        <Card>
          <CardHeader>
            <CardTitle>Ação Rápida</CardTitle>
            <CardDescription>
              Treine todos os modelos de uma vez
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTrainAll}
              disabled={anyTraining}
              className="w-full"
              size="lg"
            >
              {anyTraining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Treinando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Treinar Todos os Modelos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Modelos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Modelos Disponíveis
          </h2>

          {results.map((result) => (
            <Card key={result.metric}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <CardTitle className="text-lg">
                        {result.metric === "cpu_usage" ? "CPU Usage" : "Memory Usage"}
                      </CardTitle>
                      <CardDescription>
                        Modelo LSTM para predição de {result.metric}
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleTrainModel(result.metric)}
                    disabled={result.status === "training"}
                    variant={result.status === "success" ? "outline" : "default"}
                  >
                    {result.status === "training" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Treinando...
                      </>
                    ) : result.status === "success" ? (
                      "Retreinar"
                    ) : (
                      "Treinar"
                    )}
                  </Button>
                </div>
              </CardHeader>

              {(result.message || result.accuracy !== undefined) && (
                <CardContent>
                  <div className="space-y-2">
                    {result.message && (
                      <p className={`text-sm ${
                        result.status === "success" ? "text-green-600" : "text-red-600"
                      }`}>
                        {result.message}
                      </p>
                    )}
                    {result.accuracy !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${result.accuracy * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {(result.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Informações Adicionais */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p>• O treinamento pode levar de 30 segundos a 2 minutos por modelo</p>
            <p>• É necessário ter dados históricos suficientes (mínimo 30 pontos)</p>
            <p>• Modelos com acurácia &lt; 70% serão retreinados automaticamente</p>
            <p>• Após o treinamento, o sistema começará a fazer predições a cada 30 segundos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
