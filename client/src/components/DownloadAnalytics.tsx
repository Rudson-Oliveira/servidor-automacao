import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, TrendingUp, Calendar, FileDown } from "lucide-react";

interface DownloadStat {
  file_name: string;
  download_count: number;
  last_download: string;
  created_at: string;
}

interface DownloadStats {
  success: boolean;
  stats: DownloadStat[];
  total_downloads: number;
}

export default function DownloadAnalytics() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/download/stats');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Analytics de Downloads
          </CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Download className="h-5 w-5" />
            Erro ao Carregar Analytics
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Total de Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Total de Downloads
          </CardTitle>
          <CardDescription>Todos os arquivos combinados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {stats?.total_downloads || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Downloads realizados desde o início
          </p>
        </CardContent>
      </Card>

      {/* Cards Individuais por Arquivo */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats?.stats && stats.stats.length > 0 ? (
          stats.stats.map((stat) => (
            <Card key={stat.file_name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileDown className="h-4 w-4" />
                  {stat.file_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {stat.download_count}
                  </div>
                  <p className="text-sm text-muted-foreground">downloads</p>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Último download:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(stat.last_download)}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Rastreado desde {formatDate(stat.created_at)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum download registrado ainda
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Arquivos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-primary" />
            <span className="font-medium">cometa.exe</span>
            <span className="text-muted-foreground">- Instalador do Desktop Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-primary" />
            <span className="font-medium">browser-extension.zip</span>
            <span className="text-muted-foreground">- Extensão do Navegador</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
