import { Download, Monitor, Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function DownloadAgent() {
  const { data: links, isLoading } = trpc.downloadAgent.getDownloadLinks.useQuery();

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
                <p className="text-sm text-gray-600">Desktop Agent</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
            <Rocket className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Desktop Agent
          </h2>
          
          <p className="text-xl text-gray-600 mb-8">
            Sistema de automação remota para Windows, Linux e macOS
          </p>

          <Alert className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>1 CLIQUE = SISTEMA RODANDO!</strong> Baixe o instalador e execute. Tudo é configurado automaticamente.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Download Options */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Escolha sua forma de instalação
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Windows BAT */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Windows</h4>
                    <p className="text-sm text-gray-600">Instalador .BAT</p>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instala Python automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Configura dependências</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Cria atalhos na área de trabalho</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Inicia automaticamente</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !links}
                  onClick={() => links && handleDownload(links.installerBat, "INSTALAR_DESKTOP_AGENT.bat")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar para Windows
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Recomendado para Windows
                </p>
              </div>
            </Card>

            {/* Python Universal */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-500">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Universal</h4>
                    <p className="text-sm text-gray-600">Instalador .PY</p>
                  </div>
                </div>

                <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-3">
                  RECOMENDADO
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Funciona em Windows, Linux e macOS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instalação guiada passo a passo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Detecta sistema automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Interface amigável</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  disabled={isLoading || !links}
                  onClick={() => links && handleDownload(links.installerPy, "instalador_automatico.py")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Universal
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Requer Python 3.7+
                </p>
              </div>
            </Card>

            {/* Agent Manual */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Manual</h4>
                    <p className="text-sm text-gray-600">Agent .PY</p>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Apenas o agent principal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Para usuários avançados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Configuração manual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Mais controle</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  disabled={isLoading || !links}
                  onClick={() => links && handleDownload(links.agentPy, "agent.py")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Agent
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Requer configuração manual
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Como instalar
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Baixe o instalador</h4>
                  <p className="text-gray-600">
                    Escolha o instalador adequado para seu sistema operacional acima.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Execute o arquivo</h4>
                  <p className="text-gray-600">
                    Clique duas vezes no arquivo baixado. No Windows, pode ser necessário permitir a execução.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Aguarde a instalação</h4>
                  <p className="text-gray-600">
                    O instalador irá configurar tudo automaticamente. Isso pode levar alguns minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Pronto!</h4>
                  <p className="text-gray-600">
                    O Desktop Agent estará rodando e conectado ao servidor automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            {APP_TITLE} - Sistema de Automação Remota
          </p>
          <p className="text-xs mt-2">
            Versão 2.0.0 - Desktop Agent
          </p>
        </div>
      </footer>
    </div>
  );
}
