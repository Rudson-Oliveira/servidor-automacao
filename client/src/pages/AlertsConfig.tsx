import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Send, CheckCircle2, AlertTriangle, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AlertsConfig() {
  const { data: config, isLoading, refetch } = trpc.alerts.getConfig.useQuery();
  const [testEmail, setTestEmail] = useState("");

  const updateMutation = trpc.alerts.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const testMutation = trpc.alerts.test.useMutation({
    onSuccess: () => {
      toast.success("Email de teste enviado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar email: ${error.message}`);
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleEmailChange = (email: string) => {
    updateMutation.mutate({ emailAddress: email });
  };

  const handleSeverityChange = (severity: "low" | "medium" | "high" | "critical") => {
    updateMutation.mutate({ minSeverity: severity });
  };

  const handleTestEmail = () => {
    const email = testEmail || config?.emailAddress;
    if (!email) {
      toast.error("Digite um email para teste");
      return;
    }
    testMutation.mutate({ channel: "email" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Bell className="h-10 w-10 text-blue-600" />
            Configuração de Alertas
          </h1>
          <p className="text-gray-600">
            Configure notificações por email, WhatsApp e push
          </p>
        </div>

        {/* Instruções SMTP */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Configuração SMTP necessária:</strong> Para enviar emails, adicione as variáveis de ambiente:
            <code className="block mt-2 bg-blue-100 p-2 rounded text-sm">
              SMTP_HOST=smtp.gmail.com<br />
              SMTP_PORT=587<br />
              SMTP_USER=seu-email@gmail.com<br />
              SMTP_PASS=sua-senha-de-app<br />
              SMTP_FROM=noreply@automacao.local
            </code>
            <a 
              href="https://support.google.com/accounts/answer/185833" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Como criar senha de app do Gmail →
            </a>
          </AlertDescription>
        </Alert>

        {/* Configuração de Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Alertas por Email
                </CardTitle>
                <CardDescription>
                  Receba notificações de anomalias e predições por email
                </CardDescription>
              </div>
              <Switch
                checked={config?.emailEnabled || false}
                onCheckedChange={(checked) => handleToggle("emailEnabled", checked)}
              />
            </div>
          </CardHeader>

          {config?.emailEnabled && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email para Alertas</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  defaultValue={config.emailAddress || ""}
                  onBlur={(e) => handleEmailChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-email">Testar Envio de Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    placeholder={config.emailAddress || "email@exemplo.com"}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={handleTestEmail}
                    disabled={testMutation.isPending}
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Testar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tipos de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Alertas</CardTitle>
            <CardDescription>
              Escolha quais tipos de eventos devem gerar alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Anomalias Detectadas</Label>
                <p className="text-sm text-gray-500">
                  Alertas quando o sistema detecta comportamento anormal
                </p>
              </div>
              <Switch
                checked={config?.anomalyAlerts || false}
                onCheckedChange={(checked) => handleToggle("anomalyAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Predições de Falhas</Label>
                <p className="text-sm text-gray-500">
                  Alertas quando o ML prevê problemas futuros
                </p>
              </div>
              <Switch
                checked={config?.predictionAlerts || false}
                onCheckedChange={(checked) => handleToggle("predictionAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Erros do Sistema</Label>
                <p className="text-sm text-gray-500">
                  Alertas quando ocorrem erros críticos
                </p>
              </div>
              <Switch
                checked={config?.errorAlerts || false}
                onCheckedChange={(checked) => handleToggle("errorAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Performance</Label>
                <p className="text-sm text-gray-500">
                  Alertas sobre degradação de performance
                </p>
              </div>
              <Switch
                checked={config?.performanceAlerts || false}
                onCheckedChange={(checked) => handleToggle("performanceAlerts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Severidade Mínima */}
        <Card>
          <CardHeader>
            <CardTitle>Severidade Mínima</CardTitle>
            <CardDescription>
              Receber apenas alertas acima desta severidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={config?.minSeverity || "medium"}
              onValueChange={(value: any) => handleSeverityChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa (todos os alertas)</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica (apenas urgentes)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Status */}
        {config?.emailEnabled && config?.emailAddress && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ Sistema de alertas configurado e ativo! Você receberá notificações em <strong>{config.emailAddress}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
