import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Monitor, Trash2, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStableCallback } from "@/hooks/useStableCallback";

/**
 * VERSÃO PROTEGIDA CONTRA FLICKERING
 * 
 * Proteções implementadas:
 * 1. useMemo para formatDate (evita recriação)
 * 2. useCallback para handlers (referências estáveis)
 * 3. useStableCallback para callbacks complexos
 * 4. React.memo em componentes filhos
 * 5. Invalidação inteligente (sem refetch manual)
 * 6. Enabled condicional estável
 */

// Componente memoizado para card de captura
const CaptureCard = memo(({ 
  captura, 
  onViewDetails, 
  onAnalyze, 
  onDelete,
  isAnalyzing,
  isDeleting 
}: {
  captura: any;
  onViewDetails: (id: number) => void;
  onAnalyze: (id: number) => void;
  onDelete: (id: number) => void;
  isAnalyzing: boolean;
  isDeleting: boolean;
}) => {
  // Memoizar formatação de data
  const formattedDate = useMemo(() => {
    const d = new Date(captura.timestamp);
    return d.toLocaleString("pt-BR");
  }, [captura.timestamp]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Captura #{captura.id}</CardTitle>
          {captura.analisado === 1 ? (
            <Badge className="bg-green-500">Analisada</Badge>
          ) : (
            <Badge variant="outline">Pendente</Badge>
          )}
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Screenshot Preview */}
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={captura.screenshotUrl}
            alt={`Captura ${captura.id}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Informações */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Resolução:</span>
            <span className="font-medium">
              {captura.resolucaoLargura}x{captura.resolucaoAltura}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Programas:</span>
            <span className="font-medium">{captura.totalProgramas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Janelas:</span>
            <span className="font-medium">{captura.totalJanelas}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={() => onViewDetails(captura.id)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Detalhes
          </Button>

          {captura.analisado === 0 && (
            <Button
              onClick={() => onAnalyze(captura.id)}
              disabled={isAnalyzing}
              size="sm"
              className="flex-1"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Analisar"
              )}
            </Button>
          )}

          <Button
            onClick={() => onDelete(captura.id)}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CaptureCard.displayName = 'CaptureCard';

// Componente memoizado para estatísticas
const StatisticsCards = memo(({ estatisticas }: { estatisticas: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Total de Capturas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-blue-600">{estatisticas.totalCapturas}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Analisadas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-green-600">{estatisticas.analisadas}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-orange-600">{estatisticas.pendentes}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">Programa Mais Comum</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-bold text-purple-600">
          {estatisticas.top5Programas[0]?.nome || "N/A"}
        </p>
      </CardContent>
    </Card>
  </div>
));

StatisticsCards.displayName = 'StatisticsCards';

export default function DesktopCapturesProtected() {
  const [selectedCapture, setSelectedCapture] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Utils para invalidação inteligente
  const utils = trpc.useUtils();

  // Queries com enabled estável
  const enabledDetails = useMemo(() => !!selectedCapture, [selectedCapture]);
  
  const { data: capturas, isLoading } = trpc.desktop.listar.useQuery({ limite: 20 });
  const { data: estatisticas } = trpc.desktop.estatisticas.useQuery();
  const { data: detalhes } = trpc.desktop.buscarPorId.useQuery(
    { id: selectedCapture! },
    { enabled: enabledDetails }
  );

  // Mutations com invalidação inteligente (sem refetch manual)
  const deletarMutation = trpc.desktop.deletar.useMutation({
    onSuccess: () => {
      toast.success("Captura deletada com sucesso!");
      // Invalidar queries ao invés de refetch manual
      utils.desktop.listar.invalidate();
      utils.desktop.estatisticas.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const analisarMutation = trpc.desktop.analisar.useMutation({
    onSuccess: (data) => {
      toast.success("Análise concluída!");
      console.log(data.analise);
      // Invalidar queries ao invés de refetch manual
      utils.desktop.listar.invalidate();
      utils.desktop.estatisticas.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao analisar: ${error.message}`);
    },
  });

  // Handlers com useCallback para referências estáveis
  const handleDelete = useCallback((id: number) => {
    if (confirm("Tem certeza que deseja deletar esta captura?")) {
      deletarMutation.mutate({ id });
    }
  }, [deletarMutation]);

  const handleAnalyze = useCallback((id: number) => {
    analisarMutation.mutate({ id });
  }, [analisarMutation]);

  const handleViewDetails = useCallback((id: number) => {
    setSelectedCapture(id);
    setDetailsOpen(true);
  }, []);

  const handleRefresh = useStableCallback(() => {
    utils.desktop.listar.invalidate();
    utils.desktop.estatisticas.invalidate();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Monitor className="h-10 w-10 text-blue-600" />
              Capturas de Área de Trabalho
            </h1>
            <p className="text-lg text-gray-600">
              Visualize e analise screenshots do desktop capturados pelo Comet
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas */}
        {estatisticas && <StatisticsCards estatisticas={estatisticas} />}

        {/* Lista de Capturas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : capturas && capturas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capturas.map((captura) => (
              <CaptureCard
                key={captura.id}
                captura={captura}
                onViewDetails={handleViewDetails}
                onAnalyze={handleAnalyze}
                onDelete={handleDelete}
                isAnalyzing={analisarMutation.isPending}
                isDeleting={deletarMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">Nenhuma captura encontrada</p>
              <p className="text-sm text-gray-500 mb-4">
                Execute o script Python para capturar sua área de trabalho
              </p>
              <code className="bg-gray-100 px-4 py-2 rounded text-sm">
                python desktop_capture.py
              </code>
            </CardContent>
          </Card>
        )}

        {/* Modal de Detalhes */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Captura #{selectedCapture}</DialogTitle>
            </DialogHeader>

            {detalhes && (
              <div className="space-y-6">
                {/* Screenshot */}
                <div>
                  <h3 className="font-semibold mb-2">Screenshot</h3>
                  <img
                    src={detalhes.screenshotUrl}
                    alt="Screenshot"
                    className="w-full rounded-lg border"
                  />
                </div>

                {/* Análise */}
                {detalhes.analiseTexto && (
                  <div>
                    <h3 className="font-semibold mb-2">Análise</h3>
                    <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {detalhes.analiseTexto}
                    </div>
                  </div>
                )}

                {/* Programas */}
                {detalhes.programas && detalhes.programas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Programas ({detalhes.programas.length})
                    </h3>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Nome</th>
                            <th className="text-right p-2">Memória (MB)</th>
                            <th className="text-right p-2">CPU %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalhes.programas.map((prog, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{prog.nome}</td>
                              <td className="text-right p-2">{prog.memoriaMb}</td>
                              <td className="text-right p-2">{prog.cpuPercent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Janelas */}
                {detalhes.janelas && detalhes.janelas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Janelas ({detalhes.janelas.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {detalhes.janelas.map((jan, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{jan.titulo}</p>
                          <p className="text-sm text-gray-600">{jan.processo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
