import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState, useEffect } from "react";

interface HealingAction {
  id: string;
  timestamp: Date;
  issue: string;
  action: string;
  status: "success" | "failed" | "in_progress";
  duration?: number;
}

export default function AutoHealing() {
  const { user, loading, isAuthenticated } = useAuth();
  const [healingActions, setHealingActions] = useState<HealingAction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    // Simular ações de auto-healing (substituir por dados reais da API)
    const mockActions: HealingAction[] = [
      {
        id: "1",
        timestamp: new Date(Date.now() - 300000),
        issue: "Alta latência detectada no servidor",
        action: "Reiniciado serviço de cache",
        status: "success",
        duration: 2.3
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 600000),
        issue: "Memória acima de 85%",
        action: "Limpeza de cache e otimização",
        status: "success",
        duration: 5.1
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 900000),
        issue: "Conexão com banco de dados instável",
        action: "Reconexão automática estabelecida",
        status: "success",
        duration: 1.8
      }
    ];
    setHealingActions(mockActions);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para acessar o Auto-Healing</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: HealingAction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: HealingAction["status"]) => {
    const variants = {
      success: "default",
      failed: "destructive",
      in_progress: "secondary"
    } as const;

    const labels = {
      success: "Resolvido",
      failed: "Falhou",
      in_progress: "Em Progresso"
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Auto-Healing</h1>
              <p className="text-xs text-muted-foreground">Sistema de Autocorreção Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isMonitoring ? "default" : "secondary"} className="gap-1.5">
              <Activity className="h-3 w-3" />
              {isMonitoring ? "Monitorando" : "Pausado"}
            </Badge>
            <span className="text-sm text-muted-foreground">Olá, {user?.name || "Usuário"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Status Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Executadas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healingActions.length}</div>
              <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">Todas as ações bem-sucedidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.1s</div>
              <p className="text-xs text-muted-foreground">Tempo de resolução</p>
            </CardContent>
          </Card>
        </div>

        {/* Healing Actions List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Auto-Healing</CardTitle>
            <CardDescription>
              Ações automáticas executadas pelo sistema para manter a saúde da aplicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">{getStatusIcon(action.status)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{action.issue}</p>
                      {getStatusBadge(action.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.action}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{action.timestamp.toLocaleString("pt-BR")}</span>
                      {action.duration && <span>Duração: {action.duration}s</span>}
                    </div>
                  </div>
                </div>
              ))}

              {healingActions.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma ação de auto-healing registrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
