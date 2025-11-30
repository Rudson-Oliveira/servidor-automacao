/**
 * 🚀 PORTAL DE INSTALAÇÃO
 * Página centralizada para download e instalação de agentes
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Monitor, 
  Globe, 
  Smartphone,
  Code,
  FileCode,
  Package,
  ExternalLink,
  Copy,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function InstallationPortal() {
  const [selectedMethod, setSelectedMethod] = useState<"exe" | "api" | "manual">("exe");

  // Query para status da instalação
  const { data: installStatus, isLoading } = trpc.install.status.useQuery();

  // Query para lista de downloads
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

  const fetchDownloads = async () => {
    setLoadingDownloads(true);
    try {
      const response = await fetch("/api/download/list");
      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (error) {
      toast.error("Erro ao carregar lista de downloads");
    } finally {
      setLoadingDownloads(false);
    }
  };

  useState(() => {
    fetchDownloads();
  });

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Download iniciado: ${filename}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                🚀 Portal de Instalação
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Instale o Manus Desktop Agent em 3 cliques
              </p>
            </div>
            
            {installStatus && (
              <Card className="w-64">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Agentes Ativos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {installStatus.stats?.online_agents || 0}
                      </p>
                    </div>
                    <Monitor className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exe" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Instalador .exe
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API Programática
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Instalação Manual
            </TabsTrigger>
          </TabsList>

          {/* MÉTODO 1: Instalador .exe */}
          <TabsContent value="exe" className="space-y-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Recomendado para usuários leigos.</strong> Não requer conhecimento técnico.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Instalador Autocontido Windows
                </CardTitle>
                <CardDescription>
                  Baixe e execute o instalador. Tudo será configurado automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download Button */}
                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => handleDownload("/api/download/installer.exe", "ManusDesktopAgentInstaller.exe")}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Baixar Instalador (.exe)
                  </Button>
                  
                  {downloads.find((d) => d.filename === "ManusDesktopAgentInstaller.exe")?.available ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Indisponível
                    </Badge>
                  )}
                </div>

                {/* Instruções */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">📋 Instruções de Instalação:</h4>
                  <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <span>Baixe o instalador clicando no botão acima</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <span>Execute o arquivo <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">ManusDesktopAgentInstaller.exe</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <span>Siga as instruções na tela (instalação automática)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">4.</span>
                      <span>O agente será registrado automaticamente no servidor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">5.</span>
                      <span>Instale a extensão do navegador conforme instruído</span>
                    </li>
                  </ol>
                </div>

                {/* Recursos Incluídos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Agente Desktop</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Extensão Navegador</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Registro Automático</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Inicialização Automática</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MÉTODO 2: API Programática */}
          <TabsContent value="api" className="space-y-6">
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                <strong>Para desenvolvedores.</strong> Integre a instalação via API REST.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API de Instalação Programática
                </CardTitle>
                <CardDescription>
                  Registre agentes automaticamente via HTTP POST
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Endpoint de Registro */}
                <div>
                  <Label className="text-sm font-semibold">Endpoint de Registro</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 bg-slate-900 text-green-400 px-4 py-2 rounded-lg text-sm">
                      POST {window.location.origin}/api/trpc/install.desktopAgent
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/trpc/install.desktopAgent`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Exemplo de Request */}
                <div>
                  <Label className="text-sm font-semibold">Exemplo de Request (JSON)</Label>
                  <div className="relative mt-2">
                    <pre className="bg-slate-900 text-green-400 px-4 py-3 rounded-lg text-xs overflow-x-auto">
{`{
  "hostname": "DESKTOP-ABC123",
  "machine_id": "12345678",
  "agent_version": "1.0.0",
  "os": "win32",
  "python_version": "3.11.0"
}`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`{
  "hostname": "DESKTOP-ABC123",
  "machine_id": "12345678",
  "agent_version": "1.0.0",
  "os": "win32",
  "python_version": "3.11.0"
}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Exemplo de Response */}
                <div>
                  <Label className="text-sm font-semibold">Exemplo de Response</Label>
                  <pre className="bg-slate-900 text-blue-400 px-4 py-3 rounded-lg text-xs overflow-x-auto mt-2">
{`{
  "success": true,
  "message": "Agente registrado com sucesso",
  "agent_id": "agent_1234567890_abc123",
  "token": "a1b2c3d4e5f6...",
  "is_new": true
}`}
                  </pre>
                </div>

                {/* Exemplo de Código Python */}
                <div>
                  <Label className="text-sm font-semibold">Exemplo de Código (Python)</Label>
                  <div className="relative mt-2">
                    <pre className="bg-slate-900 text-yellow-400 px-4 py-3 rounded-lg text-xs overflow-x-auto">
{`import requests
import socket
import uuid

response = requests.post(
    "${window.location.origin}/api/trpc/install.desktopAgent",
    json={
        "hostname": socket.gethostname(),
        "machine_id": str(uuid.getnode()),
        "agent_version": "1.0.0",
        "os": "win32"
    }
)

data = response.json()
token = data["token"]
agent_id = data["agent_id"]

print(f"Token: {token}")
print(f"Agent ID: {agent_id}")`}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`import requests
import socket
import uuid

response = requests.post(
    "${window.location.origin}/api/trpc/install.desktopAgent",
    json={
        "hostname": socket.gethostname(),
        "machine_id": str(uuid.getnode()),
        "agent_version": "1.0.0",
        "os": "win32"
    }
)

data = response.json()
token = data["token"]
agent_id = data["agent_id"]

print(f"Token: {token}")
print(f"Agent ID: {agent_id}")`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Documentação */}
                <Button variant="outline" className="w-full" asChild>
                  <a href="/api/documentation" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Documentação Completa da API
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MÉTODO 3: Instalação Manual */}
          <TabsContent value="manual" className="space-y-6">
            <Alert>
              <FileCode className="h-4 w-4" />
              <AlertDescription>
                <strong>Para usuários avançados.</strong> Instalação passo a passo manual.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Instalação Manual
                </CardTitle>
                <CardDescription>
                  Baixe os componentes individualmente e configure manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Downloads Individuais */}
                <div className="space-y-4">
                  {downloads.map((download, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{download.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {download.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {download.available ? (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(download.url, download.filename)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        ) : (
                          <Badge variant="secondary">Indisponível</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instruções Manuais */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">📋 Passos de Instalação Manual:</h4>
                  <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <div>
                        <p className="font-semibold">Instalar Python 3.8+</p>
                        <p className="text-xs">Baixe de <a href="https://python.org" target="_blank" className="text-blue-600 underline">python.org</a></p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <div>
                        <p className="font-semibold">Instalar Dependências</p>
                        <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded block mt-1">
                          pip install pillow psutil requests websockets pywin32
                        </code>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <div>
                        <p className="font-semibold">Baixar Agente Desktop</p>
                        <p className="text-xs">Use o botão "Baixar" acima para desktop_agent.py</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">4.</span>
                      <div>
                        <p className="font-semibold">Registrar Agente</p>
                        <p className="text-xs">Use a API de instalação (aba "API Programática")</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">5.</span>
                      <div>
                        <p className="font-semibold">Configurar Extensão</p>
                        <p className="text-xs">Baixe e instale a extensão do navegador</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status do Sistema */}
        {installStatus && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {installStatus.stats?.total_agents || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total de Agentes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {installStatus.stats?.online_agents || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Online</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-600">
                    {installStatus.stats?.offline_agents || 0}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
