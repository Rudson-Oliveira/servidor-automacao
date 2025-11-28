import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function DownloadInstalador() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: installerInfo, isLoading, refetch } = trpc.installer.getInfo.useQuery();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Obter URL de download
      const downloadUrl = '/api/download/installer-windows.exe';
      
      toast.info('Iniciando download...', {
        description: 'O instalador será baixado automaticamente.',
      });

      // Criar link temporário e clicar
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `servidor-automacao-v${installerInfo?.build?.version || 'latest'}.exe`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download iniciado!', {
        description: 'Verifique a pasta de downloads do seu navegador.',
      });

    } catch (error: any) {
      console.error('Erro ao baixar instalador:', error);
      toast.error('Erro ao baixar instalador', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleForceBuild = async () => {
    try {
      toast.info('Iniciando compilação...', {
        description: 'Isso pode levar alguns minutos.',
      });

      // Recarregar informações
      await refetch();

      toast.success('Compilação iniciada!', {
        description: 'O instalador será gerado em breve.',
      });
    } catch (error: any) {
      console.error('Erro ao forçar build:', error);
      toast.error('Erro ao iniciar compilação', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Download do Instalador Windows
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Baixe o instalador .EXE do Servidor de Automação para Windows
          </p>
        </div>

        <div className="grid gap-6">
          {/* Card Principal de Download */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-6 h-6" />
                Instalador Windows (.EXE)
              </CardTitle>
              <CardDescription>
                Instalador standalone para Windows 10/11 (64-bit)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status do Instalador */}
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando disponibilidade...</span>
                </div>
              ) : installerInfo?.isBuilding ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compilando instalador... (pode levar até 10 minutos)</span>
                </div>
              ) : installerInfo?.available ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Instalador disponível para download</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Instalador será compilado no primeiro download</span>
                </div>
              )}

              {/* Informações do Build */}
              {installerInfo?.build && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Versão</p>
                      <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        v{installerInfo.build.version}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Tamanho</p>
                      <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {installerInfo.build.fileSizeMB} MB
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Data de Compilação</p>
                      <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                        {new Date(installerInfo.build.buildDate).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={isDownloading || installerInfo?.isBuilding}
                  className="flex-1"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Instalador
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Como Instalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Clique no botão "Baixar Instalador" acima</li>
                <li>Aguarde o download do arquivo .exe completar</li>
                <li>Execute o instalador baixado</li>
                <li>Siga as instruções na tela</li>
                <li>O servidor será instalado e iniciado automaticamente</li>
              </ol>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Nota:</strong> O Windows Defender pode exibir um aviso ao executar o instalador.
                  Isso é normal para aplicativos não assinados digitalmente. Clique em "Mais informações" e depois em "Executar assim mesmo".
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Requisitos do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Requisitos do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Windows 10 ou 11 (64-bit)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  4 GB de RAM (recomendado: 8 GB)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  500 MB de espaço em disco
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Conexão com a internet
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
