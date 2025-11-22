import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ScreenshotGallery from "@/components/ScreenshotGallery";
import ImageComparison from "@/components/ImageComparison";

interface Metrics {
  totalAnalyses: number;
  totalValidations: number;
  approvedValidations: number;
  avgSimilarity: number;
  approvalRate: number;
}

interface Analysis {
  id: number;
  url: string;
  title: string | null;
  status: string;
  createdAt: string;
}

interface Screenshot {
  id: number;
  filePath: string;
  width: number | null;
  height: number | null;
  section: string | null;
  scrollPosition: number | null;
}

export default function DashboardVision() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar métricas
      const metricsRes = await fetch('/api/dashboard/metrics');
      const metricsData = await metricsRes.json();
      if (metricsData.sucesso) {
        setMetrics(metricsData.dados);
      }

      // Carregar análises
      const analysesRes = await fetch('/api/dashboard/analyses');
      const analysesData = await analysesRes.json();
      if (analysesData.sucesso) {
        setAnalyses(analysesData.dados);
        
        // Carregar screenshots da primeira análise (se existir)
        if (analysesData.dados.length > 0) {
          const firstAnalysisId = analysesData.dados[0].id;
          const screenshotsRes = await fetch(`/api/dashboard/analyses/${firstAnalysisId}`);
          const screenshotsData = await screenshotsRes.json();
          if (screenshotsData.sucesso && screenshotsData.dados.screenshots) {
            setScreenshots(screenshotsData.dados.screenshots);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Comet Vision</h1>
          <p className="text-muted-foreground">Monitoramento de análises e validações de clonagem de sites</p>
        </div>

        {/* Métricas */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalAnalyses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Validações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalValidations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.approvalRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Similaridade Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgSimilarity}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Galeria de Screenshots */}
        {screenshots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Screenshots da Análise Mais Recente</CardTitle>
              <CardDescription>
                Visualização dos screenshots capturados durante a análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScreenshotGallery screenshots={screenshots} />
            </CardContent>
          </Card>
        )}

        {/* Comparação de Imagens (Exemplo) */}
        {screenshots.length >= 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comparação Visual</CardTitle>
                  <CardDescription>
                    Compare o site original com o código gerado
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Ocultar' : 'Mostrar'} Comparação
                </Button>
              </div>
            </CardHeader>
            {showComparison && (
              <CardContent>
                <ImageComparison
                  originalImage={screenshots[0].filePath}
                  generatedImage={screenshots[1].filePath}
                  originalLabel="Original"
                  generatedLabel="Gerado"
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Lista de Análises */}
        <Card>
          <CardHeader>
            <CardTitle>Análises Recentes</CardTitle>
            <CardDescription>Últimas 50 análises realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma análise encontrada
                </p>
              ) : (
                analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{analysis.title || 'Sem título'}</p>
                      <p className="text-sm text-muted-foreground">{analysis.url}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(analysis.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          analysis.status === 'concluido'
                            ? 'bg-green-100 text-green-800'
                            : analysis.status === 'erro'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {analysis.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dashboard/vision/analysis/${analysis.id}`, '_blank')}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
