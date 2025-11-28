import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Code, 
  TrendingUp, 
  Lightbulb, 
  FileCode, 
  Zap,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function SelfAwareness() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const runAnalysisMutation = trpc.selfAwareness.runAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Análise completa concluída!");
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Auto-Conhecimento
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Sistema de análise e evolução autônoma - O servidor se conhece e se otimiza
          </p>
        </div>

        {/* Action Button */}
        <Card className="mb-8 border-purple-200 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Análise Completa
            </CardTitle>
            <CardDescription>
              Execute uma análise profunda do código, performance e gere sugestões de otimização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRunAnalysis}
              disabled={runAnalysisMutation.isPending}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {runAnalysisMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Executar Análise
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {analysisResult && (
          <Tabs defaultValue="code" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Código
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Sugestões
              </TabsTrigger>
            </TabsList>

            {/* Code Analysis Tab */}
            <TabsContent value="code" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-500" />
                      Total de Arquivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysisResult.codeAnalysis.totalFiles}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Code className="w-4 h-4 text-green-500" />
                      Total de Linhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysisResult.codeAnalysis.totalLines.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Alta Complexidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysisResult.codeAnalysis.complexity.high}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Maiores Arquivos</CardTitle>
                  <CardDescription>Arquivos que podem se beneficiar de refatoração</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.codeAnalysis.largestFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex-1 truncate">
                          <code className="text-sm">{file.path}</code>
                        </div>
                        <Badge variant={file.lines > 500 ? "destructive" : file.lines > 200 ? "default" : "secondary"}>
                          {file.lines} linhas
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analysisResult.codeAnalysis.filesByType).map(([ext, count]: [string, any]) => (
                      <div key={ext} className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{ext}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Endpoints Mais Lentos</CardTitle>
                  <CardDescription>Candidatos a otimização</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.performanceInsights.slowestEndpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <code className="text-sm flex-1">{endpoint.endpoint}</code>
                        <Badge variant={endpoint.avgTime > 1000 ? "destructive" : "default"}>
                          {endpoint.avgTime.toFixed(0)}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endpoints Mais Usados</CardTitle>
                  <CardDescription>Considere implementar cache</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.performanceInsights.mostUsedEndpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <code className="text-sm flex-1">{endpoint.endpoint}</code>
                        <Badge variant="secondary">{endpoint.count} chamadas</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {analysisResult.performanceInsights.errorProneEndpoints.length > 0 && (
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Endpoints com Erros
                    </CardTitle>
                    <CardDescription>Requerem atenção imediata</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResult.performanceInsights.errorProneEndpoints.map((endpoint: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <code className="text-sm flex-1">{endpoint.endpoint}</code>
                          <Badge variant="destructive">{(endpoint.errorRate * 100).toFixed(1)}% erro</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              {/* Caching Suggestions */}
              {analysisResult.suggestions.caching.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      Sugestões de Cache
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.suggestions.caching.map((suggestion: any, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="font-medium mb-1">
                            <code className="text-sm">{suggestion.endpoint}</code>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {suggestion.reason}
                          </div>
                          <Badge variant="outline" className="text-blue-600">
                            {suggestion.estimatedImprovement}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Indexing Suggestions */}
              {analysisResult.suggestions.indexing.length > 0 && (
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-green-500" />
                      Sugestões de Indexação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.suggestions.indexing.map((suggestion: any, index: number) => (
                        <div key={index} className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div className="font-medium mb-1">
                            Tabela: <code className="text-sm">{suggestion.table}</code>
                          </div>
                          <div className="font-medium mb-2">
                            Coluna: <code className="text-sm">{suggestion.column}</code>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {suggestion.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Refactoring Suggestions */}
              {analysisResult.suggestions.refactoring.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-orange-500" />
                      Sugestões de Refatoração
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.suggestions.refactoring.map((suggestion: any, index: number) => (
                        <div key={index} className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                          <div className="font-medium mb-1">
                            <code className="text-sm">{suggestion.file}</code>
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                            ⚠️ {suggestion.issue}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            💡 {suggestion.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Architecture Suggestions */}
              {analysisResult.suggestions.architecture.length > 0 && (
                <Card className="border-purple-200 dark:border-purple-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-purple-500" />
                      Sugestões de Arquitetura
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.suggestions.architecture.map((suggestion: any, index: number) => (
                        <div key={index} className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <div className="font-medium mb-1">{suggestion.component}</div>
                          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                            ⚠️ {suggestion.issue}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            💡 {suggestion.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Suggestions */}
              {analysisResult.suggestions.caching.length === 0 &&
                analysisResult.suggestions.indexing.length === 0 &&
                analysisResult.suggestions.refactoring.length === 0 &&
                analysisResult.suggestions.architecture.length === 0 && (
                  <Card className="border-green-200 dark:border-green-900">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Sistema Otimizado!</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Nenhuma sugestão de melhoria encontrada no momento.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!analysisResult && !runAnalysisMutation.isPending && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Brain className="w-20 h-20 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma Análise Executada</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Execute uma análise completa para ver insights sobre o sistema
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
