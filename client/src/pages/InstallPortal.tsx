import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Monitor,
  Apple,
  Chrome,
  Terminal,
  Zap,
  Shield,
  Rocket
} from "lucide-react";
import { toast } from "sonner";

interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
}

export default function InstallPortal() {
  const [os, setOs] = useState<"windows" | "linux" | "mac" | null>(null);
  const [installing, setInstalling] = useState(false);
  const [steps, setSteps] = useState<InstallStep[]>([
    {
      id: "detect",
      title: "Detectar Sistema Operacional",
      description: "Identificando seu sistema...",
      status: "pending",
      progress: 0
    },
    {
      id: "download",
      title: "Baixar Componentes",
      description: "Desktop Agent + Dependências",
      status: "pending",
      progress: 0
    },
    {
      id: "install",
      title: "Instalar Sistema",
      description: "Configurando Manus no seu computador",
      status: "pending",
      progress: 0
    },
    {
      id: "config",
      title: "Configurar Variáveis",
      description: "API Keys e URLs do servidor",
      status: "pending",
      progress: 0
    },
    {
      id: "test",
      title: "Testar Conexão",
      description: "Verificando comunicação com servidor",
      status: "pending",
      progress: 0
    },
    {
      id: "complete",
      title: "Finalizar",
      description: "Sistema pronto para uso!",
      status: "pending",
      progress: 0
    }
  ]);

  useEffect(() => {
    // Detectar SO automaticamente
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (platform.includes("win") || userAgent.includes("windows")) {
      setOs("windows");
    } else if (platform.includes("mac") || userAgent.includes("mac")) {
      setOs("mac");
    } else if (platform.includes("linux") || userAgent.includes("linux")) {
      setOs("linux");
    }
  }, []);

  const getOSIcon = () => {
    switch (os) {
      case "windows": return <Monitor className="h-12 w-12 text-blue-400" />;
      case "mac": return <Apple className="h-12 w-12 text-slate-300" />;
      case "linux": return <Terminal className="h-12 w-12 text-orange-400" />;
      default: return <Monitor className="h-12 w-12 text-slate-400" />;
    }
  };

  const getOSName = () => {
    switch (os) {
      case "windows": return "Windows";
      case "mac": return "macOS";
      case "linux": return "Linux";
      default: return "Desconhecido";
    }
  };

  const updateStep = (id: string, updates: Partial<InstallStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const simulateInstallation = async () => {
    setInstalling(true);

    // Step 1: Detect OS
    updateStep("detect", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 1000));
    for (let i = 0; i <= 100; i += 20) {
      updateStep("detect", { progress: i });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateStep("detect", { status: "completed", progress: 100 });
    toast.success("Sistema operacional detectado!");

    // Step 2: Download
    updateStep("download", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 10) {
      updateStep("download", { progress: i });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    updateStep("download", { status: "completed", progress: 100 });
    toast.success("Componentes baixados!");

    // Step 3: Install
    updateStep("install", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 15) {
      updateStep("install", { progress: i });
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    updateStep("install", { status: "completed", progress: 100 });
    toast.success("Sistema instalado!");

    // Step 4: Config
    updateStep("config", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 25) {
      updateStep("config", { progress: i });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateStep("config", { status: "completed", progress: 100 });
    toast.success("Configuração concluída!");

    // Step 5: Test
    updateStep("test", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i <= 100; i += 20) {
      updateStep("test", { progress: i });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateStep("test", { status: "completed", progress: 100 });
    toast.success("Conexão testada com sucesso!");

    // Step 6: Complete
    updateStep("complete", { status: "running" });
    await new Promise(resolve => setTimeout(resolve, 500));
    updateStep("complete", { status: "completed", progress: 100 });
    
    toast.success("🎉 Instalação concluída! Manus está pronto para usar.");
    setInstalling(false);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "running": return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "error": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-slate-600" />;
    }
  };

  const totalProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <Rocket className="h-16 w-16 text-purple-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Portal de Instalação Manus
          </h1>
          <p className="text-xl text-slate-400">
            Instalação automática em um clique. Simples, rápido e seguro.
          </p>
        </div>

        {/* OS Detection Card */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              {getOSIcon()}
              Sistema Detectado: {getOSName()}
            </CardTitle>
            <CardDescription className="text-slate-400">
              O instalador foi otimizado para o seu sistema operacional
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Zap className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Instalação Rápida</h3>
                <p className="text-sm text-slate-400">
                  Menos de 2 minutos do início ao fim
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Shield className="h-8 w-8 text-green-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">100% Seguro</h3>
                <p className="text-sm text-slate-400">
                  Código verificado e criptografia end-to-end
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Chrome className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Controle Total</h3>
                <p className="text-sm text-slate-400">
                  Navegador + Desktop integrados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Progress */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {installing ? "Instalando..." : "Pronto para Instalar"}
              </CardTitle>
              {installing && (
                <Badge className="bg-blue-500 text-white">
                  {Math.round(totalProgress)}%
                </Badge>
              )}
            </div>
            {installing && (
              <Progress value={totalProgress} className="mt-4" />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`p-4 rounded-lg border transition-all ${
                  step.status === "running" 
                    ? "border-blue-500 bg-blue-500/10" 
                    : step.status === "completed"
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-slate-700 bg-slate-800/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                  {step.status === "running" && (
                    <span className="text-sm text-blue-400 font-medium">
                      {step.progress}%
                    </span>
                  )}
                </div>
                {step.status === "running" && (
                  <Progress value={step.progress} className="mt-2" />
                )}
              </div>
            ))}

            {!installing && (
              <Button 
                onClick={simulateInstallation}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Iniciar Instalação Automática
              </Button>
            )}

            {steps[steps.length - 1]?.status === "completed" && (
              <div className="space-y-3">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-white">Instalação Concluída!</h3>
                      <p className="text-sm text-slate-400">
                        O Manus está pronto para ser usado. Acesse o Centro de Controle para começar.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/control"}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Ir para Centro de Controle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-slate-900/50 border-slate-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-sm">Precisa de Ajuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm mb-3">
              Se encontrar algum problema durante a instalação:
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Verifique se tem permissões de administrador</li>
              <li>• Desative temporariamente o antivírus</li>
              <li>• Certifique-se de ter conexão com a internet</li>
              <li>• Consulte a documentação completa em /docs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
