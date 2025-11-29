import { Monitor, Download, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_TITLE } from "@/const";

export default function DownloadAgent() {
  // URLs diretas para download via REST
  const baseUrl = window.location.origin;
  const token = "manus-agent-download-2024";

  const downloadLinks = {
    agentPy: `${baseUrl}/api/download-secure/agent.py?token=${token}`,
    installerBat: `${baseUrl}/api/download/INSTALAR_DESKTOP_AGENT.bat`,
    installerPy: `${baseUrl}/api/download-secure/instalador_automatico_v2.py?token=${token}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Servidor de Automação</h1>
              <p className="text-sm text-slate-400">Agente de desktop</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Título */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white">
              Escolha sua forma de instalação
            </h2>
            <p className="text-xl text-slate-300">
              Selecione o método que melhor se adapta ao seu sistema
            </p>
          </div>

          {/* Cards de Download */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Windows - Instalador BAT */}
            <Card className="bg-slate-800/50 border-blue-500/30 backdrop-blur-sm p-6 space-y-4 hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Download className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Windows</h3>
                  <p className="text-sm text-slate-400">Instalador .BAT</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Instalar Python automaticamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Configurar</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Crie atalhos na área de trabalho</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Iniciar automaticamente</span>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = downloadLinks.installerBat}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar para Windows
              </Button>

              <p className="text-xs text-center text-slate-400">
                Recomendado para Windows
              </p>
            </Card>

            {/* Universal - Instalador Python */}
            <Card className="bg-slate-800/50 border-green-500/50 backdrop-blur-sm p-6 space-y-4 ring-2 ring-green-500/30 hover:ring-green-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Download className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Universal</h3>
                  <p className="text-sm text-slate-400">Instalador .PY</p>
                </div>
              </div>

              <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                RECOMENDADO
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Funciona em Windows, Linux e macOS</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Instalação guiada passo a passo</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Detecta sistema automaticamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Interface amigável</span>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = downloadLinks.installerPy}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Universal
              </Button>

              <p className="text-xs text-center text-slate-400">
                Requer Python 3.7 ou superior.
              </p>
            </Card>

            {/* Manual - Apenas Agente */}
            <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm p-6 space-y-4 hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Download className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Manual</h3>
                  <p className="text-sm text-slate-400">Agente .PY</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Apenas o agente principal</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Para usuários avançados</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Manual de configuração</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Mais controle</span>
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => window.location.href = downloadLinks.agentPy}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Agente
              </Button>

              <p className="text-xs text-center text-slate-400">
                Manual de configuração Solicitar
              </p>
            </Card>
          </div>

          {/* Informações Adicionais */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <AlertDescription className="text-slate-300">
              <strong className="text-blue-400">Dica:</strong> Para a maioria dos usuários, recomendamos o{" "}
              <strong className="text-white">Instalador Universal (.PY)</strong> que funciona em todos os sistemas
              operacionais e oferece uma instalação guiada e intuitiva.
            </AlertDescription>
          </Alert>

          {/* Requisitos do Sistema */}
          <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm p-6">
            <h3 className="text-lg font-bold text-white mb-4">Requisitos do Sistema</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Software</h4>
                <ul className="space-y-1">
                  <li>• Python 3.7 ou superior</li>
                  <li>• Conexão com internet</li>
                  <li>• Permissões de administrador (opcional)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Sistemas Suportados</h4>
                <ul className="space-y-1">
                  <li>• Windows 10/11</li>
                  <li>• Linux (Ubuntu, Debian, Fedora, etc.)</li>
                  <li>• macOS 10.14+</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
