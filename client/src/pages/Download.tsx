import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Globe, Code, Check, ArrowRight, Monitor, Zap, Shield } from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";

/**
 * Página de Download - 3 Formas de Instalação
 * 
 * 1. Instalador .EXE (Windows)
 * 2. Link Direto (Web)
 * 3. API REST (Integração)
 */
export default function DownloadPage() {
  const { user } = useAuth();

  const handleDownloadExe = () => {
    // TODO: Implementar download do .exe
    toast.info("Download do instalador será iniciado em breve!");
    window.location.href = "/api/download/installer-windows.exe";
  };

  const handleCopyApiUrl = () => {
    const apiUrl = window.location.origin + "/api";
    navigator.clipboard.writeText(apiUrl);
    toast.success("URL da API copiada para área de transferência!");
  };

  const handleOpenWebApp = () => {
    window.location.href = "/control";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="outline">
            Versão 1.0.0 - Produção
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Baixe o {APP_TITLE}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha a melhor forma de usar o sistema de automação mais completo do mercado
          </p>
        </div>

        {/* 3 Opções de Instalação */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Opção 1: Instalador .EXE */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-bl-full" />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary">Recomendado</Badge>
              </div>
              <CardTitle className="text-2xl">Instalador Windows</CardTitle>
              <CardDescription>
                Instalação completa no seu computador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Instalação com 1 clique</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Roda em segundo plano</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Acesso local (localhost:3000)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Atualizações automáticas</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">100% privado (dados no seu PC)</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span className="font-medium">~150 MB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sistema:</span>
                  <span className="font-medium">Windows 10/11</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requisitos:</span>
                  <span className="font-medium">4GB RAM</span>
                </div>
              </div>

              <Button 
                onClick={handleDownloadExe}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Baixar Instalador (.exe)
              </Button>
            </CardContent>
          </Card>

          {/* Opção 2: Link Direto (Web) */}
          <Card className="relative overflow-hidden border-2 hover:border-green-500 transition-all hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-bl-full" />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="secondary">Mais Rápido</Badge>
              </div>
              <CardTitle className="text-2xl">Acesso Web</CardTitle>
              <CardDescription>
                Use direto no navegador, sem instalar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Sem instalação necessária</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Acesse de qualquer lugar</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Funciona em qualquer SO</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Sempre atualizado</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Sincronização em nuvem</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requisitos:</span>
                  <span className="font-medium">Navegador moderno</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conexão:</span>
                  <span className="font-medium">Internet necessária</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compatível:</span>
                  <span className="font-medium">Chrome, Edge, Firefox</span>
                </div>
              </div>

              <Button 
                onClick={handleOpenWebApp}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                <Globe className="mr-2 h-5 w-5" />
                Acessar Agora
              </Button>
            </CardContent>
          </Card>

          {/* Opção 3: API REST */}
          <Card className="relative overflow-hidden border-2 hover:border-purple-500 transition-all hover:shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-bl-full" />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Code className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="secondary">Para Devs</Badge>
              </div>
              <CardTitle className="text-2xl">API REST</CardTitle>
              <CardDescription>
                Integre com seus sistemas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">150+ endpoints REST</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Documentação completa</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Autenticação JWT</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Rate limiting inteligente</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Webhooks em tempo real</span>
                </div>
              </div>

              <Separator />

              <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs break-all">
                {window.location.origin}/api
              </div>

              <Button 
                onClick={handleCopyApiUrl}
                variant="outline"
                className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                size="lg"
              >
                <Code className="mr-2 h-5 w-5" />
                Copiar URL da API
              </Button>

              <Button 
                variant="ghost"
                className="w-full"
                onClick={() => window.open('/api/docs', '_blank')}
              >
                Ver Documentação
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recursos Principais */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Por que escolher o {APP_TITLE}?</CardTitle>
            <CardDescription>
              Sistema completo de automação com recursos avançados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Controle Desktop</h3>
                  <p className="text-sm text-muted-foreground">
                    Controle remoto completo do seu computador com segurança
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automação Inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp, Obsidian, e múltiplas IAs integradas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Auto-Healing</h3>
                  <p className="text-sm text-muted-foreground">
                    Sistema que se auto-diagnostica e corrige problemas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Qual opção devo escolher?</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Instalador .EXE:</strong> Se você quer máxima privacidade e usar offline.<br />
                <strong>Acesso Web:</strong> Se você quer começar rápido sem instalar nada.<br />
                <strong>API REST:</strong> Se você é desenvolvedor e quer integrar com outros sistemas.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">É necessário pagar?</h4>
              <p className="text-sm text-muted-foreground">
                O sistema é <strong>100% gratuito</strong> para uso pessoal. Para uso comercial, entre em contato.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Meus dados estão seguros?</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Sim!</strong> Com o instalador .EXE, todos os dados ficam no seu computador. Com acesso web, usamos criptografia de ponta a ponta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
