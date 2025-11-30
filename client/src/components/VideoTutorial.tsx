import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "completed" | "error";
}

export default function VideoTutorial() {
  const steps: TutorialStep[] = [
    {
      id: 1,
      title: "Baixar o Instalador",
      description: "Clique no botão de download para obter o cometa.exe",
      icon: <Download className="h-5 w-5" />,
      status: "pending"
    },
    {
      id: 2,
      title: "Executar o Instalador",
      description: "Execute o arquivo cometa.exe como administrador",
      icon: <PlayCircle className="h-5 w-5" />,
      status: "pending"
    },
    {
      id: 3,
      title: "Configurar Permissões",
      description: "Autorize o acesso necessário quando solicitado",
      icon: <CheckCircle className="h-5 w-5" />,
      status: "pending"
    },
    {
      id: 4,
      title: "Validar Instalação",
      description: "Verifique se o Comet está rodando na bandeja do sistema",
      icon: <CheckCircle className="h-5 w-5" />,
      status: "pending"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Card de Vídeo Tutorial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Vídeo Tutorial de Instalação
          </CardTitle>
          <CardDescription>
            Assista ao guia passo a passo para instalar o Comet Desktop Agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder para vídeo */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center space-y-4 p-8">
              <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">Vídeo em Breve</h3>
                <p className="text-sm text-muted-foreground">
                  Tutorial em vídeo será adicionado em breve
                </p>
              </div>
              <Button variant="outline" disabled>
                Assistir Tutorial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Passos da Instalação */}
      <Card>
        <CardHeader>
          <CardTitle>Passos da Instalação</CardTitle>
          <CardDescription>
            Siga estes passos para instalar o Comet corretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Número do passo */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.id}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <h4 className="font-semibold">{step.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {step.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {step.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {step.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card de Dicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dicas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Execute como Administrador</p>
              <p className="text-muted-foreground">
                Clique com botão direito no instalador e selecione "Executar como administrador"
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Desabilite Antivírus Temporariamente</p>
              <p className="text-muted-foreground">
                Alguns antivírus podem bloquear a instalação. Desabilite temporariamente se necessário.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Verifique a Bandeja do Sistema</p>
              <p className="text-muted-foreground">
                Após a instalação, o ícone do Comet aparecerá na bandeja do sistema (system tray)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
