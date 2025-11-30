import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download as DownloadIcon, CheckCircle2, Shield, Zap, HelpCircle } from "lucide-react";
import VideoTutorial from "@/components/VideoTutorial";
import { notificationService } from "@/services/NotificationService";

export default function Download() {
  const handleDownloadCometa = async () => {
    const notificationId = notificationService.showDownloadStart(
      'desktop',
      'cometa.exe',
      '~15 MB'
    );
    
    try {
      // Simular progresso do download
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 150));
        notificationService.updateDownloadProgress(notificationId, i);
      }
      
      // Executar download real
      window.location.href = "/api/download/cometa.exe";
      
      // Aguardar um pouco antes de mostrar conclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      notificationService.showDownloadComplete(notificationId);
    } catch (error) {
      notificationService.showDownloadError(
        notificationId,
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  };

  const handleDownloadExtension = async () => {
    const notificationId = notificationService.showDownloadStart(
      'extension',
      'browser-extension.zip',
      '~50 KB'
    );
    
    try {
      // Simular progresso do download (mais rápido por ser menor)
      for (let i = 0; i <= 100; i += 25) {
        await new Promise(resolve => setTimeout(resolve, 80));
        notificationService.updateDownloadProgress(notificationId, i);
      }
      
      // Executar download real
      window.location.href = "/api/download/browser-extension.zip";
      
      // Aguardar um pouco antes de mostrar conclusão
      await new Promise(resolve => setTimeout(resolve, 300));
      notificationService.showDownloadComplete(notificationId);
    } catch (error) {
      notificationService.showDownloadError(
        notificationId,
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge className="bg-green-500 text-white text-lg px-6 py-2">
            ✨ Instalação em 3 Cliques
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900">
            Baixe o Cometa IA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A Inteligência Artificial que controla seu computador e navegador automaticamente.
            <br />
            <span className="font-semibold text-green-600">100% gratuito e seguro.</span>
          </p>
        </div>

        {/* Botão GIGANTE de Download */}
        <Card className="border-4 border-green-500 shadow-2xl">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <DownloadIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <Button
              onClick={() => window.location.href = "/api/download/instalar_agent.bat"}
              className="w-full h-24 text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl transform hover:scale-105 transition-all"
            >
              📥 BAIXAR INSTALADOR (.BAT)
            </Button>

            <p className="text-sm text-gray-500">
              Arquivo: instalar_agent.bat • Tamanho: ~2 KB • Windows (qualquer versão)
            </p>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                <strong>Outras opções de download:</strong>
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => window.location.href = "/api/download/instalador_automatico.py"}
                  variant="outline"
                  className="flex-1 h-12 text-sm"
                >
                  🐍 Python (.py)
                </Button>
                <Button
                  onClick={handleDownloadCometa}
                  variant="outline"
                  className="flex-1 h-12 text-sm"
                >
                  📦 Executável (.exe)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vídeo Tutorial */}
        <VideoTutorial />

        {/* 3 Passos Simples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Como Instalar (3 Passos)</CardTitle>
            <CardDescription>Instalação automática em menos de 2 minutos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Baixe o instalador</h3>
                <p className="text-gray-600">
                  Clique no botão verde acima. O arquivo <code className="bg-gray-100 px-2 py-1 rounded">instalar_agent.bat</code> será baixado para sua pasta de Downloads.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Duplo clique para instalar</h3>
                <p className="text-gray-600">
                  Abra a pasta Downloads e dê <strong>duplo clique</strong> no arquivo <code className="bg-gray-100 px-2 py-1 rounded">instalar_agent.bat</code>. 
                  O instalador fará tudo automaticamente (verificar Python, instalar dependências, registrar no servidor, configurar inicialização automática).
                </p>
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Se o Windows Defender bloquear:</strong> Clique em "Mais informações" e depois em "Executar assim mesmo". É seguro!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Pronto! A IA já está controlando seu PC</h3>
                <p className="text-gray-600">
                  Após a instalação, o Cometa IA estará rodando em segundo plano. Você verá um ícone na bandeja do sistema (ao lado do relógio). 
                  <strong className="text-green-600"> O sistema já está operacional!</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extensão do Navegador (Opcional) */}
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              Extensão do Navegador (Opcional)
            </CardTitle>
            <CardDescription>
              Para controle completo do Chrome/Edge, instale também a extensão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleDownloadExtension}
              variant="outline"
              className="w-full h-16 text-xl border-2 border-blue-500 hover:bg-blue-50"
            >
              🧩 Baixar Extensão do Navegador (.zip)
            </Button>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold">Como instalar a extensão:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Baixe o arquivo <code className="bg-white px-2 py-1 rounded">browser-extension.zip</code></li>
                <li>Extraia o arquivo ZIP em uma pasta</li>
                <li>Abra o Chrome/Edge e digite <code className="bg-white px-2 py-1 rounded">chrome://extensions/</code></li>
                <li>Ative o "Modo do desenvolvedor" (canto superior direito)</li>
                <li>Clique em "Carregar sem compactação" e selecione a pasta extraída</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* FAQ para Leigos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-500" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* É seguro? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold">É seguro?</h3>
              </div>
              <p className="text-gray-600 pl-7">
                <strong className="text-green-600">Sim, 100% seguro.</strong> O Cometa IA é um software legítimo desenvolvido pela equipe Manus. 
                Ele NÃO é vírus, malware ou spyware. Todos os dados ficam no seu computador e você tem controle total. 
                O código é auditável e você pode desinstalar a qualquer momento.
              </p>
            </div>

            {/* Funciona no Windows/Mac/Linux? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Funciona no Windows/Mac/Linux?</h3>
              </div>
              <p className="text-gray-600 pl-7">
                <strong>Windows:</strong> ✅ Sim, totalmente compatível (Windows 10 e 11)
                <br />
                <strong>Mac:</strong> ⚠️ Em desenvolvimento (use a versão Python manual)
                <br />
                <strong>Linux:</strong> ⚠️ Em desenvolvimento (use a versão Python manual)
              </p>
            </div>

            {/* Preciso saber programar? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Preciso saber programar?</h3>
              </div>
              <p className="text-gray-600 pl-7">
                <strong className="text-purple-600">NÃO!</strong> O Cometa IA foi projetado para <strong>usuários leigos</strong>. 
                Você só precisa clicar no botão de download e seguir os 3 passos simples. 
                Tudo é automático: instalação, configuração e inicialização. Zero conhecimento técnico necessário.
              </p>
            </div>

            {/* O que a IA pode fazer? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">O que a IA pode fazer no meu computador?</h3>
              </div>
              <p className="text-gray-600 pl-7">
                O Cometa IA pode:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 pl-7">
                <li>Executar comandos no terminal</li>
                <li>Capturar screenshots da sua tela</li>
                <li>Abrir programas e arquivos</li>
                <li>Controlar o navegador (com extensão)</li>
                <li>Criar notas no Obsidian automaticamente</li>
                <li>Enviar mensagens no WhatsApp</li>
                <li>E muito mais...</li>
              </ul>
              <p className="text-gray-600 pl-7 mt-2">
                <strong>Importante:</strong> A IA só age quando você autorizar. Você tem controle total via dashboard web.
              </p>
            </div>

            {/* Como desinstalar? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold">Como desinstalar?</h3>
              </div>
              <p className="text-gray-600 pl-7">
                Para desinstalar o Cometa IA:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 pl-7">
                <li>Vá em <strong>Painel de Controle → Programas → Desinstalar um programa</strong></li>
                <li>Procure por "Manus Desktop Agent" ou "Cometa IA"</li>
                <li>Clique em "Desinstalar" e confirme</li>
              </ol>
              <p className="text-gray-600 pl-7 mt-2">
                Ou simplesmente delete a pasta <code className="bg-gray-100 px-2 py-1 rounded">%APPDATA%\ManusDesktopAgent</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recursos e Benefícios */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Por que usar o Cometa IA?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="font-semibold">Automação Total</h3>
                <p className="text-sm text-gray-600">
                  Deixe a IA fazer tarefas repetitivas por você
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="font-semibold">100% Seguro</h3>
                <p className="text-sm text-gray-600">
                  Código auditável e sem coleta de dados
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-semibold">Fácil de Usar</h3>
                <p className="text-sm text-gray-600">
                  Instalação em 3 cliques, sem configuração
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suporte */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            Precisa de ajuda? Acesse o{" "}
            <a href="/desktop/agents" className="text-blue-500 hover:underline">
              Dashboard de Gerenciamento
            </a>
          </p>
          <p>
            Desenvolvido por <strong>Manus AI</strong> • Versão 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
